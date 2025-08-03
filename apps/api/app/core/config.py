from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "CmdShift API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # LLM API Keys
    DEEPSEEK_API_KEY: str
    GLM_API_KEY: str
    QWEN_API_KEY: str
    
    # Vector DB
    PINECONE_API_KEY: str
    PINECONE_ENV: str
    PINECONE_INDEX: str = "cmdshift-main"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    
    # Stripe settings
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PRICE_STARTER: Optional[str] = None
    STRIPE_PRICE_PRO: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()