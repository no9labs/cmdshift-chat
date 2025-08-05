import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './useUser'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const streamingMessageRef = useRef<string>('')
  const supabase = createClient()
  const { user } = useUser()

  const sendMessage = useCallback(async (content: string, model: string = 'auto') => {
    if (!user) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    streamingMessageRef.current = ''

    const assistantMessageId = `msg_${Date.now()}_assistant`
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model,
          stream: true,
          user_id: user.id,
          conversation_id: conversationId === 'new' ? undefined : conversationId
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                streamingMessageRef.current += parsed.content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: streamingMessageRef.current }
                    : msg
                ))
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId))
    } finally {
      setIsLoading(false)
    }
  }, [user, conversationId, messages])

  return {
    messages,
    sendMessage,
    isLoading,
  }
}