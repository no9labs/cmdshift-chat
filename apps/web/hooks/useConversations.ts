'use client'

import { useState, useEffect, useCallback } from 'react'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

const USER_ID = '692a4738-5530-4627-8950-04d40d9b7d7e'

export function useConversations() {
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
      console.error('[useConversations] Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Direct update method that doesn't rely on fetching
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

  // Add temporary conversation
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
      // Add new conversation to the beginning
      const updated = [conversation, ...prev]
      return updated
    })
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return { 
    conversations, 
    isLoading,
    refreshConversations: fetchConversations,
    updateConversationTitle,  // Export the new method
    addTemporaryConversation,
    addConversation  // Add this line
  }
}