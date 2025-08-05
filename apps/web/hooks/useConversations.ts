"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string
  title: string
  created_at?: string
  updated_at?: string
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const response = await fetch('/web-api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()

    // Set up global refresh function
    if (typeof window !== 'undefined') {
      window.refreshConversations = fetchConversations
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshConversations
      }
    }
  }, [])

  return { conversations, loading, refresh: fetchConversations }
}

// Extend Window interface
declare global {
  interface Window {
    refreshConversations?: () => void
  }
}