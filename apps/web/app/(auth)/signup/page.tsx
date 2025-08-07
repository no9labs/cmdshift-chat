"use client"

import { SignupForm } from "@/components/signup-form"
import { Globe } from "@/components/magicui/globe"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { Meteors } from "@/components/magicui/meteors"
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "@/hooks/useTheme"

export default function SignupPage() {
  const { theme } = useTheme()
  // Initialize with the correct theme from the start
  const [logoSrc, setLogoSrc] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') 
        ? "/cmd-logo-no-padding.svg" 
        : "/cmd-logo-inverted.svg"
    }
    return "/cmd-logo-no-padding.svg"
  })
  const [loginLogoSrc, setLoginLogoSrc] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
        ? "/login-logo-dark.svg"
        : "/login-logo-light.svg"
    }
    return "/login-logo-dark.svg"
  })
  const [headlineIndex, setHeadlineIndex] = useState(0)
  
  const headlines = [
    {
      main: "The AI Operating System",
      sub: "Where conversations never end and context never dies"
    },
    {
      main: "Your Persistent AI Workspace",
      sub: "The first AI that truly remembers everything"
    },
    {
      main: "The Infinite Intelligence Platform",
      sub: "Command your AI empire"
    },
    {
      main: "AI That Never Sleeps",
      sub: "Where conversations never end and context never dies"
    }
  ]
  
  useEffect(() => {
    const updateLogo = () => {
      const root = window.document.documentElement
      const isDark = root.classList.contains('dark')
      setLogoSrc(isDark ? "/cmd-logo-no-padding.svg" : "/cmd-logo-inverted.svg")
      setLoginLogoSrc(isDark ? "/login-logo-dark.svg" : "/login-logo-light.svg")
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
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [headlines.length])
  
  return (
    <div className="min-h-screen w-full flex lg:grid lg:grid-cols-2">
      {/* Theme toggle in top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex flex-col bg-white dark:bg-gradient-to-br dark:from-zinc-950 dark:to-zinc-900 relative overflow-hidden">
        {/* Dot pattern background */}
        <DotPattern 
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className="[mask-image:radial-gradient(600px_circle_at_center,white,transparent)] opacity-70 dark:opacity-50"
        />
        
        {/* Logo in top left corner */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center space-x-3">
            <Image 
              src={logoSrc} 
              alt="CmdShift Logo" 
              width={56} 
              height={56}
            />
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">CmdShift</span>
          </div>
        </div>
        
        {/* Signup form centered */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <SignupForm />
        </div>
      </div>
      <div className="hidden lg:block relative bg-gradient-to-br from-zinc-100 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 overflow-hidden">
        {/* Interactive Grid Pattern */}
        <InteractiveGridPattern 
          width={30}
          height={30}
          squares={[30, 20]}
          className="absolute inset-0 h-full w-full opacity-30 dark:opacity-20"
          squaresClassName="stroke-zinc-400/30 dark:stroke-zinc-600/30 [&:hover]:fill-primary/10 dark:[&:hover]:fill-primary/5"
        />
        
        {/* Meteors background */}
        <Meteors number={20} />
        
        <div className="relative z-10 h-full">
          {/* Login Logo at the top with padding */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-[900px]">
            <img 
              src={loginLogoSrc} 
              alt="CmdShift" 
              className="w-full h-auto"
            />
          </div>
          
          {/* Globe Component - positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[600px]">
            <div className="relative w-full h-full">
              <Globe className="!max-w-none !w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
