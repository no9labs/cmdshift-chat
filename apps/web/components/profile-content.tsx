"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  CreditCard,
  BarChart3,
  Settings,
  Crown,
  MessageSquare,
  Clock,
  Zap,
  Bell,
  Shield,
  Globe,
  Palette,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export function ProfileContent() {
  const [notifications, setNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(false)

  // User data state (starts with mock data)
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "JD",
    joinDate: "March 2024",
    subscription: "FREE",
    nextBilling: "N/A",
  })

  const [usage, setUsage] = useState({
    messagesThisMonth: 127,
    messageLimit: 500,
    tokensUsed: 45230,
    tokenLimit: 100000,
    conversationsCount: 23,
  })

  // Add form state management
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  const [alertState, setAlertState] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({
    show: false,
    type: 'success',
    message: ''
  })

  useEffect(() => {
    const fetchUserData = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Get profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          const fullName = profile.full_name || authUser.email?.split('@')[0] || 'User'
          const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
          
          setUser({
            name: fullName,
            email: authUser.email || '',
            avatar: initials,
            joinDate: new Date(authUser.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long'
            }),
            subscription: profile.subscription_tier || 'FREE',
            nextBilling: profile.subscription_tier === 'FREE' ? 'N/A' : 'Monthly',
          })
          
          // Set usage limits based on subscription
          const monthlyLimit = profile.subscription_tier === 'PRO' ? 99999 : 
                             profile.subscription_tier === 'STARTER' ? 2000 : 50
          const tokenLimit = profile.subscription_tier === 'PRO' ? 999999 : 
                            profile.subscription_tier === 'STARTER' ? 500000 : 100000
          
          setUsage(prev => ({
            ...prev,
            messageLimit: monthlyLimit,
            tokenLimit: tokenLimit
          }))
          
          // Fetch usage data from backend
          try {
            const response = await fetch(`http://localhost:8001/api/v1/usage?user_id=${authUser.id}`)
            if (response.ok) {
              const usageData = await response.json()
              setUsage(prev => ({
                ...prev,
                messagesThisMonth: usageData.total_messages || 0,
                tokensUsed: usageData.total_tokens || 0,
                conversationsCount: usageData.conversation_count || 0
              }))
            }
          } catch (error) {
            console.error('Failed to fetch usage data:', error)
          }
        }
      }
    }
    
    fetchUserData()
  }, [])

  // Update formData when user changes
  useEffect(() => {
    if (user.name) {
      const nameParts = user.name.split(' ')
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email
      })
    }
  }, [user])

  const handleSaveChanges = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Update the user_profiles table with the new full name
        const fullName = `${formData.firstName} ${formData.lastName}`.trim()
        
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            full_name: fullName
          })
          .eq('id', user.id)
        
        if (error) {
          console.error('Error updating profile:', error)
          setAlertState({
            show: true,
            type: 'error',
            message: 'Error updating profile. Please try again.'
          })
          // Hide alert after 3 seconds
          setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000)
        } else {
          // Update local state to reflect saved changes
          setUser(prev => ({
            ...prev,
            name: fullName,
            email: formData.email
          }))
          
          // Show success alert
          setAlertState({
            show: true,
            type: 'success',
            message: 'Profile updated successfully!'
          })
          
          // Hide alert after 3 seconds (no page reload)
          setTimeout(() => {
            setAlertState(prev => ({ ...prev, show: false }))
          }, 3000)
          
          // Trigger a custom event to update the sidebar
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { name: fullName, email: formData.email } 
          }))
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      setAlertState({
        show: true,
        type: 'error',
        message: 'An error occurred. Please try again.'
      })
      // Hide alert after 3 seconds
      setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 3000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F6F2] dark:bg-gray-900">
      {/* Alert Notification */}
      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <Alert className="w-96 border-slate-700 bg-slate-800/95 backdrop-blur">
            <div className="flex items-center gap-2">
              {alertState.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="text-slate-200">
                {alertState.message}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-[#F8F6F2] dark:bg-gray-900 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C] dark:text-white">Profile</h1>
          <p className="text-base text-[#7A7A7A] dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Info Card */}
          <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                  Profile Information
                </CardTitle>
              </div>
              <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                Your basic account information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="size-20">
                  <AvatarImage src={`https://placehold.co/80x80/3A4D6F/FFFFFF?text=${user.avatar}`} />
                  <AvatarFallback className="bg-[#3A4D6F] text-white text-xl font-medium">{user.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-[#2C2C2C] dark:text-white">{user.name}</h3>
                  <p className="text-base text-[#7A7A7A] dark:text-gray-400">{user.email}</p>
                  <p className="text-sm text-[#7A7A7A] dark:text-gray-400">Member since {user.joinDate}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">Subscription</CardTitle>
              </div>
              <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EAE8E2] dark:bg-gray-700 rounded-lg">
                    <Crown className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#2C2C2C] dark:text-white">Current Plan</h4>
                      <Badge
                        variant="secondary"
                        className="bg-[#EAE8E2] dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700"
                      >
                        {user.subscription}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#7A7A7A] dark:text-gray-400">Next billing: {user.nextBilling}</p>
                  </div>
                </div>
                <Button className="bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white">
                  <Crown className="size-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#EAE8E2] dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[#2C2C2C] dark:text-white">∞</div>
                  <div className="text-sm text-[#7A7A7A] dark:text-gray-400">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[#2C2C2C] dark:text-white">∞</div>
                  <div className="text-sm text-[#7A7A7A] dark:text-gray-400">Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[#2C2C2C] dark:text-white">∞</div>
                  <div className="text-sm text-[#7A7A7A] dark:text-gray-400">Storage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary Card */}
          <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">Usage Summary</CardTitle>
              </div>
              <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                Your current month's usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Messages Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                    <span className="font-medium text-[#2C2C2C] dark:text-white">Messages</span>
                  </div>
                  <span className="text-sm text-[#7A7A7A] dark:text-gray-400">
                    {usage.messagesThisMonth} / {usage.messageLimit}
                  </span>
                </div>
                <div className="w-full bg-[#EAE8E2] dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#3A4D6F] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(usage.messagesThisMonth / usage.messageLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tokens Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                    <span className="font-medium text-[#2C2C2C] dark:text-white">Tokens</span>
                  </div>
                  <span className="text-sm text-[#7A7A7A] dark:text-gray-400">
                    {usage.tokensUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-[#EAE8E2] dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#3A4D6F] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(usage.tokensUsed / usage.tokenLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EAE8E2] dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EAE8E2] dark:bg-gray-700 rounded-lg">
                    <MessageSquare className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      {usage.conversationsCount}
                    </div>
                    <div className="text-sm text-[#7A7A7A] dark:text-gray-400">Conversations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EAE8E2] dark:bg-gray-700 rounded-lg">
                    <Clock className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#2C2C2C] dark:text-white">12h 34m</div>
                    <div className="text-sm text-[#7A7A7A] dark:text-gray-400">Time Saved</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">Account Settings</CardTitle>
              </div>
              <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                Customize your account preferences and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-[#2C2C2C] dark:text-white flex items-center gap-2">
                  <User className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-[#2C2C2C] dark:text-white">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                      className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white shadow-none focus:shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-[#2C2C2C] dark:text-white">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                      className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white shadow-none focus:shadow-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[#2C2C2C] dark:text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white shadow-none focus:shadow-none"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 pt-4 border-t border-[#EAE8E2] dark:border-gray-700">
                <h4 className="font-medium text-[#2C2C2C] dark:text-white flex items-center gap-2">
                  <Palette className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                  Preferences
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="size-4 text-[#7A7A7A] dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-[#2C2C2C] dark:text-white">Email Notifications</div>
                        <div className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Receive updates about your account
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                      className="data-[state=checked]:bg-[#3A4D6F]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="size-4 text-[#7A7A7A] dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-[#2C2C2C] dark:text-white">Public Profile</div>
                        <div className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Make your profile visible to others
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={publicProfile}
                      onCheckedChange={setPublicProfile}
                      className="data-[state=checked]:bg-[#3A4D6F]"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4 pt-4 border-t border-[#EAE8E2] dark:border-gray-700">
                <h4 className="font-medium text-[#2C2C2C] dark:text-white flex items-center gap-2">
                  <Shield className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                  Security
                </h4>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
                  >
                    Two-Factor Authentication
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
                  >
                    Download Account Data
                  </Button>
                </div>
              </div>

              {/* Save Changes */}
              <div className="pt-4 border-t border-[#EAE8E2] dark:border-gray-700">
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={handleSaveChanges}
                    className="bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}