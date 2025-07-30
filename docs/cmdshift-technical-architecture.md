# 🛠️ CmdShift Technical Architecture: Complete Implementation Guide

## Executive Summary

This document outlines the complete technical architecture for CmdShift, leveraging the latest technologies and frameworks in 2025 to build a best-in-class AI chat platform. We focus on exceptional UX, performance, and scalability using modern web technologies, real-time features, and efficient multi-model LLM routing.

---

## 1. Technology Stack Overview

### Core Stack Selection

```yaml
Frontend:
  Framework: Next.js 14.2+ (App Router)
  UI Library: React 19
  Language: TypeScript 5.3+
  Styling: Tailwind CSS 3.4 + shadcn/ui
  State: Zustand 4.5 + TanStack Query v5
  
Backend:
  API Framework: FastAPI (Python) + Node.js (BFF)
  LLM Gateway: Custom Router + Kong Gateway
  Queue: BullMQ with Redis
  Database: PostgreSQL 16 + Drizzle ORM
  Cache: Redis 7.2
  Vector DB: Pinecone (primary) + Weaviate (backup)

Infrastructure:
  Hosting: Vercel (Frontend) + Railway/Fly.io (Backend)
  CDN: Cloudflare
  Monitoring: PostHog + Sentry
  Analytics: Plausible Analytics
```

### Why This Stack?

- **Next.js 14+**: Server Components, streaming, edge runtime
- **FastAPI**: Async Python for LLM operations, excellent performance
- **Pinecone**: Managed vector DB with 23ms p95 latency
- **shadcn/ui**: Beautiful, accessible components
- **Zustand**: Lightweight state management (2.9KB)

---

## 2. Frontend Architecture

### 2.1 Project Structure

```
/apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes group
│   ├── (chat)/            # Chat interface routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            
│   ├── ui/                # shadcn/ui components
│   ├── chat/              # Chat-specific components
│   ├── artifacts/         # Code execution components
│   └── shared/            # Shared components
├── features/              # Feature-based modules
│   ├── chat/              
│   ├── memory/            
│   └── artifacts/         
├── lib/                   # Utilities
│   ├── api/               # API clients
│   ├── hooks/             # Custom hooks
│   └── utils/             # Helper functions
└── styles/                # Global styles
```

### 2.2 Core Frontend Components

#### Chat Interface Component
```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { ModelSelector } from './ModelSelector';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

export function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState('auto');
  const { messages, sendMessage, isLoading } = useChat();
  const { socket, status } = useWebSocket();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b px-4 py-3">
        <ModelSelector 
          value={selectedModel}
          onChange={setSelectedModel}
        />
      </header>
      
      <MessageList 
        messages={messages}
        className="flex-1 overflow-y-auto"
      />
      
      <InputArea
        onSend={sendMessage}
        disabled={isLoading || status !== 'connected'}
        model={selectedModel}
      />
    </div>
  );
}
```

#### Real-time WebSocket Hook
```typescript
// lib/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    
    socketRef.current = socket;
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  return { 
    socket: socketRef.current, 
    status,
    emit: socketRef.current?.emit.bind(socketRef.current),
  };
}
```

### 2.3 State Management

#### Global State with Zustand
```typescript
// stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  settings: UserSettings;
  
  // Actions
  createConversation: () => void;
  updateMessage: (conversationId: string, messageId: string, update: Partial<Message>) => void;
  setActiveConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      settings: defaultSettings,
      
      createConversation: () => {
        const newConversation = {
          id: generateId(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
        };
        
        set(state => ({
          conversations: [...state.conversations, newConversation],
          activeConversationId: newConversation.id,
        }));
      },
      
      // ... other actions
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        conversations: state.conversations,
        settings: state.settings,
      }),
    }
  )
);
```

### 2.4 Artifact System Implementation

