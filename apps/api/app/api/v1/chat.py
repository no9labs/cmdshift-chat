from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Dict, AsyncGenerator, Optional
import json
import asyncio
import traceback
import logging
import tiktoken
import uuid
from datetime import datetime
import redis.asyncio as redis
from app.core.config import settings, Settings
from app.services.router import ModelRouter
from app.services.memory import MemoryManager
from app.services.subscription import SubscriptionService
from app.providers.base import BaseProvider
from app.providers.deepseek import DeepSeekProvider
from app.providers.glm import GLMProvider
from app.providers.qwen import QwenProvider
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()
memory_manager = MemoryManager()

# Initialize tiktoken encoder (using cl100k_base which is used by GPT-3.5/4)
try:
    encoding = tiktoken.get_encoding("cl100k_base")
except:
    encoding = None
    logger.warning("Failed to initialize tiktoken encoder")

def count_tokens(text: str) -> int:
    """Count tokens in text using tiktoken"""
    if encoding:
        try:
            return len(encoding.encode(text))
        except:
            # Fallback to rough estimation
            return len(text) // 4
    else:
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4

async def update_token_usage(
    user_id: str,
    input_tokens: int,
    output_tokens: int,
    redis_client: redis.Redis,
    model: str
):
    """Update user's token usage in Redis with model tracking"""
    if not user_id or user_id == "anonymous":
        return
        
    try:
        # Use local timezone to match subscription service
        date_key = datetime.now().strftime("%Y-%m-%d")
        usage_key = f"usage:{user_id}:{date_key}"
        
        # Increment token counts
        await redis_client.hincrby(usage_key, "input_tokens", input_tokens)
        await redis_client.hincrby(usage_key, "output_tokens", output_tokens)
        await redis_client.hincrby(usage_key, "total_tokens", input_tokens + output_tokens)
        
        # Track model-specific usage
        await redis_client.hincrby(usage_key, f"model:{model}:tokens", input_tokens + output_tokens)
        
        # Set expiry to 30 days
        await redis_client.expire(usage_key, 30 * 24 * 60 * 60)
        
    except Exception as e:
        logger.error(f"Failed to update token usage: {e}")

def get_provider(provider_name: str, settings: Settings) -> BaseProvider:
    """Get provider instance with proper API key configuration"""
    if provider_name == "deepseek":
        return DeepSeekProvider(api_key=settings.DEEPSEEK_API_KEY)
    elif provider_name == "glm":
        return GLMProvider(api_key=settings.GLM_API_KEY)
    elif provider_name == "qwen":
        return QwenProvider(api_key=settings.QWEN_API_KEY)
    else:
        raise ValueError(f"Unknown provider: {provider_name}")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "auto"
    temperature: float = 0.7
    stream: bool = True
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None

async def stream_response(
    provider: BaseProvider,
    messages: List[ChatMessage],
    model: str,
    temperature: float,
    conversation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    redis_client: Optional[redis.Redis] = None,
    subscription_service: Optional[SubscriptionService] = None
) -> AsyncGenerator[str, None]:
    """Stream response from LLM provider with token counting"""
    logger.info(f"stream_response called with model: {model}, provider: {type(provider).__name__}")
    
    # Count input tokens
    input_text = "".join([msg.content for msg in messages])
    input_tokens = count_tokens(input_text)
    
    full_response = ""
    try:
        async for chunk in provider.stream(messages, model, temperature):
            # Accumulate the response
            full_response += chunk
            # Format as SSE
            data = json.dumps({"content": chunk})
            yield f"data: {data}\n\n"
    except Exception as e:
        error_data = json.dumps({"error": str(e)})
        yield f"data: {error_data}\n\n"
    finally:
        yield "data: [DONE]\n\n"
        
        # Count output tokens
        output_tokens = count_tokens(full_response)
        
        # Update token usage if user_id and redis_client provided
        if user_id and redis_client:
            asyncio.create_task(
                update_token_usage(
                    user_id,
                    input_tokens,
                    output_tokens,
                    redis_client,
                    model
                )
            )
            
            # Increment message count for subscription limits
            if subscription_service and user_id:
                try:
                    await subscription_service.increment_usage(user_id)
                except Exception as e:
                    logger.warning(f"Failed to increment usage count: {e}")
        
        # Store the complete conversation including assistant response if conversation_id provided
        if conversation_id and full_response and user_id:
            assistant_message = ChatMessage(role="assistant", content=full_response)
            all_messages = messages + [assistant_message]
            asyncio.create_task(
                memory_manager.store_conversation(
                    conversation_id,
                    user_id,
                    all_messages,
                    model
                )
            )

