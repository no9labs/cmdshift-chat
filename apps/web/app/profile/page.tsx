'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TIER_INFO, SubscriptionTier } from '@/lib/types/subscription';
import { Loader2, CheckCircle, XCircle, CreditCard, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

async function getUserProfile(userId: string, userEmail: string) {
  const supabase = createClient();
  
  try {
    // Try to fetch the user profile from Supabase
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      // If profile doesn't exist, return default
      console.log('Profile not found, returning default');
      const defaultProfile = {
        id: userId,
        email: userEmail,
        full_name: null,
        avatar_url: null,
        subscription_tier: 'FREE',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        messages_used_today: 0,
        messages_used_this_month: 0,
        last_message_at: null,
        team_id: null,
        role: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return defaultProfile;
    }
    
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return default profile on error
    const defaultProfile = {
      id: userId,
      email: userEmail,
      full_name: null,
      avatar_url: null,
      subscription_tier: 'FREE',
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      subscription_ends_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      messages_used_today: 0,
      messages_used_this_month: 0,
      last_message_at: null,
      team_id: null,
      role: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return defaultProfile;
  }
}

async function getUsageStats(userId: string) {
  try {
    const response = await fetch(`http://localhost:8001/api/v1/usage?user_id=${userId}`, {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Usage API error:', response.status, errorText);
      throw new Error(`Failed to fetch usage stats: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Usage stats fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error('API server appears to be down. Please ensure the API is running on port 8001.');
    }
    return null;
  }
}

function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  const tierInfo = TIER_INFO[tier];
  const badgeColors = {
    [SubscriptionTier.FREE]: 'bg-gray-100 text-gray-800',
    [SubscriptionTier.STARTER]: 'bg-blue-100 text-blue-800',
    [SubscriptionTier.PRO]: 'bg-purple-100 text-purple-800',
    [SubscriptionTier.BUSINESS]: 'bg-amber-100 text-amber-800',
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColors[tier]}`}>
      {tierInfo.name}
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<'success' | 'cancelled' | null>(null);
  
  useEffect(() => {
    // Check for upgrade status in URL parameters
    const upgrade = searchParams.get('upgrade');
    if (upgrade === 'success') {
      setUpgradeStatus('success');
      // Clean URL after showing message
      setTimeout(() => {
        router.replace('/profile');
      }, 5000);
    } else if (upgrade === 'cancelled') {
      setUpgradeStatus('cancelled');
      // Clean URL after showing message
      setTimeout(() => {
        router.replace('/profile');
      }, 5000);
    }
    
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      
      const [profileData, statsData] = await Promise.all([
        getUserProfile(user.id, user.email || ''),
        getUsageStats(user.id),
      ]);
      
      setProfile(profileData);
      setUsageStats(statsData);
      setLoading(false);
    };
    
    fetchData();
  }, [router, searchParams]);
  
  const handleUpgrade = async (tier: 'starter' | 'pro') => {
    setIsUpgrading(true);
    try {
      const response = await fetch('http://localhost:8001/api/v1/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          user_id: user.id,
          user_email: user.email!
        })
      });
      
      if (!response.ok) throw new Error('Failed to create checkout session');
      
      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };
  
  if (loading || !user || !profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  const tier = (profile?.subscription_tier || 'FREE') as SubscriptionTier;
  const tierInfo = TIER_INFO[tier];
  const limits = tierInfo.limits;
  
  // Calculate remaining messages
  let remainingDaily = null;
  let remainingMonthly = null;
  let messagesUsedToday = 0;
  let messagesUsedThisMonth = 0;
  
  // If we have usage stats from API, use those for accurate counts
  if (usageStats) {
    // Get today's usage from daily stats
    if (usageStats.daily && usageStats.daily.length > 0) {
      // Use local date to match backend
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log('DEBUG: Frontend looking for date:', todayStr);
      const todayUsage = usageStats.daily.find((d: any) => d.date === todayStr);
      if (todayUsage) {
        // Use actual message count if available, otherwise estimate from tokens
        messagesUsedToday = todayUsage.messages || Math.ceil((todayUsage.total_tokens || 0) / 500);
      }
    }
    
    // Use total messages from API if available
    if (usageStats.total_messages !== undefined) {
      messagesUsedThisMonth = usageStats.total_messages;
    } else if (usageStats.monthly_total && usageStats.monthly_total.total_messages !== undefined) {
      messagesUsedThisMonth = usageStats.monthly_total.total_messages;
    }
  }
  
  if (!limits.isUnlimited) {
    if (limits.dailyMessages) {
      remainingDaily = Math.max(0, limits.dailyMessages - messagesUsedToday);
    }
    if (limits.monthlyMessages) {
      remainingMonthly = Math.max(0, limits.monthlyMessages - messagesUsedThisMonth);
    }
  }
  
  const showUpgradeButton = tier === SubscriptionTier.FREE || tier === SubscriptionTier.STARTER;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      {/* Success/Cancel Notifications - keep existing */}
      {upgradeStatus === 'success' && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Subscription upgraded successfully! You now have access to all features.
            </p>
          </CardContent>
        </Card>
      )}
      
      {upgradeStatus === 'cancelled' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-2 pt-6">
            <XCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Subscription upgrade cancelled. You can upgrade anytime.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and subscription status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Subscription
              <Badge variant={profile.subscription_tier === 'PRO' ? 'default' : profile.subscription_tier === 'STARTER' ? 'secondary' : 'outline'}>
                {profile.subscription_tier}
              </Badge>
            </CardTitle>
            <CardDescription>
              {profile.subscription_tier === 'PRO' ? 'Unlimited conversations' :
               profile.subscription_tier === 'STARTER' ? '2,000 messages per month' :
               '50 messages per day'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Monthly cost</span>
                </div>
                <span className="font-medium">
                  {profile.subscription_tier === 'PRO' ? '$19.99' :
                   profile.subscription_tier === 'STARTER' ? '$9.99' :
                   '$0.00'}
                </span>
              </div>
              
              {profile.subscription_tier !== 'PRO' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upgrade to unlock more</p>
                    <div className="flex gap-2">
                      {profile.subscription_tier === 'FREE' && (
                        <>
                          <Button 
                            onClick={() => handleUpgrade('starter')} 
                            variant="outline" 
                            disabled={isUpgrading}
                          >
                            {isUpgrading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Upgrade to Starter'
                            )}
                          </Button>
                          <Button 
                            onClick={() => handleUpgrade('pro')} 
                            disabled={isUpgrading}
                          >
                            {isUpgrading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Upgrade to Pro'
                            )}
                          </Button>
                        </>
                      )}
                      {profile.subscription_tier === 'STARTER' && (
                        <Button 
                          onClick={() => handleUpgrade('pro')} 
                          disabled={isUpgrading}
                        >
                          {isUpgrading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Upgrade to Pro'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {profile.subscription_tier !== 'FREE' && (
                <>
                  <Separator />
                  <Button variant="outline" className="w-full" disabled>
                    Manage Subscription
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>Your usage for the current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Messages today</span>
                <span className="font-medium">{messagesUsedToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Messages this month</span>
                <span className="font-medium">{messagesUsedThisMonth}</span>
              </div>
              
              {profile.subscription_tier !== 'PRO' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Daily limit</span>
                      <span className="font-medium">
                        {messagesUsedToday} / {profile.subscription_tier === 'FREE' ? '50' : '∞'}
                      </span>
                    </div>
                    {profile.subscription_tier === 'STARTER' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Monthly limit</span>
                        <span className="font-medium">{messagesUsedThisMonth} / 2,000</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}