#### Code Execution Sandbox
```typescript
// components/artifacts/CodeSandbox.tsx
import { Sandpack } from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';

interface CodeSandboxProps {
  code: string;
  template?: 'react' | 'react-ts' | 'vanilla' | 'vue';
  dependencies?: Record<string, string>;
}

export function CodeSandbox({ 
  code, 
  template = 'react-ts',
  dependencies = {} 
}: CodeSandboxProps) {
  const files = {
    '/App.tsx': code,
  };
  
  return (
    <Sandpack
      template={template}
      files={files}
      theme={atomDark}
      options={{
        showNavigator: true,
        showTabs: true,
        showLineNumbers: true,
        showConsoleButton: true,
        bundlerURL: process.env.NEXT_PUBLIC_BUNDLER_URL,
      }}
      customSetup={{
        dependencies: {
          ...defaultDependencies[template],
          ...dependencies,
        },
      }}
    />
  );
}

const defaultDependencies = {
  'react-ts': {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    '@types/react': '^18.2.0',
    'lucide-react': '^0.263.1',
    'recharts': '^2.5.0',
  },
};
```

### 2.5 UI/UX Components

#### Modern Chat Message Component
```typescript
// components/chat/Message.tsx
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function Message({ message, onRegenerate, onFeedback }: MessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative py-6 px-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex gap-4 max-w-4xl mx-auto">
        <Avatar className="h-8 w-8">
          {message.role === 'user' ? 'U' : 'AI'}
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MessageContent content={message.content} />
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content)}>
              <Copy className="h-4 w-4" />
            </Button>
            {message.role === 'assistant' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => onFeedback(message.id, 'up')}>
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onFeedback(message.id, 'down')}>
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRegenerate(message.id)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
/apps/api/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration
│   │   ├── security.py   # Auth & security
│   │   └── middleware.py # Custom middleware
│   ├── api/
│   │   ├── v1/          # API v1 endpoints
│   │   │   ├── chat.py
│   │   │   ├── models.py
│   │   │   └── memory.py
│   │   └── deps.py      # Dependencies
│   ├── services/        # Business logic
│   │   ├── llm/         # LLM services
│   │   ├── memory/      # Memory management
│   │   └── router/      # Model routing
│   └── models/          # Data models
```

### 3.2 LLM Gateway & Router

#### Intelligent Model Router
```python
# services/router/model_router.py
from typing import Dict, List, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class ModelRouter:
    def __init__(self):
        self.models = {
            "deepseek-v3": {
                "cost": 0.5,
                "specialties": ["coding", "math", "reasoning"],
                "context_window": 128000,
                "latency": "medium"
            },
            "qwen-2.5-max": {
                "cost": 0.38,
                "specialties": ["general", "multilingual", "fast"],
                "context_window": 32000,
                "latency": "low"
            },
            "glm-4.5": {
                "cost": 0.5,
                "specialties": ["coding", "technical"],
                "context_window": 128000,
                "latency": "medium"
            }
        }
        
        self.task_embeddings = self._initialize_task_embeddings()
    
    async def route_request(
        self, 
        query: str, 
        user_preference: Optional[str] = None,
        context_length: int = 0
    ) -> str:
        """Route request to optimal model based on query analysis"""
        
        if user_preference and user_preference != "auto":
            return user_preference
        
        # Analyze query type
        query_embedding = await self._embed_query(query)
        task_scores = self._calculate_task_similarity(query_embedding)
        
        # Filter by context requirements
        available_models = {
            name: config for name, config in self.models.items()
            if config["context_window"] >= context_length
        }
        
        # Score models
        model_scores = {}
        for model_name, config in available_models.items():
            score = 0
            
            # Task matching score
            for specialty in config["specialties"]:
                if specialty in task_scores:
                    score += task_scores[specialty] * 0.5
            
            # Cost efficiency score
            cost_score = 1 / (config["cost"] + 0.1)
            score += cost_score * 0.3
            
            # Latency score
            latency_scores = {"low": 1.0, "medium": 0.7, "high": 0.4}
            score += latency_scores.get(config["latency"], 0.5) * 0.2
            
            model_scores[model_name] = score
        
        # Return highest scoring model
        return max(model_scores.items(), key=lambda x: x[1])[0]
```

