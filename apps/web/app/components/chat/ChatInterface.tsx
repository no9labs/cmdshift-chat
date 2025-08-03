'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Extend Window interface to include refreshConversations
declare global {
  interface Window {
    refreshConversations?: () => void;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
}

export function ChatInterface({ conversationId = 'new' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [userId, setUserId] = useState<string>('anonymous');
  const streamingMessageRef = useRef<string>('');
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    // Get the authenticated user
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    // Load conversation if not new
    if (conversationId !== 'new') {
      // TODO: Load conversation messages from Redis/DB
      console.log('Loading conversation:', conversationId);
    }
  }, [conversationId]);

  // Load conversation history when conversationId changes
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || conversationId === 'new' || !userId) return;
      
      setIsLoading(true);
      try {
        console.log('Loading conversation:', conversationId);
        const response = await fetch(`/web-api/conversations/${conversationId}/messages`);
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = (data.messages || []).map((msg: any) => ({
            id: crypto.randomUUID(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages(formattedMessages);
        } else {
          console.error('Failed to load messages:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadConversation();
  }, [conversationId, userId]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let response: Response | null = null;
    try {
      response = await fetch('http://localhost:8001/api/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel,
          stream: true,
          user_id: userId,
          conversation_id: conversationId === 'new' ? null : conversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      const assistantMessageId = Date.now().toString() + '-assistant';
      setCurrentStreamingMessageId(assistantMessageId);
      streamingMessageRef.current = '';

      let selectedModelForMessage = selectedModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setCurrentStreamingMessageId(null);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.model) {
                selectedModelForMessage = parsed.model;
              }

              // Update this part - change from parsed.choices?.[0]?.delta?.content
              // to just parsed.content
              if (parsed.content) {
                const content = parsed.content;
                streamingMessageRef.current += content;

                setMessages(prev => {
                  const existingIndex = prev.findIndex(m => m.id === assistantMessageId);
                  
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: streamingMessageRef.current,
                      model: selectedModelForMessage,
                    };
                    return updated;
                  } else {
                    return [...prev, {
                      id: assistantMessageId,
                      role: 'assistant' as const,
                      content: streamingMessageRef.current,
                      model: selectedModelForMessage,
                    }];
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
      
      // If this was a new conversation, update the URL with the generated ID
      if (conversationId === 'new' && response) {
        const returnedConversationId = response.headers.get('X-Conversation-Id');
        if (returnedConversationId) {
          // Update URL without full page reload
          window.history.replaceState({}, '', `/chat/${returnedConversationId}`);
          
          // Refresh conversations in sidebar with a small delay
          if (window.refreshConversations) {
            setTimeout(() => {
              window.refreshConversations();
            }, 1000); // 1 second delay to ensure backend has saved the message
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Enhanced Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2 mr-auto">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Chat</h1>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="auto">Auto (Smart Routing)</option>
              <option value="deepseek">DeepSeek (Best for Code)</option>
              <option value="glm">GLM-4.5 (Fast & Cheap)</option>
              <option value="qwen">Qwen (Complex Tasks)</option>
            </select>
          </div>
        </div>
      </header>
      
      {/* Messages Area with Loading State */}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to CmdShift</h2>
              <p className="text-muted-foreground">
                Start a conversation with AI that never limits you. I can help with coding, 
                analysis, creative writing, and more.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">No Rate Limits</Badge>
              <Badge variant="outline">Smart Model Routing</Badge>
              <Badge variant="outline">Persistent Memory</Badge>
            </div>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} className="flex-1 overflow-y-auto" />
      )}
      
      {/* Loading Skeleton for Streaming */}
      {isLoading && currentStreamingMessageId && !messages.find(m => m.id === currentStreamingMessageId) && (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <InputArea
        onSendMessage={sendMessage}
        disabled={isLoading}
        placeholder="Message CmdShift..."
      />
    </div>
  );
}