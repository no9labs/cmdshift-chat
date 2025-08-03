import { ChatInterface } from '../../components/chat/ChatInterface';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  
  // If id is "new", just show empty chat
  if (id === "new") {
    return <ChatInterface conversationId="new" />;
  }
  
  // For existing conversations, we'll load them later
  // For now, just show the chat interface with the ID
  return <ChatInterface conversationId={id} />;
}