#### API Gateway Configuration
```python
# core/gateway.py
from fastapi import HTTPException
from typing import AsyncGenerator
import httpx
import asyncio
from circuitbreaker import circuit

class LLMGateway:
    def __init__(self):
        self.clients = {
            "deepseek": self._create_client("https://api.deepseek.com"),
            "qwen": self._create_client("https://api.qwen.com"),
            "glm": self._create_client("https://api.glm.com"),
        }
        
    def _create_client(self, base_url: str) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=base_url,
            timeout=httpx.Timeout(60.0, connect=5.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
            http2=True,
        )
    
    @circuit(failure_threshold=5, recovery_timeout=30, expected_exception=HTTPException)
    async def stream_completion(
        self,
        model: str,
        messages: List[Dict],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream completion with circuit breaker pattern"""
        
        provider = model.split("-")[0]
        client = self.clients.get(provider)
        
        if not client:
            raise HTTPException(400, f"Unknown provider: {provider}")
        
        try:
            async with client.stream(
                "POST",
                "/v1/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    **kwargs
                },
                headers=self._get_headers(provider),
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        yield line[6:]
                        
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                # Rate limit - try fallback
                fallback_model = self._get_fallback(model)
                async for chunk in self.stream_completion(fallback_model, messages, **kwargs):
                    yield chunk
            else:
                raise HTTPException(e.response.status_code, str(e))
```

### 3.3 Memory & Context Management

#### Advanced Context Management
```python
# services/memory/context_manager.py
from typing import List, Dict, Optional
import json
from datetime import datetime
import redis.asyncio as redis

class ContextManager:
    def __init__(self, redis_client: redis.Redis, max_context_size: int = 128000):
        self.redis = redis_client
        self.max_context_size = max_context_size
        
    async def get_conversation_context(
        self, 
        conversation_id: str,
        max_messages: Optional[int] = None
    ) -> List[Dict]:
        """Retrieve optimized conversation context"""
        
        # Get full conversation history
        history_key = f"conv:{conversation_id}:messages"
        messages = await self.redis.lrange(history_key, 0, -1)
        messages = [json.loads(m) for m in messages]
        
        if not messages:
            return []
        
        # Apply sliding window with compression
        context = await self._compress_context(messages, max_messages)
        
        # Add memory blocks
        memory_blocks = await self._get_memory_blocks(conversation_id)
        if memory_blocks:
            context = self._inject_memory_blocks(context, memory_blocks)
        
        return context
    
    async def _compress_context(
        self, 
        messages: List[Dict], 
        max_messages: Optional[int]
    ) -> List[Dict]:
        """Compress context using importance scoring"""
        
        if max_messages and len(messages) <= max_messages:
            return messages
        
        # Calculate token count
        total_tokens = sum(self._estimate_tokens(m["content"]) for m in messages)
        
        if total_tokens <= self.max_context_size:
            return messages
        
        # Score messages by importance
        scored_messages = []
        for i, msg in enumerate(messages):
            score = self._calculate_importance(msg, i, len(messages))
            scored_messages.append((score, msg))
        
        # Keep most important messages within token limit
        scored_messages.sort(reverse=True, key=lambda x: x[0])
        
        compressed = []
        current_tokens = 0
        
        for score, msg in scored_messages:
            msg_tokens = self._estimate_tokens(msg["content"])
            if current_tokens + msg_tokens <= self.max_context_size * 0.8:
                compressed.append(msg)
                current_tokens += msg_tokens
        
        # Sort by timestamp
        compressed.sort(key=lambda x: x["timestamp"])
        
        # Add summary of dropped messages
        if len(compressed) < len(messages):
            summary = await self._summarize_dropped_messages(
                messages, 
                compressed
            )
            compressed.insert(0, {
                "role": "system",
                "content": f"Previous conversation summary: {summary}",
                "timestamp": messages[0]["timestamp"]
            })
        
        return compressed
    
    def _calculate_importance(self, message: Dict, index: int, total: int) -> float:
        """Calculate message importance score"""
        score = 0.0
        
        # Recency bias
        recency_score = (index / total) * 0.3
        score += recency_score
        
        # User messages get higher score
        if message["role"] == "user":
            score += 0.2
        
        # Long messages might contain important context
        length_score = min(len(message["content"]) / 1000, 1.0) * 0.2
        score += length_score
        
        # Messages with code blocks
        if "```" in message["content"]:
            score += 0.3
        
        return score
