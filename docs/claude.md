# CmdShift Chat - Claude Code Context

## Project Overview
CmdShift Chat is an OpenRouter competitor aggregating Chinese LLMs (DeepSeek, Qwen, Kimi, Doubao) and Western models via Hugging Face. Direct API integration only - no self-hosting. 50-90% cheaper than competitors.

## Architecture
```
cmdshift-chat-api/
├── providers/          # LLM provider implementations
│   ├── base.js        # BaseProvider class all providers extend
│   ├── deepseek.js    # DeepSeek API integration
│   ├── qwen.js        # Alibaba Qwen integration
│   ├── huggingface.js # HF Inference API
│   └── index.js       # Export all providers
├── router/            # Smart routing logic
│   └── index.js       # Cost-based provider selection
├── routes/            # API endpoints
│   ├── completions.js # OpenAI-compatible /v1/chat/completions
│   ├── models.js      # List available models
│   └── billing.js     # Stripe credit system
├── middleware/        # Express middleware
│   ├── auth.js        # API key authentication
│   ├── usage.js       # Token counting & billing
│   └── rateLimit.js   # Per-user rate limiting
├── utils/             # Helper functions
│   ├── tokenCounter.js # Accurate token counting
│   └── logger.js      # Structured logging
├── database/          # Supabase schemas
│   └── schema.sql     # PostgreSQL tables
├── server.js          # Express app entry point
├── .env              # Environment variables
└── package.json      # Dependencies

cmdshift-chat-frontend/
├── app/              # Next.js 14 app router
├── components/       # React components
│   ├── Chat.jsx     # Main chat interface
│   └── ModelSelector.jsx
└── lib/             # Utilities
    └── api.js       # Backend API client
```

## Provider Integration Pattern
Every provider MUST follow this pattern:

