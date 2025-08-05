'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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
    [SubscriptionTier.FREE]: { bg: '#f3f4f6', text: '#374151' },
    [SubscriptionTier.STARTER]: { bg: '#dbeafe', text: '#1e40af' },
    [SubscriptionTier.PRO]: { bg: '#e9d5ff', text: '#6b21a8' },
    [SubscriptionTier.BUSINESS]: { bg: '#fef3c7', text: '#92400e' },
  };
  
  const colors = badgeColors[tier];
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: '500',
      backgroundColor: colors.bg,
      color: colors.text
    }}>
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    );
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
  
  const containerStyle = {
    maxWidth: '896px',
    margin: '0 auto',
    padding: '32px 16px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
  };

  const cardHeaderStyle = {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb'
  };

  const cardContentStyle = {
    padding: '24px'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const descriptionStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonOutlineStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  const separatorStyle = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '20px 0'
  };

  const successAlertStyle = {
    backgroundColor: '#d1fae5',
    border: '1px solid #6ee7b7',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    color: '#064e3b'
  };

  const warningAlertStyle = {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    color: '#78350f'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px' }}>Profile</h1>
      
      {/* Success/Cancel Notifications */}
      {upgradeStatus === 'success' && (
        <div style={successAlertStyle}>
          <CheckCircle size={20} />
          <p style={{ margin: 0, fontSize: '14px' }}>
            Subscription upgraded successfully! You now have access to all features.
          </p>
        </div>
      )}
      
      {upgradeStatus === 'cancelled' && (
        <div style={warningAlertStyle}>
          <XCircle size={20} />
          <p style={{ margin: 0, fontSize: '14px' }}>
            Subscription upgrade cancelled. You can upgrade anytime.
          </p>
        </div>
      )}

      {/* Account Information */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={titleStyle}>Account Information</h2>
          <p style={descriptionStyle}>Your account details and subscription status</p>
        </div>
        <div style={cardContentStyle}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</p>
            <p style={{ fontWeight: '500', margin: 0 }}>{user?.email}</p>
          </div>
          <div style={separatorStyle} />
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>User ID</p>
            <p style={{ fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={titleStyle}>
            Subscription
            <SubscriptionBadge tier={tier} />
          </h2>
          <p style={descriptionStyle}>
            {profile.subscription_tier === 'PRO' ? 'Unlimited conversations' :
             profile.subscription_tier === 'STARTER' ? '2,000 messages per month' :
             '50 messages per day'}
          </p>
        </div>
        <div style={cardContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} color="#6b7280" />
              <span style={{ fontSize: '14px' }}>Monthly cost</span>
            </div>
            <span style={{ fontWeight: '500' }}>
              {profile.subscription_tier === 'PRO' ? '$19.99' :
               profile.subscription_tier === 'STARTER' ? '$9.99' :
               '$0.00'}
            </span>
          </div>
          
          {profile.subscription_tier !== 'PRO' && (
            <>
              <div style={separatorStyle} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Upgrade to unlock more</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {profile.subscription_tier === 'FREE' && (
                    <>
                      <button 
                        onClick={() => handleUpgrade('starter')} 
                        style={buttonOutlineStyle}
                        disabled={isUpgrading}
                      >
                        {isUpgrading && <Loader2 size={16} className="animate-spin" />}
                        {isUpgrading ? 'Loading...' : 'Upgrade to Starter'}
                      </button>
                      <button 
                        onClick={() => handleUpgrade('pro')} 
                        style={buttonStyle}
                        disabled={isUpgrading}
                      >
                        {isUpgrading && <Loader2 size={16} className="animate-spin" />}
                        {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
                      </button>
                    </>
                  )}
                  {profile.subscription_tier === 'STARTER' && (
                    <button 
                      onClick={() => handleUpgrade('pro')} 
                      style={buttonStyle}
                      disabled={isUpgrading}
                    >
                      {isUpgrading && <Loader2 size={16} className="animate-spin" />}
                      {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          
          {profile.subscription_tier !== 'FREE' && (
            <>
              <div style={separatorStyle} />
              <button style={{ ...buttonOutlineStyle, width: '100%', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                Manage Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={{ ...titleStyle, gap: '8px' }}>
            <TrendingUp size={20} />
            Usage Statistics
          </h2>
          <p style={descriptionStyle}>Your usage for the current period</p>
        </div>
        <div style={cardContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Messages today</span>
            <span style={{ fontWeight: '500' }}>{messagesUsedToday}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Messages this month</span>
            <span style={{ fontWeight: '500' }}>{messagesUsedThisMonth}</span>
          </div>
          
          {profile.subscription_tier !== 'PRO' && (
            <>
              <div style={separatorStyle} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span>Daily limit</span>
                  <span style={{ fontWeight: '500' }}>
                    {messagesUsedToday} / {profile.subscription_tier === 'FREE' ? '50' : '∞'}
                  </span>
                </div>
                {profile.subscription_tier === 'STARTER' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>Monthly limit</span>
                    <span style={{ fontWeight: '500' }}>{messagesUsedThisMonth} / 2,000</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}