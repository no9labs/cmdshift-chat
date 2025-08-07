"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronDown, Plus, Settings, LogOut, CreditCard, HelpCircle, User, RefreshCw, MessageSquare } from "lucide-react"
import { useConversations } from "@/contexts/conversations-context"
import Link from "next/link"
import Image from "next/image"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [userLastName, setUserLastName] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<string>("FREE")
  const [isRecentCollapsed, setIsRecentCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { conversations, isLoading, refreshConversations, addTemporaryConversation, updateConversationTitle } = useConversations()
  const { theme } = useTheme()
  
  // Determine which logo to use based on theme
  const [logoSrc, setLogoSrc] = useState("/cmd-logo-no-padding.svg")
  
  useEffect(() => {
    const updateLogo = () => {
      const root = window.document.documentElement
      const isDark = root.classList.contains('dark')
      setLogoSrc(isDark ? "/cmd-logo-no-padding.svg" : "/cmd-logo-inverted.svg")
    }
    
    // Initial update
    updateLogo()
    
    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [theme])

  useEffect(() => {
    const fetchUserData = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || '')
        
        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          const fullName = profile.full_name || ''
          const nameParts = fullName.split(' ')
          setUserFirstName(nameParts[0] || user.email?.split('@')[0] || 'User')
          setUserLastName(nameParts.slice(1).join(' ') || '')
          setSubscriptionTier(profile.subscription_tier || 'FREE')
        } else {
          setUserFirstName(user.email?.split('@')[0] || 'User')
          setUserLastName('')
          setSubscriptionTier('FREE')
        }
      }
    }
    
    fetchUserData()
    
    // Listen for profile updates from the profile page
    const handleProfileUpdate = (event: CustomEvent) => {
      const { name, email } = event.detail
      if (name) {
        const nameParts = name.split(' ')
        setUserFirstName(nameParts[0] || email?.split('@')[0] || 'User')
        setUserLastName(nameParts.slice(1).join(' ') || '')
      }
      if (email) {
        setUserEmail(email)
      }
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleNewChat = () => {
    const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    // Add temporary conversation to sidebar immediately
    addTemporaryConversation(newConversationId)
    router.push(`/chat/${newConversationId}`)
  }

  const initials =
    userFirstName && userLastName
      ? `${userFirstName[0]}${userLastName[0]}`.toUpperCase()
      : userEmail
        ? userEmail.substring(0, 2).toUpperCase()
        : "G"

  const displayName = userFirstName && userLastName ? `${userFirstName} ${userLastName}` : userEmail || "Guest"

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-sidebar p-4 flex flex-col justify-between transition-all duration-300 size-full relative`}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Logo and Brand */}
        <div className="mb-8">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleNewChat}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image 
                  src={logoSrc} 
                  alt="CmdShift Logo" 
                  width={48} 
                  height={48}
                />
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
              >
                <ChevronLeft className="size-4 text-muted-foreground rotate-180" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-3 hover:bg-sidebar-accent rounded-lg p-2 transition-colors"
                >
                  <Image 
                    src={logoSrc} 
                    alt="CmdShift Logo" 
                    width={48} 
                    height={48}
                    className="flex-shrink-0"
                  />
                  <h1 className="text-xl font-semibold text-sidebar-foreground whitespace-nowrap overflow-hidden">
                    CmdShift
                  </h1>
                </button>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
              >
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-2" : "justify-center gap-2 px-4"
          } bg-primary hover:bg-primary/90 transition-all text-primary-foreground font-medium py-3 rounded-lg shadow-sm mb-3 border-0`}
          variant="default"
        >
          <Plus className="size-4 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">New Chat</span>}
        </Button>

        {/* Refresh Button */}
        <Button
          onClick={() => {
            refreshConversations()
          }}
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-2" : "justify-center gap-2 px-4"
          } bg-sidebar-accent hover:bg-sidebar-accent/70 transition-all text-sidebar-accent-foreground font-medium py-2 rounded-lg shadow-sm mb-6 border border-sidebar-border`}
          variant="outline"
        >
          <RefreshCw className="size-4 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Refresh</span>}
        </Button>

        {/* Chat History */}
        {!collapsed && (
          <>
            <button
              onClick={() => setIsRecentCollapsed(!isRecentCollapsed)}
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground mb-3 px-2 hover:text-sidebar-foreground transition-colors"
            >
              <span>Recent</span>
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${isRecentCollapsed ? '-rotate-90' : ''}`}
              />
            </button>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="px-2 py-2">
                {!isRecentCollapsed && (
                  <nav className="flex flex-col gap-px">
                    {conversations.map((conversation) => (
                      <Link
                        key={conversation.id}
                        href={`/chat/${conversation.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          "group relative",
                          pathname === `/chat/${conversation.id}` && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        )}
                      >
                        <MessageSquare className="size-4 flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">
                          {conversation.title || "New Chat"}
                        </span>
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Profile Section */}
      <div className="border-t border-sidebar-border pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center w-full hover:bg-sidebar-accent rounded-lg p-3 transition-colors focus-visible:outline-none ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              <Avatar className="size-10 flex-shrink-0">
                <AvatarImage src={`https://placehold.co/40x40/3A4D6F/FFFFFF?text=${initials}`} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <p className="font-medium text-sidebar-foreground text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{subscriptionTier}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover border-border"
          >
            <div className="text-xs text-muted-foreground pt-1 px-2 pb-2 overflow-ellipsis truncate">
              {userEmail}
            </div>
            <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <Link href="/profile" className="flex items-center gap-2 text-popover-foreground">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <Link href="/pricing" className="flex items-center gap-2 text-popover-foreground">
                <CreditCard className="size-4" />
                Upgrade Plan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2 text-popover-foreground">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <Link href="/usage" className="flex items-center gap-2 text-popover-foreground">
                <User className="size-4" />
                Usage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="flex items-center gap-2 text-popover-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
              <HelpCircle className="size-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}