```javascript
// providers/[provider-name].js
const BaseProvider = require('./base');

class ProviderNameProvider extends BaseProvider {
  constructor() {
    super();
    this.name = 'provider-name';
    this.baseURL = 'https://api.provider.com';
    this.models = {
      'model-id': { 
        name: 'Model Name',
        inputPrice: 0.001,  // per 1K tokens
        outputPrice: 0.002, // per 1K tokens
        contextLength: 128000
      }
    };
  }

  async complete(messages, options = {}) {
    const payload = this.transformRequest(messages, options);
    
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PROVIDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Provider error: ${response.statusText}`);
    }

    return this.transformResponse(await response.json());
  }

  transformRequest(messages, options) {
    // Provider-specific request format
    return {
      model: options.model || 'default-model',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      stream: options.stream || false
    };
  }

  transformResponse(response) {
    // Normalize to OpenAI format
    return {
      id: response.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: response.choices || [{
        index: 0,
        message: response.message || response.result,
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    };
  }

  async stream(messages, options, onChunk) {
    // Implement SSE streaming
    options.stream = true;
    const payload = this.transformRequest(messages, options);
    
    // Use fetch with streaming response handling
    // Call onChunk for each data chunk
  }
}

module.exports = ProviderNameProvider;
```

## Smart Router Requirements
```javascript
// router/index.js
class SmartRouter {
  constructor() {
    this.providers = new Map(); // provider instances
    this.models = new Map();    // model-to-provider mapping
    this.costs = new Map();     // real-time cost tracking
  }

  async route(modelId, messages, options) {
    // Priority order:
    // 1. Specific model requested -> use its provider
    // 2. "auto" requested -> cost optimization
    // 3. Provider failure -> automatic fallback
    
    if (modelId === 'auto') {
      return this.costOptimizedRoute(messages, options);
    }
    
    const provider = this.getProviderForModel(modelId);
    try {
      return await provider.complete(messages, options);
    } catch (error) {
      return this.fallbackRoute(messages, options, error);
    }
  }

  costOptimizedRoute(messages, options) {
    // Select cheapest available provider
    // Consider: base cost, current load, response time
    // During off-peak (UTC 16:30-00:30), prioritize DeepSeek
  }
}
```

## API Endpoint Requirements
All endpoints MUST be OpenAI SDK compatible:

```javascript
// routes/completions.js
router.post('/v1/chat/completions', authenticate, async (req, res) => {
  const { model, messages, stream, ...options } = req.body;
  
  // 1. Validate request format
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  
  // 2. Track usage
  const startTime = Date.now();
  
  // 3. Route to provider
  const response = await router.route(model || 'auto', messages, options);
  
  // 4. Calculate costs
  const cost = calculateCost(response.usage, model);
  
  // 5. Log usage to database
  await logUsage(req.user.id, {
    model,
    provider: response.provider,
    tokens: response.usage,
    cost,
    latency: Date.now() - startTime
  });
  
  // 6. Deduct credits
  await deductCredits(req.user.id, cost);
  
  // 7. Return response
  if (stream) {
    // Handle SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    // Stream response chunks
  } else {
    res.json(response);
  }
});
```

## Environment Variables
```bash
# Provider API Keys
DEEPSEEK_API_KEY=sk-...
QWEN_API_KEY=...
HF_API_KEY=hf_...
DOUBAO_API_KEY=...
KIMI_API_KEY=...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=3000
NODE_ENV=production
```

## Critical Implementation Rules

1. **OpenAI Compatibility**: Every response MUST match OpenAI's format exactly
2. **Error Handling**: Always fallback to another provider, never fail completely
3. **Cost Tracking**: Track every token for accurate billing
4. **Streaming**: All providers must support SSE streaming
5. **Rate Limiting**: Implement per-user, per-model limits
6. **Security**: Never expose provider API keys in responses
7. **Logging**: Log all requests for debugging but exclude message content

## Database Schema (PostgreSQL/Supabase)
```sql
-- Core tables only
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  credits DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  key_hash TEXT NOT NULL, -- bcrypt hash
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  api_key_id UUID REFERENCES api_keys(id),
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_cost DECIMAL(10,6) NOT NULL,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

## Testing Requirements
Every provider must pass these tests:
```javascript
// test/providers.test.js
describe('Provider Tests', () => {
  test('Basic completion', async () => {
    const response = await provider.complete([
      { role: 'user', content: 'Hello' }
    ]);
    expect(response).toHaveProperty('choices');
    expect(response.choices[0].message.content).toBeTruthy();
  });

  test('Streaming response', async () => {
    const chunks = [];
    await provider.stream(messages, options, (chunk) => {
      chunks.push(chunk);
    });
    expect(chunks.length).toBeGreaterThan(0);
  });

  test('Error handling', async () => {
    // Test with invalid API key
    process.env.PROVIDER_API_KEY = 'invalid';
    await expect(provider.complete(messages)).rejects.toThrow();
  });

  test('OpenAI format compliance', async () => {
    const response = await provider.complete(messages);
    expect(response).toMatchObject({
      id: expect.any(String),
      object: 'chat.completion',
      created: expect.any(Number),
      model: expect.any(String),
      choices: expect.any(Array),
      usage: {
        prompt_tokens: expect.any(Number),
        completion_tokens: expect.any(Number),
        total_tokens: expect.any(Number)
      }
    });
  });
});
```

## Performance Targets
- Response time: < 1000ms (first token)
- Streaming latency: < 100ms between chunks
- Provider fallback: < 500ms
- Cost calculation: < 10ms
- Database write: < 50ms

## Security Checklist
- [ ] All API keys in environment variables
- [ ] Request validation on all endpoints
- [ ] Rate limiting per user implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection in chat interface
- [ ] CORS properly configured
- [ ] API key hashing with bcrypt
- [ ] Webhook signature verification (Stripe)

## Deployment Notes
- Backend: Railway (auto-scaling)
- Frontend: Vercel (edge network)
- Database: Supabase (managed PostgreSQL)
- Use environment variables for all configurations
- Health check endpoint at /health
- Graceful shutdown handling

## Remember
- **Direct API = Lower costs**: No self-hosting, no middleware
- **Chinese models are key**: DeepSeek, Qwen, Doubao exclusivity
- **OpenAI compatibility is critical**: Must work with existing code
- **Fail gracefully**: Always have fallback providers
- **Track everything**: Usage, costs, errors for optimization