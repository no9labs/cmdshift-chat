'use client';

import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  userId: string;
  messageCount: number;
}

export function useConversations(initialConversations?: Conversation[]) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations || []);
  const [isLoading, setIsLoading] = useState(!initialConversations);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/web-api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (title?: string, firstMessage?: string) => {
    try {
      const response = await fetch('/web-api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, firstMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      
      // Add the new conversation to the list
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  useEffect(() => {
    // Only fetch if we don't have initial conversations
    if (!initialConversations) {
      fetchConversations();
    }
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
    createConversation,
  };
}