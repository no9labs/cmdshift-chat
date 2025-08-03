// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  subscriptionTier: 'free' | 'starter' | 'pro' | 'business';
  settings: UserSettings;
}

export interface UserSettings {
  preferredModel?: 'auto' | 'deepseek' | 'glm' | 'qwen';
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: 'deepseek-v3' | 'glm-4.5' | 'qwen-2.5';
  tokensUsed?: number;
  createdAt: Date;
  metadata?: {
    routingReason?: string;
    processingTime?: number;
    memoryUsed?: boolean;
  };
}

// Memory types
export interface MemoryEntry {
  id: string;
  userId: string;
  type: 'short_term' | 'long_term';
  key: string;
  value: any;
  embedding?: number[];
  expiresAt?: Date;
  createdAt: Date;
}

// Chat request/response types
export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: 'auto' | 'deepseek' | 'glm' | 'qwen';
  temperature?: number;
  stream?: boolean;
  useMemory?: boolean;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  tokensUsed: number;
  routingInfo?: {
    selectedModel: string;
    reason: string;
    fallbackUsed: boolean;
  };
}

// Subscription types
export interface Subscription {
  tier: 'free' | 'starter' | 'pro' | 'business';
  messageLimit: number | null;
  features: string[];
  price: number;
}

export const SUBSCRIPTION_TIERS: Record<string, Subscription> = {
  free: {
    tier: 'free',
    messageLimit: 50,
    features: ['basic_chat', 'single_model'],
    price: 0,
  },
  starter: {
    tier: 'starter',
    messageLimit: 2000,
    features: ['all_models', 'basic_memory', 'api_access'],
    price: 9.99,
  },
  pro: {
    tier: 'pro',
    messageLimit: null,
    features: ['all_models', 'full_memory', 'api_access', 'artifacts', 'priority_routing'],
    price: 19.99,
  },
  business: {
    tier: 'business',
    messageLimit: null,
    features: ['all_models', 'full_memory', 'api_access', 'artifacts', 'priority_routing', 'team_features'],
    price: 49.99,
  },
};