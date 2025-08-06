'use client'

import { ChatInterface } from '@/components/chat-interface'

export default function NewChatPage() {
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="h-full">
      <ChatInterface conversationId={conversationId} />
    </div>
  )
}
