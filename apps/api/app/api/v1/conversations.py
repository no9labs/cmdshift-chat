from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Optional, Any
import json
import logging
from app.services.memory import MemoryManager
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()
memory_manager = MemoryManager()

class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    model: Optional[str] = None

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user_id: str,
    request: Request,
    limit: int = 50
) -> Dict[str, Any]:
    """Get messages for a specific conversation"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get messages from memory manager
        messages = await memory_manager.get_context(
            conversation_id=conversation_id,
            user_id=user_id,
            max_messages=limit
        )
        
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "count": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Error fetching conversation messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_conversations(
    user_id: str,
    request: Request,
    limit: int = 20
) -> Dict[str, Any]:
    """List user's conversations"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get conversations from memory manager
        conversations = await memory_manager.get_user_conversations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "conversations": conversations,
            "count": len(conversations)
        }
        
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str,
    request: Request
) -> Dict[str, str]:
    """Delete a conversation"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Clear conversation from memory
        await memory_manager.clear_conversation(
            conversation_id=conversation_id,
            user_id=user_id
        )
        
        return {"message": "Conversation deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-title")
async def generate_title(request: Request):
    """Generate and save a smart title for a conversation"""
    try:
        # Parse request body
        body = await request.json()
        conversation_id = body.get("conversation_id")
        user_id = body.get("user_id")
        messages = body.get("messages", [])
        
        if not conversation_id or not user_id or not messages:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Create prompt for title generation
        user_msg = messages[0].get("content", "") if messages else ""
        assistant_msg = messages[1].get("content", "")[:200] if len(messages) > 1 else ""
        
        title_prompt = f"""Generate a very short (2-4 words) conversation title based on this exchange:
User: {user_msg}
Assistant: {assistant_msg[:200]}...

Return ONLY the title, no quotes, no explanation. Examples:
- "Python Debugging Help"
- "Weather Query"
- "Introduction"
- "Code Review Request"

Title:"""
        
        # Import required modules
        from app.core.config import settings
        from app.api.v1.chat import get_provider, ChatMessage
        
        # Use DeepSeek for reliable title generation
        provider = get_provider("deepseek", settings)
        
        # Generate title with the model
        title_messages = [ChatMessage(role="user", content=title_prompt)]
        response = await provider.complete(
            messages=title_messages,
            model="deepseek-chat",
            temperature=0.5,  # Slightly more creative
            max_tokens=100  # Give DeepSeek room to think AND output
        )
        
        title = response.content.strip()[:50] if response.content else f"Chat {conversation_id[:8]}"
        
        # Save title to Redis conversation metadata
        redis_client = request.app.state.redis
        conv_key = f"conv:meta:{user_id}:{conversation_id}"
        
        await redis_client.hset(conv_key, "title", title)
        await redis_client.hset(conv_key, "last_message", messages[0].get("content", ""))
        
        logger.info(f"Generated title '{title}' for conversation {conversation_id}")
        
        return {"title": title, "success": True}
        
    except Exception as e:
        logger.error(f"Failed to generate title: {e}")
        raise HTTPException(status_code=500, detail=str(e))