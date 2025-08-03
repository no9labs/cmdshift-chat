from typing import Dict, List, Optional
import json
from .base import BaseProvider, ProviderConfig, ChatMessage, ChatResponse

class DeepSeekProvider(BaseProvider):
    """DeepSeek API provider implementation"""
    
    def __init__(self, api_key: str):
        config = ProviderConfig(
            name="deepseek",
            base_url="https://api.deepseek.com",
            api_key=api_key,
            models={
                "deepseek-chat": {
                    "name": "DeepSeek Chat",
                    "input_price": 0.14,  # per 1M tokens
                    "output_price": 0.28,  # per 1M tokens
                    "context_length": 128000
                },
                "deepseek-coder": {
                    "name": "DeepSeek Coder",
                    "input_price": 0.14,
                    "output_price": 0.28,
                    "context_length": 128000
                }
            }
        )
        super().__init__(config)
    
    def get_endpoint(self) -> str:
        return "/v1/chat/completions"
    
    def transform_messages(self, messages: List[ChatMessage]) -> List[Dict]:
        """Transform to DeepSeek message format"""
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
        """Build DeepSeek request payload"""
        return {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            "top_p": kwargs.get("top_p", 0.95),
            "frequency_penalty": kwargs.get("frequency_penalty", 0),
            "presence_penalty": kwargs.get("presence_penalty", 0),
            "stop": kwargs.get("stop", None)
        }
    
    def parse_response(self, response: Dict) -> ChatResponse:
        """Parse DeepSeek response"""
        choice = response["choices"][0]
        usage = response.get("usage", {})
        
        return ChatResponse(
            id=response["id"],
            model=response["model"],
            content=choice["message"]["content"],
            finish_reason=choice["finish_reason"],
            usage={
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0)
            },
            created_at=response["created"]
        )
    
    def parse_stream_chunk(self, chunk: str) -> Optional[str]:
        """Parse DeepSeek streaming chunk"""
        if chunk.startswith("data: "):
            data = chunk[6:]
            if data == "[DONE]":
                return None
            
            try:
                parsed = json.loads(data)
                choices = parsed.get("choices", [])
                if choices and "delta" in choices[0]:
                    delta = choices[0]["delta"]
                    if "content" in delta:
                        return delta["content"]
            except json.JSONDecodeError:
                pass
        
        return None