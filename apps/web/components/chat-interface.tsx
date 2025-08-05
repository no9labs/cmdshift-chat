"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2 } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  model?: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('anonymous')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const params = useParams()
  const conversationId = params?.id as string || 'new'

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Get the authenticated user
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  // Load conversation history when conversationId changes
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId || conversationId === 'new' || !userId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/web-api/conversations/${conversationId}/messages`)
        if (response.ok) {
          const data = await response.json()
          const formattedMessages = (data.messages || []).map((msg: any) => ({
            id: crypto.randomUUID(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }))
          setMessages(formattedMessages)
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConversation()
  }, [conversationId, userId])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: 'auto',
          stream: false,
          user_id: userId,
          conversation_id: conversationId === 'new' ? null : conversationId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Handle new conversation creation
      if (data.conversation_id && conversationId === 'new') {
        router.push(`/chat/${data.conversation_id}`)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices[0].message.content,
        role: "assistant",
        timestamp: new Date(),
        model: data.model
      }
      
      setMessages((prev) => [...prev, assistantMessage])

      // Refresh sidebar conversations
      if (window.refreshConversations) {
        window.refreshConversations()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
      {/* Chat Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
          {messages.length > 0 ? "Chat Session" : "New Chat"}
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
          {messages.length > 0 ? `${messages.length} messages` : "Start a conversation"}
        </p>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollAreaRef} 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          backgroundColor: '#fafafa'
        }}
      >
        {messages.length === 0 && !isLoading && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#999'
          }}>
            <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Hello! I'm your AI assistant.</p>
            <p style={{ fontSize: '14px' }}>How can I help you today?</p>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '0 auto' }}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              style={{ 
                display: 'flex', 
                gap: '10px',
                justifyContent: message.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              {message.role === "assistant" && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={20} />
                </div>
              )}

              <div style={{ 
                maxWidth: '70%',
                order: message.role === "user" ? -1 : 0
              }}>
                <div style={{
                  padding: '10px 15px',
                  borderRadius: '10px',
                  backgroundColor: message.role === "user" ? '#007bff' : '#e9ecef',
                  color: message.role === "user" ? 'white' : '#333'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#999', 
                  margin: '5px 5px 0',
                  textAlign: message.role === "user" ? 'right' : 'left'
                }}>
                  {formatTime(message.timestamp)}
                  {message.model && ` • ${message.model}`}
                </p>
              </div>

              {message.role === "user" && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '14px'
                }}>
                  U
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={20} />
              </div>
              <div style={{
                padding: '10px 15px',
                borderRadius: '10px',
                backgroundColor: '#e9ecef'
              }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '14px', color: '#666' }}>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', gap: '10px', maxWidth: '800px', margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() && !isLoading ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

// Extend Window interface to include refreshConversations
declare global {
  interface Window {
    refreshConversations?: () => void;
  }
}