```

### 3.4 Vector Database Integration

#### RAG Implementation with Pinecone
```python
# services/rag/vector_store.py
import pinecone
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

class VectorStore:
    def __init__(self, index_name: str = "cmdshift-main"):
        pinecone.init(
            api_key=settings.PINECONE_API_KEY,
            environment=settings.PINECONE_ENV
        )
        
        self.index = pinecone.Index(index_name)
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
    async def add_documents(
        self, 
        documents: List[Dict],
        namespace: Optional[str] = None
    ):
        """Add documents to vector store with metadata"""
        
        # Generate embeddings
        texts = [doc["content"] for doc in documents]
        embeddings = self.embedder.encode(texts, batch_size=32)
        
        # Prepare vectors
        vectors = []
        for i, (doc, embedding) in enumerate(zip(documents, embeddings)):
            vectors.append({
                "id": doc.get("id", f"doc_{i}"),
                "values": embedding.tolist(),
                "metadata": {
                    "content": doc["content"][:1000],  # Truncate for metadata
                    "source": doc.get("source", "unknown"),
                    "timestamp": doc.get("timestamp", datetime.utcnow().isoformat()),
                    "type": doc.get("type", "text"),
                    **doc.get("metadata", {})
                }
            })
        
        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)
    
    async def hybrid_search(
        self,
        query: str,
        namespace: Optional[str] = None,
        top_k: int = 10,
        filter: Optional[Dict] = None,
        alpha: float = 0.5
    ) -> List[Dict]:
        """Hybrid search combining vector and keyword search"""
        
        # Vector search
        query_embedding = self.embedder.encode([query])[0]
        
        vector_results = self.index.query(
            vector=query_embedding.tolist(),
            top_k=top_k * 2,  # Get more for re-ranking
            namespace=namespace,
            filter=filter,
            include_metadata=True
        )
        
        # Keyword search using metadata
        keyword_scores = {}
        query_terms = set(query.lower().split())
        
        for match in vector_results.matches:
            content = match.metadata.get("content", "").lower()
            score = sum(1 for term in query_terms if term in content)
            keyword_scores[match.id] = score / len(query_terms)
        
        # Combine scores
        final_results = []
        for match in vector_results.matches:
            vector_score = match.score
            keyword_score = keyword_scores.get(match.id, 0)
            
            # Weighted combination
            combined_score = (alpha * vector_score) + ((1 - alpha) * keyword_score)
            
            final_results.append({
                "id": match.id,
                "score": combined_score,
                "content": match.metadata.get("content", ""),
                "metadata": match.metadata
            })
        
        # Sort by combined score
        final_results.sort(key=lambda x: x["score"], reverse=True)
        
        return final_results[:top_k]
```

---

## 4. Real-time Features

### 4.1 WebSocket Server

```python
# services/realtime/websocket_server.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_rooms: Dict[str, Set[str]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
            
    async def broadcast_to_room(self, message: str, room_id: str):
        if room_id in self.user_rooms:
            tasks = []
            for user_id in self.user_rooms[room_id]:
                if user_id in self.active_connections:
                    tasks.append(
                        self.active_connections[user_id].send_text(message)
                    )
            await asyncio.gather(*tasks, return_exceptions=True)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "chat":
                # Stream response
                async for chunk in process_chat_stream(message["content"]):
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "stream",
                            "chunk": chunk
                        }),
                        user_id
                    )
                    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

