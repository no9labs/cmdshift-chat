'use client'

import { ChatInterface } from '@/components/chat-interface'
import { useParams } from 'next/navigation'
import { useConversations } from '@/contexts/conversations-context'

export default function ChatPage() {
  const params = useParams()
  const conversationId = params.id as string
  const { updateConversationTitle, addConversation } = useConversations()  // Add addConversation here
  
  return (
    <div className="h-full">
      <ChatInterface 
        conversationId={conversationId} 
        onTitleGenerated={updateConversationTitle}
        onConversationCreated={addConversation}  // Add this new prop
      />
    </div>
  )
}
