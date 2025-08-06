import { Sidebar } from "@/components/sidebar"
import { ProfileContent } from "@/components/profile-content"
import { ConversationsProvider } from "@/contexts/conversations-context"

export default function ProfilePage() {
  return (
    <ConversationsProvider>
      <div className="flex h-screen bg-[#F8F6F2] dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ProfileContent />
        </main>
      </div>
    </ConversationsProvider>
  )
}
