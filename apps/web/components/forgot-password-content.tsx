"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
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
        <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
                <CheckCircle className="size-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-[#2C2C2C] dark:text-white mb-2">
              Check your email
            </CardTitle>
            <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
              >
                Try again
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[#3A4D6F] hover:text-[#3A4D6F]/80 font-medium transition-colors"
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
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="bg-[#3A4D6F] rounded-xl p-3 shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 9V15M15 9V15M9 12H15M17 19H7C4.79086 19 3 17.2091 3 15V9C3 6.79086 4.79086 5 7 5H17C19.2091 5 21 6.79086 21 9V15C21 17.2091 19.2091 19 17 19Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-[#2C2C2C] dark:text-white mb-2">Forgot password?</CardTitle>
          <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
            No worries, we'll send you reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#2C2C2C] dark:text-white">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-[#7A7A7A] dark:text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white shadow-none focus:shadow-none"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white font-medium py-3 transition-all duration-200"
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
              className="inline-flex items-center gap-2 text-sm text-[#3A4D6F] hover:text-[#3A4D6F]/80 font-medium transition-colors"
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
