from typing import Dict, List, Optional, AsyncGenerator
import json
import time
import logging
from .base import BaseProvider, ProviderConfig, ChatMessage, ChatResponse

logger = logging.getLogger(__name__)

"""
Test Qwen API directly with curl:

curl -X POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-235b-a22b",
    "input": {
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you?"}
      ]
    },
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 1000,
      "stream": false,
      "result_format": "message"
    }
  }'

For streaming test:
curl -X POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "qwen3-235b-a22b",
    "input": {
      "messages": [
        {"role": "user", "content": "Tell me a short story"}
      ]
    },
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 500,
      "stream": true,
      "result_format": "message"
    }
  }'

Replace YOUR_API_KEY_HERE with your actual Qwen API key.
If you get errors, the response body will show the exact error message from Qwen.
"""

class QwenProvider(BaseProvider):
    """Alibaba Qwen API provider implementation"""
    
    def __init__(self, api_key: str):
        config = ProviderConfig(
            name="qwen",
            base_url="https://dashscope-intl.aliyuncs.com/api/v1",
            api_key=api_key,
            models={
                "qwen-max": {
                    "name": "Qwen-Max",
                    "input_price": 2.8,  # per 1M tokens
                    "output_price": 8.4,  # per 1M tokens
                    "context_length": 32000
                },
                "qwen-plus": {
                    "name": "Qwen-Plus",
                    "input_price": 0.56,  # per 1M tokens
                    "output_price": 1.68,  # per 1M tokens
                    "context_length": 32000
                },
                "qwen-turbo": {
                    "name": "Qwen-Turbo",
                    "input_price": 0.28,  # per 1M tokens
                    "output_price": 0.84,  # per 1M tokens
                    "context_length": 8000
                }
            }
        )
        super().__init__(config)
        self._sent_text_length = 0  # Track sent text for incremental streaming
    
    def get_endpoint(self) -> str:
        return "/services/aigc/text-generation/generation"
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Qwen uses API key in header"""
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
    
    def transform_messages(self, messages: List[ChatMessage]) -> List[Dict]:
        """Transform to Qwen message format"""
        # Qwen uses a different structure for messages
        return [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in messages
        ]
    
    def build_request_payload(
        self,
        messages: List[Dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False,
        **kwargs
    ) -> Dict:
        """Build Qwen request payload"""
        return {
            "model": model,
            "input": {
                "messages": messages
            },
            "parameters": {
                "temperature": temperature,
                "max_tokens": max_tokens,
                "top_p": kwargs.get("top_p", 0.95),
                "repetition_penalty": kwargs.get("repetition_penalty", 1.0),
                "stop": kwargs.get("stop", None),
                "stream": stream,
                "result_format": "message",
                "enable_search": kwargs.get("enable_search", False),
                "enable_thinking": False
            }
        }
    
    def parse_response(self, response: Dict) -> ChatResponse:
        """Parse Qwen response"""
        output = response["output"]
        usage = response.get("usage", {})
        
        # Extract content from choices or text field
        if "choices" in output:
            content = output["choices"][0]["message"]["content"]
            finish_reason = output["choices"][0].get("finish_reason", "stop")
        else:
            content = output.get("text", "")
            finish_reason = output.get("finish_reason", "stop")
        
        return ChatResponse(
            id=response.get("request_id", ""),
            model=response.get("model", "qwen"),
            content=content,
            finish_reason=finish_reason,
            usage={
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0)
            },
            created_at=int(time.time())
        )
    
    def parse_stream_chunk(self, chunk: str) -> Optional[str]:
        """Parse Qwen streaming chunk"""
        
        # Try to parse as SSE format first
        if chunk.startswith("data:"):
            data = chunk[5:].strip()
            if data == "[DONE]":
                return None
            
            try:
                parsed = json.loads(data)
                output = parsed.get("output", {})
                
                # Check if choices is at top level (OpenAI format)
                if "choices" in parsed and "output" not in parsed:
                    choices = parsed["choices"]
                    if choices and len(choices) > 0:
                        choice = choices[0]
                        if "message" in choice:
                            message = choice["message"]
                            if "content" in message:
                                return message["content"]
                        elif "delta" in choice:
                            delta = choice["delta"]
                            if "content" in delta:
                                return delta["content"]
                
                # Qwen might return text directly or in choices inside output
                if "choices" in output:
                    choices = output["choices"]
                    if choices and len(choices) > 0:
                        choice = choices[0]
                        finish_reason = choice.get("finish_reason")
                        
                        # Check for streaming delta format
                        if "delta" in choice:
                            delta = choice["delta"]
                            if "content" in delta:
                                return delta["content"]
                        # Check for complete message format (non-delta)
                        elif "message" in choice:
                            message = choice["message"]
                            if "content" in message:
                                content = message["content"]
                                
                                # Always check if we have content to send
                                if content and len(content) > 0:
                                    # If finish_reason is "stop" or this is the first chunk, return the content
                                    if finish_reason == "stop" or self._sent_text_length == 0:
                                        # For first chunk or complete response, return all content
                                        if self._sent_text_length == 0:
                                            self._sent_text_length = len(content)
                                            return content
                                        else:
                                            # If we've already sent some content but got stop, send remaining
                                            new_content = content[self._sent_text_length:]
                                            if new_content:
                                                self._sent_text_length = len(content)
                                                return new_content
                                    
                                    # Otherwise handle as accumulated text for incremental streaming
                                    current_length = len(content)
                                    if current_length > self._sent_text_length:
                                        new_content = content[self._sent_text_length:]
                                        self._sent_text_length = current_length
                                        return new_content
                                
                                return None
                # REMOVED: Qwen3 doesn't use output.text format
            except json.JSONDecodeError:
                logger.error("Failed to parse SSE data as JSON")
        else:
            # Try to parse as raw JSON if not SSE format
            try:
                parsed = json.loads(chunk)
                
                # Check for Qwen3's OpenAI-compatible format
                if "output" in parsed and "choices" in parsed["output"]:
                    choices = parsed["output"]["choices"]
                    if choices and len(choices) > 0:
                        choice = choices[0]
                        if "message" in choice and "content" in choice["message"]:
                            content = choice["message"]["content"]
                            if content:
                                # Handle as complete response
                                if self._sent_text_length == 0:
                                    self._sent_text_length = len(content)
                                    return content
                                else:
                                    # Handle incremental
                                    current_length = len(content)
                                    if current_length > self._sent_text_length:
                                        new_content = content[self._sent_text_length:]
                                        self._sent_text_length = current_length
                                        return new_content
                            return None
                
                # No other formats to check for Qwen3
            except json.JSONDecodeError:
                logger.error("Failed to parse chunk as JSON")
        
        return None
    
    async def stream(
        self,
        messages: List[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream response from Qwen API"""
        # Reset sent text counter for new stream
        self._sent_text_length = 0
        
        # Call parent stream method
        async for chunk in super().stream(messages, model, temperature, max_tokens, **kwargs):
            yield chunk