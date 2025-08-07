import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { ConversationsProvider } from "@/contexts/conversations-context"

export default function Home() {
  return (
    <ConversationsProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <ChatInterface />
        </main>
      </div>
    </ConversationsProvider>
  )
}
