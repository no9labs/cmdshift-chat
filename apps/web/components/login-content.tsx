"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  Apple,
  ComputerIcon as Microsoft,
  ArrowRight,
  Shield,
  AlertCircle,
  CheckCircle2,
  SquareTerminal,
} from "lucide-react"
import Link from "next/link"

export function LoginContent() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        setSuccess("Login successful! Redirecting...")
        // Redirect to chat or dashboard
        setTimeout(() => {
          router.push('/chat/new')
        }, 1000)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setError(null)
    setSuccess(null)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Map provider names to Supabase provider types
      const providerMap: Record<string, any> = {
        'Google': 'google',
        'GitHub': 'github',
        'Apple': 'apple',
        'Microsoft': 'azure',
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerMap[provider],
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        setError(`Failed to login with ${provider}. Please try again.`)
        console.error("Social login error:", error)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Social login error:", err)
    }
  }

  const socialProviders = [
    {
      name: "Google",
      icon: Chrome,
      color: "hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800",
      iconColor: "text-red-600",
    },
    {
      name: "GitHub",
      icon: Github,
      color: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600",
      iconColor: "text-gray-900 dark:text-gray-100",
    },
    {
      name: "Apple",
      icon: Apple,
      color: "hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600",
      iconColor: "text-gray-900 dark:text-gray-100",
    },
    {
      name: "Microsoft",
      icon: Microsoft,
      color: "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800",
      iconColor: "text-blue-600",
    },
  ]

  return (
    <div className="relative">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
        <CardHeader className="text-center pb-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-900 rounded-xl p-3 shadow-sm">
              <SquareTerminal className="w-8 h-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Welcome back</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Sign in to your CmdShift account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert Messages */}
          {error && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-white">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-none focus:shadow-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-900 dark:text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-none focus:shadow-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-zinc-200 dark:border-zinc-600 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-[#3A4D6F]"
              />
              <Label htmlFor="remember" className="text-sm text-zinc-900 dark:text-white cursor-pointer select-none">
                Remember me for 30 days
              </Label>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-white font-medium py-3 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="size-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <Separator className="bg-zinc-200 dark:bg-zinc-800" />
            <div className="absolute inset-0 flex justify-center">
              <span className="bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-500 dark:text-zinc-400">OR</span>
            </div>
          </div>

          {/* Social Login Grid */}
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">Continue with</p>
            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map((provider) => {
                const IconComponent = provider.icon
                return (
                  <Button
                    key={provider.name}
                    variant="outline"
                    onClick={() => handleSocialLogin(provider.name)}
                    className={`border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white transition-all duration-200 ${provider.color}`}
                  >
                    <IconComponent className={`size-4 mr-2 ${provider.iconColor}`} />
                    {provider.name}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 bg-zinc-900/5 dark:bg-zinc-900/10 rounded-lg border border-[#3A4D6F]/20 dark:border-[#3A4D6F]/30">
            <Shield className="size-4 text-zinc-900 flex-shrink-0" />
            <p className="text-xs text-zinc-900 dark:text-white">
              Your login is secured with enterprise-grade encryption
            </p>
          </div>

          {/* Footer Links */}
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-zinc-900 hover:text-zinc-900/80 font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <Separator className="bg-zinc-200 dark:bg-zinc-800" />

            <div className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-zinc-900 hover:text-zinc-900/80 font-medium transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
