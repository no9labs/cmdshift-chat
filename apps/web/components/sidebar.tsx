'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquare, FolderOpen, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConversations } from '@/hooks/useConversations';

interface SidebarProps {
  user: any;
  initialConversations?: any[];
}

export function Sidebar({ user, initialConversations = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Use the hook with initial data
  const { conversations, createConversation, isLoading, refetch } = useConversations(initialConversations);

  // Expose refresh function to window
  useEffect(() => {
    (window as any).refreshConversations = refetch;
    
    // Cleanup on unmount
    return () => {
      delete (window as any).refreshConversations;
    };
  }, [refetch]);

  const handleNewChat = async () => {
    const newConversation = await createConversation();
    if (newConversation) {
      router.push(`/chat/${newConversation.id}`);
    }
  };

  const navItems = [
    { icon: MessageSquare, label: 'Chats', href: '/chat/new', active: pathname?.startsWith('/chat') },
    { icon: FolderOpen, label: 'Projects', href: '/projects', active: pathname === '/projects' },
    { icon: FileText, label: 'Artifacts', href: '/artifacts', active: pathname === '/artifacts' },
  ];

  return (
    <div className={cn(
      "flex flex-col border-r bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and collapse button */}
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">CmdShift</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New chat button */}
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start" 
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          {!collapsed && "New chat"}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="space-y-1 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-muted-foreground hover:text-accent-foreground",
              collapsed && "justify-center"
            )}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Recent conversations */}
      {!collapsed && (
        <div className="flex-1 flex flex-col px-2 py-4">
          <h3 className="mb-2 px-3 text-xs font-medium text-muted-foreground">Recent</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {conversations.map((conv) => {
                const isActive = pathname === `/chat/${conv.id}`;
                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <span className="font-medium truncate">{conv.title}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </span>
                    )}
                  </Link>
                );
              })}
              {conversations.length === 0 && !isLoading && (
                <p className="px-3 text-sm text-muted-foreground">No conversations yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Bottom section */}
      <div className="mt-auto border-t p-2 space-y-1">
        <Link
          href="/usage"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/50",
            collapsed && "justify-center"
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {!collapsed && <span>Usage</span>}
        </Link>
        
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/50",
            collapsed && "justify-center"
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* User profile */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  collapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">PRO Plan</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}