"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, Plus, Settings, Check, ChevronsUpDown } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp?: Date
}

interface ChatInterfaceProps {
  conversationId?: string
  onTitleGenerated?: (id: string, title: string) => void
  onConversationCreated?: (conversation: any) => void  // Add this line
}

export function ChatInterface({ 
  conversationId, 
  onTitleGenerated,
  onConversationCreated  // Add this parameter
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  const [selectedModel, setSelectedModel] = useState("Auto")
  const [modelOpen, setModelOpen] = useState(false)

  const models = [
    { value: "auto", label: "Auto" },
    { value: "deepseek", label: "Deepseek" },
    { value: "glm", label: "GLM" },
    { value: "qwen", label: "Qwen" },
  ]

  // Load conversation messages when conversation ID changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) return
      
      try {
        const response = await fetch(`http://localhost:8001/api/v1/conversations/${conversationId}/messages?user_id=692a4738-5530-4627-8950-04d40d9b7d7e`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id || Date.now().toString(),
              role: msg.role,
              content: msg.content
            })))
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
      }
    }
    
    loadConversation()
  }, [conversationId])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    const inputMessage = inputValue
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)

    try {
      const response = await fetch('http://localhost:8001/api/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel.toLowerCase() === 'auto' ? 'auto' : selectedModel.toLowerCase(),
          conversation_id: conversationId,
          user_id: "692a4738-5530-4627-8950-04d40d9b7d7e",  // Add this line
          stream: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      // Check for new conversation ID in response headers
      let newConversationId: string | null = null
      if (response.headers.get('X-Conversation-Id')) {
        newConversationId = response.headers.get('X-Conversation-Id')
        
        // Add the new conversation to state
        if (onConversationCreated && newConversationId) {
          const newConversation = {
            id: newConversationId,
            title: 'New Chat',  // Temporary title until AI generates one
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          onConversationCreated(newConversation)
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      const assistantMessageId = (Date.now() + 1).toString()
      let assistantContent = ''
      
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      }])

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                assistantContent += data.content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      // After streaming completes - generate title for new conversation
      if (messages.length === 0 && assistantContent) {
        // Use the new conversation ID if one was created, otherwise use the existing one
        const targetConversationId = newConversationId || conversationId
        
        // Generate title for new conversation
        try {
          const titleResponse = await fetch('http://localhost:8001/api/v1/conversations/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: targetConversationId,
              user_id: "692a4738-5530-4627-8950-04d40d9b7d7e",
              messages: [
                { role: 'user', content: userMessage.content },
                { role: 'assistant', content: assistantContent }
              ]
            })
          })
          
          if (titleResponse.ok) {
            const titleData = await titleResponse.json()
            
            // Use the new updateConversationTitle method instead of onTitleGenerated
            if (onTitleGenerated && titleData.title && targetConversationId) {
              // Call the update method with the conversation ID and new title
              onTitleGenerated(targetConversationId, titleData.title)
            }
          }
        } catch (error) {
          console.error('Failed to generate title:', error)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isNewChat = messages.length === 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelOpen && !(event.target as Element).closest(".relative")) {
        setModelOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [modelOpen])

  if (isNewChat) {
    // Centered layout for new chat
    return (
      <div className="flex flex-col h-full bg-[#F8F6F2] dark:bg-gray-900">
        {/* Chat Header */}
        <div className="p-6 bg-[#F8F6F2] dark:bg-gray-900 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-white">New Chat</h2>
        </div>

        {/* Centered Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-8">
            {/* Quote with Logo */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="bg-[#3A4D6F] rounded-lg p-2 shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 9V15M15 9V15M9 12H15M17 19H7C4.79086 19 3 17.2091 3 15V9C3 6.79086 4.79086 5 7 5H17C19.2091 5 21 6.79086 21 9V15C21 17.2091 19.2091 19 17 19Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-medium text-[#2C2C2C] dark:text-white">What's on your mind today?</h1>
              </div>
            </div>

            {/* Centered Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-[#EAE8E2] dark:border-gray-700 focus-within:border-[#B8C5D6] dark:focus-within:border-[#3A4D6F] focus-within:ring-1 focus-within:ring-[#B8C5D6] dark:focus-within:ring-[#3A4D6F] focus-within:shadow-none transition-colors">
              <div className="relative">
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress as any}
                  placeholder="How can I help you today?"
                  className="w-full bg-transparent border-none resize-none p-2 pl-3 focus:ring-0 focus:outline-none text-base text-[#2C2C2C] dark:text-white placeholder:text-[#7A7A7A] dark:placeholder:text-gray-400 shadow-none focus:shadow-none"
                  rows={1}
                  disabled={isStreaming}
                />
              </div>
              <div className="flex items-center gap-2 mt-1 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#7A7A7A] dark:text-gray-400 hover:bg-[#EAE8E2] dark:hover:bg-gray-700 hover:text-[#2C2C2C] dark:hover:text-white rounded-lg"
                >
                  <Plus className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#7A7A7A] dark:text-gray-400 hover:bg-[#EAE8E2] dark:hover:bg-gray-700 hover:text-[#2C2C2C] dark:hover:text-white rounded-lg"
                >
                  <Settings className="size-5" />
                </Button>
                <div className="flex-1"></div>
                {/* Model Selector */}
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setModelOpen(!modelOpen)}
                    className="w-[120px] justify-between border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent text-sm shadow-none"
                  >
                    {selectedModel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {modelOpen && (
                    <div className="absolute top-full mt-1 w-[120px] bg-white dark:bg-gray-800 border border-[#EAE8E2] dark:border-gray-700 rounded-md overflow-hidden z-50">
                      {models.map((model) => (
                        <button
                          key={model.value}
                          onClick={() => {
                            setSelectedModel(model.label)
                            setModelOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Check className={`h-4 w-4 ${selectedModel === model.label ? "opacity-100" : "opacity-0"}`} />
                          {model.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className="bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white size-10 p-0 rounded-lg shadow-sm"
                >
                  <Send className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal chat layout with messages
  return (
    <div className="flex flex-col h-full bg-[#F8F6F2] dark:bg-gray-900">
      {/* Chat Header */}
      <div className="p-6 bg-[#F8F6F2] dark:bg-gray-900 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-white">
          {messages.length > 1 ? "Getting started with React" : "New Chat"}
        </h2>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={`msg-${message.id}-${index}`} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="size-10 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-[#3A4D6F] text-white">
                    <Bot className="size-5" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[70%] ${message.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#3A4D6F] text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-[#2C2C2C] dark:text-white shadow-sm border border-[#EAE8E2] dark:border-gray-700"
                  }`}
                >
                  <p className="text-base leading-relaxed">{message.content}</p>
                </div>
                <p className="text-xs text-[#7A7A7A] dark:text-gray-400 mt-2 px-2">{message.timestamp ? formatTime(message.timestamp) : ''}</p>
              </div>

              {message.role === "user" && (
                <Avatar className="size-10 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-[#3A4D6F] text-white font-medium">JD</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-[#F8F6F2] dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-1 max-w-3xl mx-auto shadow-sm border border-[#EAE8E2] dark:border-gray-700 focus-within:border-[#B8C5D6] dark:focus-within:border-[#3A4D6F] focus-within:ring-1 focus-within:ring-[#B8C5D6] dark:focus-within:ring-[#3A4D6F] focus-within:shadow-none transition-colors">
          <div className="relative">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress as any}
              placeholder="Reply to CmdShift..."
              className="w-full bg-transparent border-none resize-none p-2 pl-3 focus:ring-0 focus:outline-none text-base text-[#2C2C2C] dark:text-white placeholder:text-[#7A7A7A] dark:placeholder:text-gray-400 shadow-none focus:shadow-none"
              rows={1}
              disabled={isStreaming}
            />
          </div>
          <div className="flex items-center gap-2 mt-1 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#7A7A7A] dark:text-gray-400 hover:bg-[#EAE8E2] dark:hover:bg-gray-700 hover:text-[#2C2C2C] dark:hover:text-white rounded-lg"
            >
              <Plus className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#7A7A7A] dark:text-gray-400 hover:bg-[#EAE8E2] dark:hover:bg-gray-700 hover:text-[#2C2C2C] dark:hover:text-white rounded-lg"
            >
              <Settings className="size-5" />
            </Button>
            <div className="flex-1"></div>
            {/* Model Selector */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setModelOpen(!modelOpen)}
                className="w-[120px] justify-between border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent text-sm shadow-none"
              >
                {selectedModel}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {modelOpen && (
                <div
                  className={`absolute ${messages.length === 0 ? "top-full mt-1" : "bottom-full mb-1"} w-[120px] bg-white dark:bg-gray-800 border border-[#EAE8E2] dark:border-gray-700 rounded-md overflow-hidden z-50`}
                >
                  {models.map((model) => (
                    <button
                      key={model.value}
                      onClick={() => {
                        setSelectedModel(model.label)
                        setModelOpen(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Check className={`h-4 w-4 ${selectedModel === model.label ? "opacity-100" : "opacity-0"}`} />
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white size-10 p-0 rounded-lg shadow-sm"
            >
              <Send className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
