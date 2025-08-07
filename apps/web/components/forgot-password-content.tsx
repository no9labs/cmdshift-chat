"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mail, ArrowLeft, CheckCircle, SquareTerminal } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordContent() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 2000)
  }

  if (isSubmitted) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
                <CheckCircle className="size-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
              Check your email
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-transparent"
              >
                Try again
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-zinc-900 hover:text-zinc-900/80 font-medium transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-900 rounded-xl p-3 shadow-sm">
              <SquareTerminal className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Forgot password?</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            No worries, we'll send you reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-white font-medium py-3 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-zinc-900 hover:text-zinc-900/80 font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
