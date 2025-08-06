import { Sidebar } from "@/components/sidebar"
import { SettingsContent } from "@/components/settings-content"
import { ConversationsProvider } from "@/contexts/conversations-context"

export default function SettingsPage() {
  return (
    <ConversationsProvider>
      <div className="flex h-screen bg-[#F8F6F2] dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <SettingsContent />
        </main>
      </div>
    </ConversationsProvider>
  )
}
