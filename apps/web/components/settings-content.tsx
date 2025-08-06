"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/hooks/useTheme"
import {
  Palette,
  Bell,
  Shield,
  Globe,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Mail,
  Lock,
  Eye,
  Trash2,
  Download,
  LogOut,
  Info,
  Smartphone,
  Settings2,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export function SettingsContent() {
  // Alert state for notifications
  const [alertState, setAlertState] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({
    show: false,
    type: 'success',
    message: ''
  })

  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Appearance settings
  const { theme, setTheme } = useTheme()
  const [compactMode, setCompactMode] = useState(false)
  const [animations, setAnimations] = useState(true)
  const [fontSize, setFontSize] = useState([14])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolume] = useState([75])

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [chatNotifications, setChatNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [notificationSound, setNotificationSound] = useState("default")

  // Privacy & Security settings
  const [profileVisibility, setProfileVisibility] = useState(false)
  const [dataCollection, setDataCollection] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)

  // Language & Region settings
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("utc")
  const [dateFormat, setDateFormat] = useState("mm/dd/yyyy")
  const [currency, setCurrency] = useState("usd")

  // Advanced settings
  const [betaFeatures, setBetaFeatures] = useState(false)
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  // Fetch user preferences from Supabase
  useEffect(() => {
    const fetchUserPreferences = async () => {
      setIsLoading(true)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Fetch user preferences from the database
          const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle() instead of single() to handle non-existent rows
          
          if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" error
            console.error('Error fetching preferences:', error)
          }
          
          if (preferences) {
            // Update state with fetched preferences using actual column names
            // Email notifications
            setEmailNotifications(preferences.account_updates ?? true)
            setMarketingEmails(preferences.marketing_emails ?? false)
            setWeeklyDigest(preferences.weekly_digest ?? true)
            
            // Push notifications
            setChatNotifications(preferences.chat_messages ?? true)
            setPushNotifications(preferences.system_alerts ?? true)
            
            // Other preferences
            setLanguage(preferences.language ?? "en")
            setTimezone(preferences.timezone ?? "utc")
            
            // Don't set theme here - it's already managed by useTheme hook
            // and setting it causes a flash. Theme is only saved to DB for persistence
          }
          
          // Always set these to defaults since they don't exist in DB yet
          setCompactMode(false)
          setAnimations(true)
          setNotificationSound("default")
          setProfileVisibility(false)
          setDataCollection(true)
          setTwoFactorAuth(false)
          setSessionTimeout(true)
          setLoginAlerts(true)
          setDateFormat("mm/dd/yyyy")
          setCurrency("usd")
          setBetaFeatures(false)
          setAnalyticsOptOut(false)
          setAutoSave(true)
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPreferences()
  }, [])

  // Save preferences to Supabase
  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Using actual column names from the database
        const preferences = {
          user_id: user.id,
          
          // Email notification preferences
          account_updates: emailNotifications,  // Using emailNotifications state for account_updates
          marketing_emails: marketingEmails,
          weekly_digest: weeklyDigest,
          
          // Push notification preferences  
          chat_messages: chatNotifications,  // Using chatNotifications state for chat_messages
          system_alerts: pushNotifications,  // Using pushNotifications state for system_alerts
          
          // Other preferences
          language: language,
          timezone: timezone,
          theme: theme,  // Save the current theme preference
          
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('user_preferences')
          .upsert(preferences, { onConflict: 'user_id' })

        if (error) {
          console.error('Error saving preferences:', error)
          setAlertState({
            show: true,
            type: 'error',
            message: 'Error saving preferences. Please try again.'
          })
        } else {
          setAlertState({
            show: true,
            type: 'success',
            message: 'Settings saved successfully!'
          })
        }

        // Hide alert after 3 seconds
        setTimeout(() => {
          setAlertState(prev => ({ ...prev, show: false }))
        }, 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setAlertState({
        show: true,
        type: 'error',
        message: 'An error occurred. Please try again.'
      })
      setTimeout(() => {
        setAlertState(prev => ({ ...prev, show: false }))
      }, 3000)
    } finally {
      setIsSaving(false)
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
          <h1 className="text-2xl font-semibold text-[#2C2C2C] dark:text-white">Settings</h1>
          <p className="text-base text-[#7A7A7A] dark:text-gray-400 mt-1">Customize your CmdShift experience</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-gray-800 border-0 shadow-none drop-shadow-none [&>*]:shadow-none [&>*]:drop-shadow-none [&>*]:border-0 [&>*]:outline-none">
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-[#3A4D6F] data-[state=active]:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 shadow-none drop-shadow-none border-0 ring-0 focus:ring-0 focus:shadow-none outline-none focus:outline-none data-[state=inactive]:shadow-none data-[state=inactive]:border-0"
              >
                <Palette className="size-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-[#3A4D6F] data-[state=active]:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 shadow-none drop-shadow-none border-0 ring-0 focus:ring-0 focus:shadow-none outline-none focus:outline-none data-[state=inactive]:shadow-none data-[state=inactive]:border-0"
              >
                <Bell className="size-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="data-[state=active]:bg-[#3A4D6F] data-[state=active]:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 shadow-none drop-shadow-none border-0 ring-0 focus:ring-0 focus:shadow-none outline-none focus:outline-none data-[state=inactive]:shadow-none data-[state=inactive]:border-0"
              >
                <Shield className="size-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value="region"
                className="data-[state=active]:bg-[#3A4D6F] data-[state=active]:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 shadow-none drop-shadow-none border-0 ring-0 focus:ring-0 focus:shadow-none outline-none focus:outline-none data-[state=inactive]:shadow-none data-[state=inactive]:border-0"
              >
                <Globe className="size-4 mr-2" />
                Region
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="data-[state=active]:bg-[#3A4D6F] data-[state=active]:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 shadow-none drop-shadow-none border-0 ring-0 focus:ring-0 focus:shadow-none outline-none focus:outline-none data-[state=inactive]:shadow-none data-[state=inactive]:border-0"
              >
                <Settings2 className="size-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6 mt-6">
              {/* Appearance Card */}
              <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                    <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      Theme & Display
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                    Customize how CmdShift looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all duration-200 ${
                          theme === "light"
                            ? "border-[#3A4D6F] bg-[#3A4D6F]/5 text-[#3A4D6F]"
                            : "border-[#EAE8E2] dark:border-gray-600 hover:border-[#3A4D6F]/30 text-[#7A7A7A] dark:text-gray-400"
                        }`}
                      >
                        <Sun className="size-4 mb-1.5" />
                        <span className="text-xs font-medium">Light</span>
                      </button>

                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all duration-200 ${
                          theme === "dark"
                            ? "border-[#3A4D6F] bg-[#3A4D6F]/5 text-[#3A4D6F]"
                            : "border-[#EAE8E2] dark:border-gray-600 hover:border-[#3A4D6F]/30 text-[#7A7A7A] dark:text-gray-400"
                        }`}
                      >
                        <Moon className="size-4 mb-1.5" />
                        <span className="text-xs font-medium">Dark</span>
                      </button>

                      <button
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all duration-200 ${
                          theme === "system"
                            ? "border-[#3A4D6F] bg-[#3A4D6F]/5 text-[#3A4D6F]"
                            : "border-[#EAE8E2] dark:border-gray-600 hover:border-[#3A4D6F]/30 text-[#7A7A7A] dark:text-gray-400"
                        }`}
                      >
                        <Monitor className="size-4 mb-1.5" />
                        <span className="text-xs font-medium">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-[#2C2C2C] dark:text-white">Compact Mode</Label>
                        <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Reduce spacing and padding for more content
                        </p>
                      </div>
                      <Switch
                        checked={compactMode}
                        onCheckedChange={setCompactMode}
                        className="data-[state=checked]:bg-[#3A4D6F]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              {/* Notifications Card */}
              <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                    <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      Notification Preferences
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                      <Label className="font-medium text-[#2C2C2C] dark:text-white">Email Notifications</Label>
                    </div>

                    <div className="space-y-4 ml-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Account Updates</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Important updates about your account
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Marketing Emails</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Product updates and promotional content
                          </p>
                        </div>
                        <Switch
                          checked={marketingEmails}
                          onCheckedChange={setMarketingEmails}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Weekly Digest</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">Summary of your weekly activity</p>
                        </div>
                        <Switch
                          checked={weeklyDigest}
                          onCheckedChange={setWeeklyDigest}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[#EAE8E2] dark:bg-gray-700" />

                  {/* Push Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                      <Label className="font-medium text-[#2C2C2C] dark:text-white">Push Notifications</Label>
                    </div>

                    <div className="space-y-4 ml-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Chat Messages</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            New messages in your conversations
                          </p>
                        </div>
                        <Switch
                          checked={chatNotifications}
                          onCheckedChange={setChatNotifications}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">System Alerts</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">Important system notifications</p>
                        </div>
                        <Switch
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[#EAE8E2] dark:bg-gray-700" />

                  {/* Notification Sound */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Notification Sound</Label>
                    <Select value={notificationSound} onValueChange={setNotificationSound}>
                      <SelectTrigger className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-600 shadow-none focus:shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm">
                        <SelectItem
                          className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                          value="default"
                        >
                          Default
                        </SelectItem>
                        <SelectItem
                          className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                          value="chime"
                        >
                          Chime
                        </SelectItem>
                        <SelectItem
                          className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                          value="bell"
                        >
                          Bell
                        </SelectItem>
                        <SelectItem
                          className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                          value="pop"
                        >
                          Pop
                        </SelectItem>
                        <SelectItem
                          className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                          value="none"
                        >
                          None
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 mt-6">
              {/* Privacy & Security Card */}
              <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                    <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      Privacy & Security
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                    Control your privacy settings and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Privacy Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                      <Label className="font-medium text-[#2C2C2C] dark:text-white">Privacy</Label>
                    </div>

                    <div className="space-y-4 ml-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Public Profile</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Make your profile visible to other users
                          </p>
                        </div>
                        <Switch
                          checked={profileVisibility}
                          onCheckedChange={setProfileVisibility}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Data Collection</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Allow anonymous usage data collection
                          </p>
                        </div>
                        <Switch
                          checked={dataCollection}
                          onCheckedChange={setDataCollection}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-[#EAE8E2] dark:bg-gray-700" />

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-[#3A4D6F] dark:text-gray-300" />
                      <Label className="font-medium text-[#2C2C2C] dark:text-white">Security</Label>
                    </div>

                    <div className="space-y-4 ml-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {twoFactorAuth && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Enabled
                            </Badge>
                          )}
                          <Switch
                            checked={twoFactorAuth}
                            onCheckedChange={setTwoFactorAuth}
                            className="data-[state=checked]:bg-[#3A4D6F]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Auto Session Timeout</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Automatically log out after inactivity
                          </p>
                        </div>
                        <Switch
                          checked={sessionTimeout}
                          onCheckedChange={setSessionTimeout}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium text-[#2C2C2C] dark:text-white">Login Alerts</Label>
                          <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                            Get notified of new login attempts
                          </p>
                        </div>
                        <Switch
                          checked={loginAlerts}
                          onCheckedChange={setLoginAlerts}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>
                    </div>
                  </div>

                  <Alert className="border-[#3A4D6F]/20 bg-[#3A4D6F]/5">
                    <Info className="h-4 w-4 text-[#3A4D6F] dark:text-gray-300" />
                    <AlertTitle className="text-[#3A4D6F]">Security Tip</AlertTitle>
                    <AlertDescription className="text-[#2C2C2C] dark:text-white">
                      Enable two-factor authentication for enhanced account security. This adds an extra layer of
                      protection to your account.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="region" className="space-y-6 mt-6">
              {/* Language & Region Card */}
              <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                    <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      Language & Region
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                    Set your language, timezone, and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Language */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-600 shadow-none focus:shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm">
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="en"
                          >
                            🇺🇸 English
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="es"
                          >
                            🇪🇸 Español
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="fr"
                          >
                            🇫🇷 Français
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="de"
                          >
                            🇩🇪 Deutsch
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="ja"
                          >
                            🇯🇵 日本語
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="zh"
                          >
                            🇨🇳 中文
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="pt"
                          >
                            🇧🇷 Português
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="ru"
                          >
                            🇷🇺 Русский
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-600 shadow-none focus:shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm">
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="utc"
                          >
                            UTC (GMT+0)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="est"
                          >
                            Eastern Time (GMT-5)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="cst"
                          >
                            Central Time (GMT-6)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="mst"
                          >
                            Mountain Time (GMT-7)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="pst"
                          >
                            Pacific Time (GMT-8)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="cet"
                          >
                            Central European Time (GMT+1)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="jst"
                          >
                            Japan Standard Time (GMT+9)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="aest"
                          >
                            Australian Eastern Time (GMT+10)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Date Format</Label>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-600 shadow-none focus:shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm">
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="mm/dd/yyyy"
                          >
                            MM/DD/YYYY (12/31/2024)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="dd/mm/yyyy"
                          >
                            DD/MM/YYYY (31/12/2024)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="yyyy-mm-dd"
                          >
                            YYYY-MM-DD (2024-12-31)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="dd-mmm-yyyy"
                          >
                            DD-MMM-YYYY (31-Dec-2024)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#2C2C2C] dark:text-white">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="border-[#EAE8E2] dark:border-gray-600 focus:border-[#3A4D6F] focus:ring-1 focus:ring-[#3A4D6F] bg-white dark:bg-gray-700 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-600 shadow-none focus:shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm">
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="usd"
                          >
                            USD ($)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="eur"
                          >
                            EUR (€)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="gbp"
                          >
                            GBP (£)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="jpy"
                          >
                            JPY (¥)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="cad"
                          >
                            CAD (C$)
                          </SelectItem>
                          <SelectItem
                            className="hover:bg-[#EAE8E2] dark:hover:bg-gray-700 focus:bg-[#EAE8E2] dark:focus:bg-gray-700 cursor-pointer"
                            value="aud"
                          >
                            AUD (A$)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              {/* Advanced Settings Card */}
              <Card className="bg-white dark:bg-gray-800 border-[#EAE8E2] dark:border-gray-700 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-5 text-[#3A4D6F] dark:text-gray-300" />
                    <CardTitle className="text-lg font-semibold text-[#2C2C2C] dark:text-white">
                      Advanced Settings
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#7A7A7A] dark:text-gray-400">
                    Advanced configuration options for power users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-[#2C2C2C] dark:text-white">Beta Features</Label>
                        <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Enable experimental features and early access
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {betaFeatures && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Beta
                          </Badge>
                        )}
                        <Switch
                          checked={betaFeatures}
                          onCheckedChange={setBetaFeatures}
                          className="data-[state=checked]:bg-[#3A4D6F]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-[#2C2C2C] dark:text-white">Analytics Opt-out</Label>
                        <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Disable all analytics and usage tracking
                        </p>
                      </div>
                      <Switch
                        checked={analyticsOptOut}
                        onCheckedChange={setAnalyticsOptOut}
                        className="data-[state=checked]:bg-[#3A4D6F]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-[#2C2C2C] dark:text-white">Auto-save</Label>
                        <p className="text-sm text-[#7A7A7A] dark:text-gray-400">
                          Automatically save your work as you type
                        </p>
                      </div>
                      <Switch
                        checked={autoSave}
                        onCheckedChange={setAutoSave}
                        className="data-[state=checked]:bg-[#3A4D6F]"
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#EAE8E2] dark:bg-gray-700" />

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-[#C84A4A]" />
                      <Label className="font-medium text-[#C84A4A]">Danger Zone</Label>
                    </div>

                    <Alert className="border-[#C84A4A]/20 bg-[#C84A4A]/5">
                      <AlertTriangle className="h-4 w-4 text-[#C84A4A]" />
                      <AlertTitle className="text-[#C84A4A]">Warning</AlertTitle>
                      <AlertDescription className="text-[#2C2C2C] dark:text-white">
                        These actions are permanent and cannot be undone. Please proceed with caution.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent shadow-none"
                      >
                        <Download className="size-4 mr-2" />
                        Export Account Data
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-[#C84A4A] text-[#C84A4A] hover:bg-[#C84A4A]/5 bg-transparent shadow-none"
                      >
                        <LogOut className="size-4 mr-2" />
                        Sign Out All Devices
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-[#C84A4A] text-[#C84A4A] hover:bg-[#C84A4A]/5 bg-transparent shadow-none"
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Changes */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="bg-[#3A4D6F] hover:bg-[#3A4D6F]/90 text-white"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              className="border-[#EAE8E2] dark:border-gray-600 text-[#2C2C2C] dark:text-white hover:bg-[#EAE8E2] dark:hover:bg-gray-700 bg-transparent shadow-none"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