### 4.2 Server-Sent Events for Streaming

```typescript
// lib/api/streaming.ts
export class StreamingClient {
  private controller?: AbortController;
  
  async streamChat(
    messages: Message[],
    options: ChatOptions,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ) {
    this.controller = new AbortController();
    
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, options }),
        signal: this.controller.signal,
      });
      
      if (!response.ok) throw new Error(response.statusText);
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed.content);
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }
  
  abort() {
    this.controller?.abort();
  }
}
```

---

## 5. Mobile Application Architecture

### 5.1 Technology Choice

**React Native with Expo** (Recommended for v1)
- Shared codebase with web
- Expo SDK for native features
- Over-the-air updates
- Faster development

**Alternative: Flutter** (For v2)
- Better performance
- More native feel
- Stronger typing with Dart

### 5.2 React Native Architecture

```
/apps/mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Shared components
│   ├── navigation/        # Navigation setup
│   ├── services/          # API services
│   ├── stores/            # State management
│   └── utils/             # Utilities
├── app.json              # Expo config
└── App.tsx               # Entry point
```

#### Main App Component
```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChatScreen } from './src/screens/ChatScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 5.3 Mobile-Optimized Chat Interface

```typescript
// screens/ChatScreen.tsx
import React from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet 
} from 'react-native';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { useChat } from '../hooks/useChat';

export function ChatScreen() {
  const { messages, sendMessage, isLoading } = useChat();
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <MessageList messages={messages} />
      <ChatInput 
        onSend={sendMessage}
        disabled={isLoading}
      />
    </KeyboardAvoidingView>
  );
}
```

---

## 6. Performance Optimization

### 6.1 Frontend Optimizations

#### Code Splitting & Lazy Loading
```typescript
// Lazy load heavy components
const ArtifactEditor = lazy(() => import('./components/ArtifactEditor'));
const CodeSandbox = lazy(() => import('./components/CodeSandbox'));

// Route-based code splitting
const routes = [
  {
    path: '/chat',
    component: lazy(() => import('./pages/Chat')),
  },
  {
    path: '/artifacts',
    component: lazy(() => import('./pages/Artifacts')),
  },
];
```

#### React 19 Optimizations
```typescript
// Use React 19's new use() hook for data fetching
import { use, Suspense } from 'react';

function MessageContent({ messageId }: { messageId: string }) {
  const message = use(fetchMessage(messageId));
  
  return <div>{message.content}</div>;
}

// Automatic memoization with React Compiler
// No need for useMemo/useCallback in most cases
```

### 6.2 Backend Optimizations

#### Caching Strategy
```python
# Redis caching decorator
from functools import wraps
import hashlib
import json

