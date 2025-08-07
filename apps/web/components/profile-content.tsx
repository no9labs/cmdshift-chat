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
import { MagicCard } from "@/components/magicui/magic-card"
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
    <div className="flex flex-col h-full bg-background">
      {/* Alert Notification */}
      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <Alert className="w-96 border-border bg-card/95 backdrop-blur">
            <div className="flex items-center gap-2">
              {alertState.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className="text-card-foreground">
                {alertState.message}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-background flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-base text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Info Card */}
          <MagicCard className="rounded-xl border border-border shadow-sm">
          <Card className="bg-transparent border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="size-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Profile Information
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Your basic account information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="size-20">
                  <AvatarImage src={`https://placehold.co/80x80/3A4D6F/FFFFFF?text=${user.avatar}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">{user.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{user.name}</h3>
                  <p className="text-base text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Member since {user.joinDate}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          </MagicCard>

          {/* Subscription Status Card */}
          <MagicCard className="rounded-xl border border-border shadow-sm">
          <Card className="bg-transparent border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">Subscription</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Crown className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">Current Plan</h4>
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        {user.subscription}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Next billing: {user.nextBilling}</p>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Crown className="size-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">∞</div>
                  <div className="text-sm text-muted-foreground">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">∞</div>
                  <div className="text-sm text-muted-foreground">Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">∞</div>
                  <div className="text-sm text-muted-foreground">Storage</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </MagicCard>

          {/* Usage Summary Card */}
          <MagicCard className="rounded-xl border border-border shadow-sm">
          <Card className="bg-transparent border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">Usage Summary</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Your current month's usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Messages Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Messages</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usage.messagesThisMonth} / {usage.messageLimit}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(usage.messagesThisMonth / usage.messageLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tokens Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Tokens</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usage.tokensUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(usage.tokensUsed / usage.tokenLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <MessageSquare className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {usage.conversationsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Conversations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">12h 34m</div>
                    <div className="text-sm text-muted-foreground">Time Saved</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </MagicCard>

          {/* Account Settings Card */}
          <MagicCard className="rounded-xl border border-border shadow-sm">
          <Card className="bg-transparent border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">Account Settings</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Customize your account preferences and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                      className="border-input focus:border-ring focus:ring-1 focus:ring-ring bg-background text-foreground shadow-none focus:shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                      className="border-input focus:border-ring focus:ring-1 focus:ring-ring bg-background text-foreground shadow-none focus:shadow-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="border-input focus:border-ring focus:ring-1 focus:ring-ring bg-background text-foreground shadow-none focus:shadow-none"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Palette className="size-4 text-muted-foreground" />
                  Preferences
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">
                          Receive updates about your account
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Public Profile</div>
                        <div className="text-sm text-muted-foreground">
                          Make your profile visible to others
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={publicProfile}
                      onCheckedChange={setPublicProfile}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-muted-foreground" />
                  Security
                </h4>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                  >
                    Two-Factor Authentication
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                  >
                    Download Account Data
                  </Button>
                </div>
              </div>

              {/* Save Changes */}
              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={handleSaveChanges}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </MagicCard>
        </div>
      </div>
    </div>
  )
}