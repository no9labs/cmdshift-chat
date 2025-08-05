'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
  user: any
  initialConversations: any[]
}

export function LayoutWrapper({ children, user, initialConversations }: LayoutWrapperProps) {
  const pathname = usePathname()
  const showSidebar = pathname?.startsWith('/chat') || 
                     pathname === '/profile' || 
                     pathname === '/settings' || 
                     pathname === '/usage'

  return (
    <div className="flex h-screen bg-[#F8F6F2]">
      {/* Conditionally render sidebar on specific pages */}
      {showSidebar && (
        <Sidebar user={user} initialConversations={initialConversations} />
      )}
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}