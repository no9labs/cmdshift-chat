"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, Settings, LogOut, CreditCard, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useConversations } from "@/hooks/useConversations"
import Link from "next/link"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { conversations } = useConversations()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
      }
    }
    fetchUser()
  }, [supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-dropdown')
      const button = document.getElementById('user-dropdown-button')
      if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSignOut = async () => {
    console.log('Sign out clicked')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    } catch (err) {
      console.error('Sign out failed:', err)
      // Force redirect even if there's an error
      window.location.href = "/login"
    }
  }

  const handleNewChat = () => {
    router.push("/chat/new")
  }

  return (
    <aside style={{
      width: collapsed ? '80px' : '250px',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'relative',
      transition: 'width 0.3s ease',
      borderRight: '1px solid #ddd'
    }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: collapsed ? '0' : '24px', margin: 0, transition: 'font-size 0.3s' }}>CmdShift</h1>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <Plus size={20} />
          {!collapsed && 'New Chat'}
        </button>

        {/* Chat History */}
        {!collapsed && (
          <div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Recent</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                    color: '#333',
                    backgroundColor: pathname === `/chat/${conversation.id}` ? '#e0e0e0' : 'transparent',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {conversation.title}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', position: 'relative' }}>
        <button
          id="user-dropdown-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            width: '100%',
            padding: '10px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0
          }}>
            {userEmail ? userEmail[0].toUpperCase() : 'G'}
          </div>
          {!collapsed && (
            <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail || 'Guest'}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div 
            id="user-dropdown"
            style={{
            position: 'absolute',
            bottom: '100%',
            left: '10px',
            right: '10px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '10px'
          }}>
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>
              <User size={16} /> Profile
            </Link>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>
              <CreditCard size={16} /> Upgrade Plan
            </Link>
            <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>
              <Settings size={16} /> Settings
            </Link>
            <Link href="/usage" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>
              <User size={16} /> Usage
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSignOut()
              }} 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', width: '100%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#dc3545', textAlign: 'left' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: '-15px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}