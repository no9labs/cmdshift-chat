import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  )
}
