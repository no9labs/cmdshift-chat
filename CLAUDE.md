# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CmdShiftChat is a cost-efficient AI chat platform that aggregates Chinese LLM APIs (DeepSeek, Qwen, GLM) to provide 60-70% cost savings compared to traditional platforms. Built as a Turborepo monorepo with a Next.js frontend and FastAPI backend.

## Key Mission

Build a production-ready AI chat platform that offers 60-70% cost savings through intelligent routing to Chinese LLMs while maintaining high quality and performance.

## Repository Structure

```
cmdshiftchat/
├── apps/
│   ├── web/              # Next.js 15.4.5 frontend with Turbopack
│   └── api/              # FastAPI backend (Python)
├── packages/             # Shared packages
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared React UI components  
│   ├── eslint-config/    # Shared ESLint configurations
│   └── typescript-config/# Shared TypeScript configurations
├── docs/                 # Project strategy and architecture docs
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # PNPM workspace config
```

## Development Commands

```bash
# Install dependencies (requires pnpm v9.0.0)
pnpm install

# Development (all apps)
pnpm dev

# Development (specific app)
pnpm dev --filter=web
pnpm dev --filter=api

# Build all
pnpm build

# Linting
pnpm lint

# Type checking  
pnpm check-types

# Code formatting
pnpm format

# Start services (required before running dev servers)
brew services start postgresql@16 redis

# API-specific commands (from apps/api/)
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001  # Note: port 8001

# Test subscription limits
cd apps/api
python test_subscription_limits.py

# Database migrations (Supabase)
cd apps/web
pnpm supabase migration new <migration_name>
pnpm supabase db push
```

## Architecture Overview

### Frontend (apps/web)
- **Framework**: Next.js 15.4.5 with App Router
- **UI**: Tailwind CSS v4, shadcn/ui components
- **Auth**: Supabase Auth with middleware protection
- **State**: React hooks, context for global state
- **Key Routes**:
  - `/` - Main chat interface
  - `/pricing` - Subscription tiers
  - `/usage` - Usage dashboard
  - `/profile` - User settings
  - `/(auth)/login`, `/(auth)/signup` - Authentication

### Backend (apps/api)
- **Framework**: FastAPI with async/await
- **LLM Providers**: DeepSeek, GLM, Qwen (Chinese models)
- **Smart Routing**: Cost-optimized model selection in `app/services/router.py`
- **Caching**: Redis for response caching and rate limiting
- **Database**: PostgreSQL via SQLAlchemy (future)
- **Key Endpoints**:
  - `POST /api/v1/chat/completions` - OpenAI-compatible chat endpoint
  - `GET /api/v1/usage` - User usage statistics
  - `GET /health` - Health check with Redis status

### Shared Packages
- **@repo/types**: TypeScript interfaces for API contracts
- **@repo/ui**: Reusable React components
- **@repo/eslint-config**: Consistent linting rules
- **@repo/typescript-config**: Shared TS configurations

## Environment Configuration

### Frontend (.env.local in apps/web/)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env in apps/api/)
```bash
# Security
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/cmdshift

# Redis (required for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# LLM Providers (at least one required)
DEEPSEEK_API_KEY=sk-...  # For code tasks
GLM_API_KEY=...         # For general/multilingual
QWEN_API_KEY=...        # For math/reasoning

# Vector DB (optional)
PINECONE_API_KEY=...
PINECONE_ENV=...

# Monitoring (optional)
SENTRY_DSN=...
```

## Key Technical Details

### Model Router Algorithm
The `ModelRouter` class in `app/services/router.py` implements intelligent model selection:
1. Analyzes query to determine task type (code, math, general, etc.)
2. Filters models by context window requirements AND API key availability
3. Scores models based on task match, cost, and latency
4. Falls back to available models if preferred model lacks API key
5. Caches routing decisions for analytics

**Model Specializations:**
- **deepseek-chat**: Best for code and technical content ($0.27/M tokens)
- **glm-4.5**: Best for general and technical tasks ($0.11/M tokens)
- **qwen3-235b-a22b**: Best for general and multilingual tasks ($2.80/M tokens)

**Context Windows:**
- DeepSeek V3: 128K tokens
- GLM-4.5: 128K tokens
- Qwen3-235B: 32K tokens

