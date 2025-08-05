import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}