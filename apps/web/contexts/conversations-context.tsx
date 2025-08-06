'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface ConversationsContextType {
  conversations: Conversation[]
  isLoading: boolean
  refreshConversations: () => Promise<void>
  updateConversationTitle: (id: string, title: string) => void
  addTemporaryConversation: (id: string) => void
  addConversation: (conversation: Conversation) => void  // Add this line
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined)

const USER_ID = '692a4738-5530-4627-8950-04d40d9b7d7e'

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8001/api/v1/conversations/?user_id=${USER_ID}`
      )
      const data = await response.json()
      
      // Remove duplicates
      const uniqueConversations = data.conversations?.reduce((acc: Conversation[], conv: Conversation) => {
        if (!acc.find(c => c.id === conv.id)) {
          acc.push(conv)
        }
        return acc
      }, []) || []
      
      setConversations(uniqueConversations)
      
    } catch (error) {
      console.error('[ConversationsContext] Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations(prev => {
      const newConvs = [...prev]
      const index = newConvs.findIndex(c => c.id === id)
      
      if (index !== -1) {
        newConvs[index] = { ...newConvs[index], title }
      }
      
      return newConvs
    })
  }, [])

  const addTemporaryConversation = useCallback((id: string) => {
    const tempConv: Conversation = {
      id,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setConversations(prev => [tempConv, ...prev])
  }, [])

  // Add a new conversation with full control over its properties
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.some(c => c.id === conversation.id)
      if (exists) {
        return prev
      }
      
      // Add new conversation to the beginning
      const updated = [conversation, ...prev]
      return updated
    })
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return (
    <ConversationsContext.Provider 
      value={{
        conversations,
        isLoading,
        refreshConversations: fetchConversations,
        updateConversationTitle,
        addTemporaryConversation,
        addConversation  // Add this line
      }}
    >
      {children}
    </ConversationsContext.Provider>
  )
}

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider')
  }
  return context
}