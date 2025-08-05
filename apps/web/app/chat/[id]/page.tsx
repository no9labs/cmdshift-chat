import { ChatInterface } from "@/components/chat-interface"

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatInterface />
}