def cache_result(expire_time: int = 3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{hashlib.md5(
                json.dumps([args, kwargs], sort_keys=True).encode()
            ).hexdigest()}"
            
            # Try to get from cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            await redis_client.setex(
                cache_key, 
                expire_time, 
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

# Usage
@cache_result(expire_time=1800)
async def get_model_embedding(text: str):
    return await embedding_service.embed(text)
```

#### Database Query Optimization
```typescript
// Using Drizzle ORM for type-safe queries
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

// Optimized query with proper indexing
const getRecentConversations = async (userId: string) => {
  return await db
    .select({
      id: conversations.id,
      title: conversations.title,
      lastMessage: sql`
        (SELECT content FROM messages 
         WHERE conversation_id = conversations.id 
         ORDER BY created_at DESC 
         LIMIT 1)
      `,
      messageCount: sql`COUNT(messages.id)`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(20);
};
```

---

## 7. Security & Authentication

### 7.1 Authentication Flow

```typescript
// Using Clerk for authentication
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { authMiddleware } from '@clerk/nextjs';

// Middleware configuration
export default authMiddleware({
  publicRoutes: ['/api/webhooks', '/'],
  ignoredRoutes: ['/api/health'],
});

// Protected API route
export async function POST(request: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Process authenticated request
}
```

### 7.2 API Security

```python
# Rate limiting with Redis
from fastapi import HTTPException
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, redis_client, max_requests: int = 60, window: int = 60):
        self.redis = redis_client
        self.max_requests = max_requests
        self.window = window
    
    async def check_rate_limit(self, user_id: str, endpoint: str):
        key = f"rate_limit:{user_id}:{endpoint}"
        
        try:
            current = await self.redis.incr(key)
            
            if current == 1:
                await self.redis.expire(key, self.window)
            
            if current > self.max_requests:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded"
                )
                
        except Exception as e:
            # Don't block on rate limit errors
            logger.error(f"Rate limit check failed: {e}")
```

---

## 8. Monitoring & Analytics

### 8.1 Application Monitoring

```typescript
// PostHog integration
import posthog from 'posthog-js';

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // Handle manually
  });
}

// Track events
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(event, properties);
    }
  },
  
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  },
};

// Usage
analytics.track('chat_message_sent', {
  model: selectedModel,
  messageLength: message.length,
  hasAttachments: attachments.length > 0,
});
```

### 8.2 Performance Monitoring

```python
# Custom performance monitoring
import time
from contextlib import asynccontextmanager
from prometheus_client import Histogram, Counter

# Metrics
request_duration = Histogram(
    'llm_request_duration_seconds',
    'LLM request duration',
    ['model', 'endpoint']
)

request_count = Counter(
    'llm_request_total',
    'Total LLM requests',
    ['model', 'status']
)

@asynccontextmanager
async def monitor_llm_request(model: str, endpoint: str):
    start_time = time.time()
    try:
        yield
        request_count.labels(model=model, status='success').inc()
    except Exception as e:
        request_count.labels(model=model, status='error').inc()
        raise
    finally:
        duration = time.time() - start_time
        request_duration.labels(model=model, endpoint=endpoint).observe(duration)
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure Setup

```yaml
# docker-compose.yml for local development
version: '3.8'

services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/cmdshift
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  api:
    build: ./apps/api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/cmdshift
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=cmdshift
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 9.2 Production Deployment

```typescript
// Vercel deployment configuration
// vercel.json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.cmdshift.com/:path*"
    }
  ]
}
```

```python
# Railway/Fly.io deployment for Python backend
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 10. Development Workflow

### 10.1 Git Repository Structure

```
cmdshift/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # FastAPI backend
│   └── mobile/       # React Native app
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript types
│   └── utils/        # Shared utilities
├── infrastructure/
│   ├── docker/       # Docker configs
│   └── k8s/          # Kubernetes configs
├── .github/
│   └── workflows/    # CI/CD pipelines
└── turbo.json        # Turborepo config
```

### 10.2 Development Tools

```json
// Recommended VS Code extensions
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-python.python",
    "GitHub.copilot",
    "unifiedjs.vscode-mdx"
  ]
}
```

---

## Conclusion

This technical architecture provides a solid foundation for building CmdShift with:

1. **Modern Frontend**: Next.js 14 with React 19, offering the best UX
2. **Scalable Backend**: FastAPI with intelligent routing and caching
3. **Real-time Features**: WebSockets and SSE for responsive chat
4. **Efficient Data Layer**: Pinecone for vectors, PostgreSQL for structured data
5. **Mobile Ready**: React Native for cross-platform mobile apps
6. **Production Ready**: Monitoring, security, and deployment strategies

The architecture is designed to:
- Scale to millions of users
- Provide sub-100ms response times
- Handle 10,000+ concurrent connections
- Maintain 99.9% uptime

Start with the MVP components and gradually add advanced features as you validate the market and grow your user base.