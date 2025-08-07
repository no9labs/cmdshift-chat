from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as redis
from app.core.config import settings
from app.api.v1 import chat, usage, stripe, conversations
import sentry_sdk
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

# Global Redis client
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # Store Redis client in app state
    app.state.redis = redis_client
    
    # Initialize Sentry if configured
    if settings.SENTRY_DSN:
        sentry_sdk.init(dsn=settings.SENTRY_DSN)
    
    yield
    
    # Shutdown
    await redis_client.close()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative port
        "https://cmdshift.com",   # Future production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Conversation-Id",
        "X-Messages-Remaining", 
        "X-Selected-Model",
        "X-Message-Count",
        "X-Request-Id"
    ],
)

# Sentry middleware
if settings.SENTRY_DSN:
    app.add_middleware(SentryAsgiMiddleware)

@app.get("/")
async def root():
    return {"message": "CmdShift API V1.0", "status": "online"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_client.ping()
        redis_status = "healthy"
    except Exception:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "services": {
            "redis": redis_status
        }
    }

# Include routers
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(usage.router, prefix="/api/v1", tags=["usage"])
app.include_router(stripe.router, prefix="/api/v1/stripe", tags=["stripe"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])