@router.post("/completions")
async def chat_completions(request: ChatRequest, req: Request):
    """Main chat endpoint with intelligent routing"""
    try:
        # Get model router with Redis connection
        model_router = ModelRouter(redis_client=req.app.state.redis)
        
        # Initialize subscription service
        subscription_service = SubscriptionService(redis_client=req.app.state.redis)
        
        # Check usage limits if user_id is provided
        remaining_messages = -1  # -1 means unlimited
        if request.user_id:
            try:
                allowed, remaining, limit = await subscription_service.check_usage_limit(request.user_id)
                remaining_messages = remaining
                
                if not allowed:
                    # Determine appropriate upgrade message based on current tier
                    tier = await subscription_service.get_user_tier(request.user_id)
                    upgrade_message = ""
                    if tier.value == "FREE":
                        upgrade_message = "Upgrade to Starter ($9.99/mo) for 2,000 messages per month or Pro ($19.99/mo) for unlimited messages."
                    elif tier.value == "STARTER":
                        upgrade_message = "Upgrade to Pro ($19.99/mo) for unlimited messages."
                    
                    raise HTTPException(
                        status_code=429,
                        detail=f"Usage limit exceeded. You've reached your {limit} message{'s' if limit != 1 else ''} limit. {upgrade_message}"
                    )
            except HTTPException:
                # Re-raise HTTP exceptions (like 429 rate limit)
                raise
            except Exception as e:
                # Log error but don't block if subscription check fails
                logger.warning(f"Subscription check failed: {e}. Allowing request to proceed.")
        
        # Generate conversation_id if not provided
        if not request.conversation_id:
            request.conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation_id: {request.conversation_id}")
        
        # Keep as ChatMessage objects
        messages = request.messages
        
        # Get conversation context if conversation_id provided
        if request.conversation_id and request.user_id:
            context = await memory_manager.get_context(
                request.conversation_id,
                request.user_id
            )
            # Convert context dicts to ChatMessage objects and prepend
            context_messages = [ChatMessage(**msg) for msg in context]
            messages = context_messages + messages
        
        # Route to best model
        if request.model == "auto":
            selected_model_enum, selection_reason = await model_router.select_model(
                query=messages[-1].content,
                user_preference=request.model,
                context_length=sum(len(m.content) for m in messages)
            )
            logger.info(f"Model selection: {selected_model_enum} (reason: {selection_reason})")
            logger.info(f"Model value: {selected_model_enum.value}")
            selected_model = selected_model_enum.value
            logger.info(f"Selected model string: {selected_model}")
        else:
            selected_model = request.model
            logger.info(f"Using user-specified model: {selected_model}")
        
        # Get provider
        # Extract provider name from model string
        # Special handling: qwen3-2507 → qwen (not qwen3)
        # Standard format: deepseek-chat → deepseek, glm-4.5 → glm
        if selected_model.startswith("qwen3"):
            provider_name = "qwen"  # Map qwen3-* models to qwen provider
        else:
            provider_name = selected_model.split("-")[0]  # Standard extraction
        logger.info(f"Provider name extracted: {provider_name}")
        try:
            provider = get_provider(provider_name, settings)
            logger.info(f"Provider created successfully: {type(provider).__name__}")
        except ValueError as e:
            logger.error(f"Failed to get provider: {e}")
            raise HTTPException(400, str(e))
        
        # Note: Conversation will be stored after response completes
        
        # Stream or return response
        logger.info(f"About to call provider with model: {selected_model}, streaming: {request.stream}")
        if request.stream:
            return StreamingResponse(
                stream_response(
                    provider, 
                    messages, 
                    selected_model, 
                    request.temperature,
                    request.conversation_id,
                    request.user_id if request.user_id else "anonymous",
                    req.app.state.redis,
                    subscription_service
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Selected-Model": selected_model,
                    "X-Messages-Remaining": str(remaining_messages),
                    "X-Conversation-Id": request.conversation_id
                }
            )
        else:
            # Non-streaming response
            # Count input tokens
            input_text = "".join([msg.content for msg in messages])
            input_tokens = count_tokens(input_text)
            
            response = await provider.complete(messages, selected_model, request.temperature)
            
            # Count output tokens
            output_tokens = count_tokens(response.content)
            
            # Update token usage if user_id provided
            if request.user_id:
                asyncio.create_task(
                    update_token_usage(
                        request.user_id,
                        input_tokens,
                        output_tokens,
                        req.app.state.redis,
                        selected_model
                    )
                )
                
                # Increment message count for subscription limits
                try:
                    await subscription_service.increment_usage(request.user_id)
                except Exception as e:
                    logger.warning(f"Failed to increment usage count: {e}")
            
            # Store the complete conversation including assistant response if conversation_id provided
            if request.conversation_id and request.user_id:
                assistant_message = ChatMessage(role="assistant", content=response)
                all_messages = messages + [assistant_message]
                asyncio.create_task(
                    memory_manager.store_conversation(
                        request.conversation_id,
                        request.user_id if request.user_id else "anonymous",
                        all_messages,
                        selected_model
                    )
                )
            
            return JSONResponse(
                content={
                    "choices": [{
                        "message": {"role": "assistant", "content": response.content},
                        "finish_reason": "stop"
                    }],
                    "model": selected_model,
                    "usage": {
                        "prompt_tokens": input_tokens,
                        "completion_tokens": output_tokens,
                        "total_tokens": input_tokens + output_tokens
                    },
                    "messages_remaining": remaining_messages,
                    "conversation_id": request.conversation_id
                },
                headers={
                    "X-Selected-Model": selected_model,
                    "X-Messages-Remaining": str(remaining_messages),
                    "X-Conversation-Id": request.conversation_id
                }
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions (like 429 rate limit)
        raise
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models(request: Request):
    """List available models and their status"""
    # Get model router with Redis connection
    model_router = ModelRouter(redis_client=request.app.state.redis)
    
    # Define available providers
    provider_names = ["deepseek", "glm", "qwen"]
    
    models = []
    for provider_name in provider_names:
        try:
            provider = get_provider(provider_name, settings)
            for model in provider.available_models:
                models.append({
                    "id": model,
                    "provider": provider_name,
                    "status": "available",  # TODO: Add health checks
                    "capabilities": model_router.models.get(model, {})
                })
        except Exception:
            # Skip providers that fail to initialize (e.g., missing API key)
            continue
    
    return {"models": models}