### Subscription System
- Uses Redis for fast limit checking with graceful degradation
- Real-time usage tracking with proper 429 rate limiting
- Subscription tiers:
  - **Free**: 50 messages/day
  - **Starter**: $9.99/mo, 2,000 messages/month
  - **Pro**: $19.99/mo, unlimited messages
  - **Business**: $49.99/mo, team features + priority support
- Stripe integration for payment processing
- Test users: suffix `_starter` or `_pro` for tier simulation

### API Compatibility
Backend provides OpenAI-compatible endpoints, allowing drop-in replacement:
```python
# Works with OpenAI SDK
client = OpenAI(
    api_key="your-cmdshift-key",
    base_url="http://localhost:8000/api/v1"
)
```

## Common Development Tasks

### Adding a New LLM Provider
1. Create provider class in `/apps/api/app/providers/[name].py`
2. Inherit from `BaseProvider` and implement required methods:
   - `complete()`: Main completion method
   - `stream()`: Streaming response method
3. Add to `ModelType` enum in `/apps/api/app/models/llm.py`
4. Update `ModelRouter` in `router.py` with model config:
   - Add to `self.models` dict with cost, specialties, context_window, latency, api_key, endpoint
5. Add API key to `.env` and `config.py`
6. Update model pricing in `/apps/api/app/api/v1/usage.py`
7. Test with `test_subscription_limits.py` to ensure rate limiting works

### Implementing a New Feature
1. Design API endpoint in FastAPI backend
2. Create TypeScript types in `packages/types`
3. Implement frontend components in Next.js
4. Add appropriate error handling and loading states
5. Update usage tracking if needed

### Testing Subscription Limits
Use the provided test script:
```bash
cd apps/api
python test_subscription_limits.py
```

## Performance Considerations

### Frontend Optimization
- Uses Next.js Turbopack for faster dev builds
- Implements code splitting with dynamic imports
- Optimizes images with Next.js Image component
- Minimizes client-side state

### Backend Optimization  
- Async/await throughout for non-blocking I/O
- Redis caching for frequently accessed data
- Connection pooling for database/Redis
- Efficient token counting algorithms

## Debugging Tips

### Frontend Issues
- Check browser console for errors
- Verify environment variables are loaded (NEXT_PUBLIC_* prefixed)
- Use React DevTools for component inspection
- Check Network tab for API responses
- Port conflicts: Frontend runs on 3000, API on 8001

### Backend Issues
- FastAPI auto-docs at http://localhost:8001/docs
- Check Redis connection with health endpoint
- Verify API keys are correctly formatted (not placeholder "your-*")
- Monitor logs for provider-specific errors
- Test model routing: Check `scores` in routing decisions

### Monorepo Issues
- Clear turbo cache: `rm -rf .turbo`
- Reinstall dependencies: `pnpm install`
- Check workspace resolution in pnpm-workspace.yaml
- Turbo tasks defined in `/turbo.json`

## Critical Implementation Details

### Error Handling Pattern
```python
# Always re-raise HTTPException to preserve status codes
except HTTPException:
    raise
except Exception as e:
    # Only catch non-HTTP exceptions
    logger.error(f"Error: {e}")
```

### Redis Connection Pattern
```python
# Always handle Redis unavailability gracefully
try:
    result = await redis_client.get(key)
except Exception:
    # Fallback to database or default behavior
    result = None
```

### Authentication Flow
1. Frontend: Supabase client auth → middleware protection
2. Backend: Extract user_id from request → validate with Supabase
3. Usage tracking: Link all API calls to user_id for billing

## Project Goals & Vision

CmdShift aims to democratize AI access by:
1. **Cost Efficiency**: 60-70% cheaper through Chinese LLM aggregation
2. **No Rate Limits**: Intelligent routing prevents hitting limits
3. **Unified Interface**: Single platform for multiple models
4. **Smart Features**: Persistent memory, artifacts, code execution

Target users include developers, SMBs, and power users frustrated with expensive, rate-limited platforms.

## Important Notes

- The project uses Turborepo for monorepo management with PNPM workspaces
- Authentication is handled by Supabase (client-side and server-side SDKs)
- Redis is required for caching and rate limiting (graceful degradation if unavailable)
- Model routing automatically falls back to available models based on API keys
- Subscription tiers are enforced with proper 429 rate limiting responses
- Frontend uses Next.js 15.4.5 with Turbopack for faster dev builds
- Backend is async FastAPI with proper error handling patterns