"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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
      } bg-[#EAE8E2] dark:bg-gray-800 p-4 flex flex-col justify-between transition-all duration-300 size-full relative`}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Logo and Brand */}
        <div className="mb-8">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleNewChat}
                className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm flex-shrink-0 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path
                    d="M9 9V15M15 9V15M9 12H15M17 19H7C4.79086 19 3 17.2091 3 15V9C3 6.79086 4.79086 5 7 5H17C19.2091 5 21 6.79086 21 9V15C21 17.2091 19.2091 19 17 19Z"
                    stroke="#2C2C2C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="size-4 text-[#7A7A7A] dark:text-gray-400 rotate-180" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-3 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
                >
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm flex-shrink-0">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M9 9V15M15 9V15M9 12H15M17 19H7C4.79086 19 3 17.2091 3 15V9C3 6.79086 4.79086 5 7 5H17C19.2091 5 21 6.79086 21 9V15C21 17.2091 19.2091 19 17 19Z"
                        stroke="#2C2C2C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-[#2C2C2C] dark:text-white whitespace-nowrap overflow-hidden">
                    CmdShift
                  </h1>
                </button>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="size-4 text-[#7A7A7A] dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-2" : "justify-center gap-2 px-4"
          } bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 transition-all text-white font-medium py-3 rounded-lg shadow-sm mb-3 border-0`}
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
          } bg-white/50 hover:bg-white/70 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 transition-all text-[#2C2C2C] dark:text-white font-medium py-2 rounded-lg shadow-sm mb-6 border border-[#7A7A7A]/20 dark:border-gray-600/20`}
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
              className="flex items-center justify-between w-full text-sm font-medium text-[#7A7A7A] dark:text-gray-400 mb-3 px-2 hover:text-[#5A5A5A] dark:hover:text-gray-300 transition-colors"
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
                          "hover:bg-white/50 hover:text-[#2C2C2C] dark:hover:bg-gray-700/50 dark:hover:text-white",
                          "group relative",
                          pathname === `/chat/${conversation.id}` && "bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white shadow-sm"
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
      <div className="border-t border-[#7A7A7A]/20 dark:border-gray-600/20 pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center w-full hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg p-3 transition-colors focus-visible:outline-none ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              <Avatar className="size-10 flex-shrink-0">
                <AvatarImage src={`https://placehold.co/40x40/3A4D6F/FFFFFF?text=${initials}`} />
                <AvatarFallback className="bg-[#3A4D6F] text-white font-medium">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <p className="font-medium text-[#2C2C2C] dark:text-white text-sm truncate">{displayName}</p>
                  <p className="text-xs text-[#7A7A7A] dark:text-gray-400 truncate">{subscriptionTier}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700"
          >
            <div className="text-xs text-muted-foreground pt-1 px-2 pb-2 overflow-ellipsis truncate">
              {userEmail}
            </div>
            <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              <Link href="/profile" className="flex items-center gap-2 text-[#2C2C2C] dark:text-white">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              <Link href="/pricing" className="flex items-center gap-2 text-[#2C2C2C] dark:text-white">
                <CreditCard className="size-4" />
                Upgrade Plan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2 text-[#2C2C2C] dark:text-white">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              <Link href="/usage" className="flex items-center gap-2 text-[#2C2C2C] dark:text-white">
                <User className="size-4" />
                Usage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#EAE8E2] dark:bg-gray-700" />
            <DropdownMenuItem className="flex items-center gap-2 text-[#2C2C2C] dark:text-white focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer">
              <HelpCircle className="size-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#EAE8E2] dark:bg-gray-700" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-[#C84A4A] focus:bg-red-50 dark:focus:bg-red-900/50 focus:text-red-600 cursor-pointer"
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