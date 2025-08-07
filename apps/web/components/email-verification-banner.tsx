'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, Mail } from 'lucide-react'

export function EmailVerificationBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkEmailVerification()
  }, [])

  const checkEmailVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !user.email_confirmed_at) {
      setShowBanner(true)
    }
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })
      
      if (!error) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    }
    setIsResending(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Please verify your email address to unlock all features.
              {resendSuccess && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  Verification email sent!
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending}
              className="text-xs"
            >
              {isResending ? 'Sending...' : 'Resend Email'}
            </Button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}