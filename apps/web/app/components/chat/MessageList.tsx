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
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "group relative animate-in fade-in-0 slide-in-from-bottom-3 duration-700 ease-out",
              message.role === 'user' && "flex justify-end"
            )}
          >
            <div className={cn(
              "relative rounded-lg transition-all duration-300",
              message.role === 'user' 
                ? "bg-white max-w-[80%] border border-[#EAE8E2]" 
                : "bg-white max-w-[80%] border border-[#EAE8E2]",
              "shadow-sm hover:shadow-md"
            )}>
              <div className="px-5 py-3">
                <div className="flex gap-3 items-start">
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-[#3A4D6F] text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#2C2C2C]">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      {message.model && (
                        <span className="text-[10px] text-[#7A7A7A]">
                          {message.model}
                        </span>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none 
                      prose-p:text-[#2C2C2C] prose-p:leading-relaxed
                      prose-headings:text-[#2C2C2C] prose-headings:font-semibold
                      prose-strong:text-[#2C2C2C] prose-strong:font-semibold
                      prose-code:text-[#3A4D6F] prose-code:bg-[#3A4D6F]/10 
                      prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                      prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-white prose-pre:border prose-pre:border-[#EAE8E2]
                      prose-a:text-[#3A4D6F] prose-a:no-underline hover:prose-a:underline
                      prose-li:text-[#2C2C2C] prose-li:marker:text-[#7A7A7A]
                      prose-blockquote:text-[#7A7A7A] prose-blockquote:border-[#3A4D6F]
                    ">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-[#EAE8E2] text-[#2C2C2C] border border-[#EAE8E2]">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}