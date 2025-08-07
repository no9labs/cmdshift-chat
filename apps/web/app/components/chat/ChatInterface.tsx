'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ModelSelector } from './ModelSelector';
import { Badge } from '@/components/ui/badge';
import { Bot, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
  const [userId, setUserId] = useState<string>('anonymous');
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const streamingMessageRef = useRef<string>('');
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }, [input]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load conversation if not new
    if (conversationId !== 'new') {
      // Load conversation messages from Redis/DB
    }
  }, [conversationId]);

  // Load conversation history when conversationId changes
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || conversationId === 'new' || !userId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/web-api/conversations/${conversationId}/messages`);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let response: Response | null = null;
    const currentMessage = content; // Store for use in finally block
    let newConversationId: string | null = null;
    try {
      response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/completions`, {
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

      // Capture conversation ID from response headers (for both streaming and non-streaming)
      const convIdHeader = response.headers.get('X-Conversation-Id');
      
      if (convIdHeader) {
        newConversationId = convIdHeader;
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
            } catch (e: unknown) {
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
      
      // Get the full response from the streaming message
      const fullResponse = streamingMessageRef.current;
      
      // If this was a new conversation, update the URL and generate title
      // Check if this is first message exchange
      if (newConversationId && messages.length === 0 && fullResponse) {
        // Update URL without full page reload
        window.history.replaceState({}, '', `/chat/${newConversationId}`);
        
        // Generate title for new conversations
        
        // Call backend to generate and save title
        try {
          const titleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/conversations/generate-title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: newConversationId,
              user_id: userId,
              messages: [
                { role: 'user', content: currentMessage },
                { role: 'assistant', content: fullResponse }
              ]
            })
          });
          
          if (titleResponse.ok) {
            // Give backend time to save title to Redis before refreshing
            setTimeout(() => {
              if (window.refreshConversations) {
                window.refreshConversations();
                
                // Retry once more after another delay if needed
                setTimeout(() => {
                  if (window.refreshConversations) {
                    window.refreshConversations();
                  }
                }, 2000);
              }
            }, 2000); // Initial 2-second delay
          }
        } catch (error) {
          console.error('Failed to generate title:', error);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">{/* Changed from h-screen to h-full since parent controls height */}
      
      {/* Messages Area with Loading State */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-lg">
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Bot className="h-8 w-8 text-[#3A4D6F]" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-[#2C2C2C]">
                  Welcome to CmdShift
                </h2>
                <p className="text-base text-[#7A7A7A] leading-relaxed">
                  Start a conversation with AI that never limits you. I can help with coding, 
                  analysis, creative writing, and more.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="secondary" className="text-xs bg-white/50 border-[#3A4D6F]/20 text-[#3A4D6F]">
                  No Rate Limits
                </Badge>
                <Badge variant="secondary" className="text-xs bg-white/50 border-[#3A4D6F]/20 text-[#3A4D6F]">
                  Smart Model Routing
                </Badge>
                <Badge variant="secondary" className="text-xs bg-white/50 border-[#3A4D6F]/20 text-[#3A4D6F]">
                  Persistent Memory
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Model Selector */}
          <div className="mb-3 flex justify-end">
            <ModelSelector 
              value={selectedModel} 
              onChange={setSelectedModel}
              className="bg-white border-[#EAE8E2] text-sm"
            />
          </div>
          
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full bg-white rounded-lg shadow-sm p-4 pr-16 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-[#3A4D6F] text-[#2C2C2C] placeholder-[#7A7A7A] min-h-[56px]"
              rows={1}
              disabled={isLoading}
            />
            
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <p className="text-center text-xs text-[#7A7A7A] mt-2">
            CmdShift can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}