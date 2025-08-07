from abc import ABC, abstractmethod
from typing import Dict, List, AsyncGenerator, Optional
import httpx
import json
import time
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ProviderConfig:
    """Configuration for a provider"""
    name: str
    base_url: str
    api_key: str
    models: Dict[str, Dict]
    headers: Optional[Dict] = None
    timeout: int = 60

@dataclass
class ChatMessage:
    """Standard chat message format"""
    role: str
    content: str

@dataclass
class ChatResponse:
    """Standard chat response format"""
    id: str
    model: str
    content: str
    finish_reason: str
    usage: Dict[str, int]
    created_at: int

class BaseProvider(ABC):
    """Base class for all LLM providers"""
    
    def __init__(self, config: ProviderConfig):
        self.config = config
        self.client = httpx.AsyncClient(
            base_url=config.base_url,
            headers=config.headers or {},
            timeout=httpx.Timeout(config.timeout)
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    @abstractmethod
    def transform_messages(self, messages: List[ChatMessage]) -> List[Dict]:
        """Transform messages to provider-specific format"""
        pass
    
    @abstractmethod
    def build_request_payload(
        self,
        messages: List[Dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        stream: bool = False,
        **kwargs
    ) -> Dict:
        """Build provider-specific request payload"""
        pass
    
    @abstractmethod
    def parse_response(self, response: Dict) -> ChatResponse:
        """Parse provider response to standard format"""
        pass
    
    @abstractmethod
    def parse_stream_chunk(self, chunk: str) -> Optional[str]:
        """Parse streaming response chunk"""
        pass
    
    async def complete(
        self,
        messages: List[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> ChatResponse:
        """Make a completion request"""
        transformed_messages = self.transform_messages(messages)
        payload = self.build_request_payload(
            transformed_messages,
            model,
            temperature,
            max_tokens,
            stream=False,
            **kwargs
        )
        
        response = await self.client.post(
            self.get_endpoint(),
            json=payload,
            headers=self.get_auth_headers()
        )
        
        print(f"[DEBUG {self.config.name.upper()}] Raw API response status: {response.status_code}")
        print(f"[DEBUG {self.config.name.upper()}] Raw API response headers: {dict(response.headers)}")
        
        response.raise_for_status()
        
        response_json = response.json()
        print(f"[DEBUG {self.config.name.upper()}] Raw API response JSON: {json.dumps(response_json, indent=2)}")
        
        return self.parse_response(response_json)
    
    async def stream(
        self,
        messages: List[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream a completion request"""
        transformed_messages = self.transform_messages(messages)
        payload = self.build_request_payload(
            transformed_messages,
            model,
            temperature,
            max_tokens,
            stream=True,
            **kwargs
        )
        
        endpoint = self.get_endpoint()
        headers = self.get_auth_headers()
        
        try:
            async with self.client.stream(
                "POST",
                endpoint,
                json=payload,
                headers=headers
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.strip():
                        chunk = self.parse_stream_chunk(line)
                        if chunk:
                            yield chunk
        except httpx.HTTPStatusError as e:
            logger.error(f"[{self.config.name.upper()}] HTTP Status Error: {e}")
            logger.error(f"[{self.config.name.upper()}] Status: {e.response.status_code}")
            logger.error(f"[{self.config.name.upper()}] Response body: {e.response.text}")
            logger.error(f"[{self.config.name.upper()}] Response headers: {dict(e.response.headers)}")
            raise
        except Exception as e:
            logger.error(f"[{self.config.name.upper()}] Request failed: {type(e).__name__}: {str(e)}")
            raise
    
    def get_endpoint(self) -> str:
        """Get the API endpoint"""
        return ""
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        return {
            "Authorization": f"Bearer {self.config.api_key}"
        }
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4