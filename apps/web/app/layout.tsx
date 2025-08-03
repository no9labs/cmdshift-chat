import "./globals.css"
import { Inter } from "next/font/google"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CmdShift - AI Chat Platform",
  description: "Chat with multiple AI models without limits",
}

async function getConversations() {
  try {
    const cookieStore = await cookies();
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/conversations`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: 'no-store'
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.conversations || []
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  // Fetch conversations from API
  const conversations = await getConversations()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen">
            {/* Sidebar */}
            <Sidebar user={user} initialConversations={conversations} />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Top Bar */}
              <header className="flex h-14 items-center justify-between border-b px-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Beta</span>
                </div>
                <ThemeToggle />
              </header>
              
              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
          
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}