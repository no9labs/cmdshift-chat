"use client";

import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Paperclip, Mic, User, Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages([...messages, newMessage]);
    setInput("");
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm here to help! This is a demo response. The actual AI integration will be connected soon.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Interactive Grid Pattern Background */}
      <InteractiveGridPattern
        width={30}
        height={30}
        squares={[50, 50]}
        className={cn(
          "absolute inset-0 h-full w-full opacity-20",
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
        squaresClassName="stroke-muted-foreground/20 fill-muted-foreground/5"
      />
      
      {/* Main Content Container */}
      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Header Section */}
        <div className="flex-none border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">CmdShift Chat</h1>
            </div>
            
            <Select defaultValue="auto">
              <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Smart Routing)</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="glm">GLM-4.5</SelectItem>
                <SelectItem value="qwen">Qwen-Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {messages.length === 0 ? (
                /* Welcome Message - shown when no messages */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-6 max-w-2xl px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 backdrop-blur-sm">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">How can I help you today?</h2>
                      <p className="text-muted-foreground">
                        I'm here to assist with coding, analysis, creative writing, and more.
                      </p>
                    </div>
                    
                    {/* Example prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                      <Card 
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors backdrop-blur-sm bg-background/50 border-border/50"
                        onClick={() => setInput("Write a Python function to analyze CSV data")}
                      >
                        <p className="text-sm">Write a Python function to analyze CSV data</p>
                      </Card>
                      <Card 
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors backdrop-blur-sm bg-background/50 border-border/50"
                        onClick={() => setInput("Explain how React hooks work")}
                      >
                        <p className="text-sm">Explain how React hooks work</p>
                      </Card>
                      <Card 
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors backdrop-blur-sm bg-background/50 border-border/50"
                        onClick={() => setInput("Help me debug this error message")}
                      >
                        <p className="text-sm">Help me debug this error message</p>
                      </Card>
                      <Card 
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors backdrop-blur-sm bg-background/50 border-border/50"
                        onClick={() => setInput("Create a responsive navigation menu")}
                      >
                        <p className="text-sm">Create a responsive navigation menu</p>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages List */
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="flex-none border-t border-border/50 backdrop-blur-sm bg-background/80">
              <div className="p-4">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[60px] max-h-[180px] pr-24 resize-none bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                      disabled={!input.trim()}
                      onClick={handleSend}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Helper Text */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {input.length}/4000
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}