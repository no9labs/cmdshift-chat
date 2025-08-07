'use client'

import { ChatInterface } from '@/components/chat-interface'
import { useConversations } from '@/contexts/conversations-context'

export default function NewChatPage() {
  const { addConversation, updateConversationTitle } = useConversations()
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

  return (
    <div className="h-full">
      <ChatInterface 
        conversationId={conversationId}
        onConversationCreated={addConversation}
        onTitleGenerated={updateConversationTitle}
      />
    </div>
  )
}
