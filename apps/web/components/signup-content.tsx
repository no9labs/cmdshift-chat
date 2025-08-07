"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  User,
  Github,
  Chrome,
  Apple,
  ComputerIcon as Microsoft,
  ArrowRight,
  Shield,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  SquareTerminal,
} from "lucide-react"
import Link from "next/link"

interface PasswordStrength {
  score: number
  label: string
  color: string
  bgColor: string
}

export function SignupContent() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    color: "",
    bgColor: "",
  })

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: "", color: "", bgColor: "" }

    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    score = Object.values(checks).filter(Boolean).length

    if (score <= 1) {
      return { score: 1, label: "Weak", color: "text-red-600", bgColor: "bg-red-500" }
    } else if (score <= 2) {
      return { score: 2, label: "Fair", color: "text-orange-600", bgColor: "bg-orange-500" }
    } else if (score <= 3) {
      return { score: 3, label: "Good", color: "text-yellow-600", bgColor: "bg-yellow-500" }
    } else if (score <= 4) {
      return { score: 4, label: "Strong", color: "text-green-600", bgColor: "bg-green-500" }
    } else {
      return { score: 5, label: "Very Strong", color: "text-green-700", bgColor: "bg-green-600" }
    }
  }

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy")
      return
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password")
      return
    }

    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          },
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        // Create or update user profile - use upsert to handle existing profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: formData.email,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            subscription_tier: 'FREE',
          })
          .select()
          .single()

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't show this error to user, profile will be created on first login if needed
        }

        // After successful signup, direct user to verify email
        setSuccess('Account created successfully! Please check your email to verify your account before logging in.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Signup error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: string) => {
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
        setError(`Failed to sign up with ${provider}. Please try again.`)
        console.error("Social signup error:", error)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Social signup error:", err)
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

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordsDontMatch = formData.confirmPassword && formData.password !== formData.confirmPassword

  return (
    <div className="relative">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-lg hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-900 rounded-xl p-3 shadow-sm">
              <SquareTerminal className="w-8 h-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Create your account
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Join CmdShift and start your AI-powered conversations
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

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name Fields - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-zinc-900 dark:text-white">
                  First name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10 border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-none focus:shadow-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-zinc-900 dark:text-white">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-none focus:shadow-none"
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-none focus:shadow-none"
                  required
                />
              </div>
            </div>

            {/* Password Field with Strength Indicator */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-900 dark:text-white">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Password strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          level <= passwordStrength.score ? passwordStrength.bgColor : "bg-zinc-200 dark:bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <div className="flex items-center gap-2">
                      {formData.password.length >= 8 ? (
                        <Check className="size-3 text-green-600" />
                      ) : (
                        <X className="size-3 text-red-500" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? (
                        <Check className="size-3 text-green-600" />
                      ) : (
                        <X className="size-3 text-red-500" />
                      )}
                      <span>Upper & lowercase letters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/\d/.test(formData.password) ? (
                        <Check className="size-3 text-green-600" />
                      ) : (
                        <X className="size-3 text-red-500" />
                      )}
                      <span>At least one number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-900 dark:text-white">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pl-10 pr-10 bg-white dark:bg-zinc-800 focus:ring-1 text-zinc-900 dark:text-white shadow-none focus:shadow-none ${
                    passwordsMatch
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : passwordsDontMatch
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 dark:border-zinc-600 focus:border-[#3A4D6F] focus:ring-[#3A4D6F]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <>
                      <Check className="size-3 text-green-600" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="size-3 text-red-500" />
                      <span className="text-red-500">Passwords don't match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="border-zinc-200 dark:border-zinc-600 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-[#3A4D6F] mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-zinc-900 dark:text-white cursor-pointer select-none leading-relaxed"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-zinc-900 hover:text-zinc-900/80 font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-zinc-900 hover:text-zinc-900/80 font-medium">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              disabled={isLoading || !agreeToTerms || !passwordsMatch || passwordStrength.score < 2}
              className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-white font-medium py-3 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create account
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

          {/* Social Login Grid - 2x2 */}
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">Continue with</p>
            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map((provider) => {
                const IconComponent = provider.icon
                return (
                  <Button
                    key={provider.name}
                    variant="outline"
                    onClick={() => handleSocialSignup(provider.name)}
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
              Your data is protected with enterprise-grade security
            </p>
          </div>

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="text-zinc-900 hover:text-zinc-900/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
