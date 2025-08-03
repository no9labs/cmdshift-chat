import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className={cn("flex-1", className)} ref={scrollRef}>
      <div className="mx-auto max-w-3xl px-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "group relative py-6",
              message.role === 'user' && "bg-muted/30"
            )}
          >
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(
                  "text-xs",
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {message.model && (
                    <span className="text-xs text-muted-foreground">
                      ({message.model})
                    </span>
                  )}
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}