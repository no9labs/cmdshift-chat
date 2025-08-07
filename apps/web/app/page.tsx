"use client"

import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { ConversationsProvider } from "@/contexts/conversations-context"
import { useConversations } from "@/hooks/useConversations"

function HomeContent() {
  const { addConversation, updateConversationTitle } = useConversations()
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <ChatInterface 
          conversationId={conversationId}
          onConversationCreated={addConversation}
          onTitleGenerated={updateConversationTitle}
        />
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <ConversationsProvider>
      <HomeContent />
    </ConversationsProvider>
  )
}
