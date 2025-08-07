import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './useUser'

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const supabase = createClient()

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/web-api/conversations?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const refreshConversations = useCallback(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    refreshConversations
  }
}