export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS'
}

export interface TierLimits {
  dailyMessages?: number;
  monthlyMessages?: number;
  isUnlimited: boolean;
  includesTeamFeatures: boolean;
  maxTeamMembers?: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  customModels: boolean;
}

export interface TierInfo {
  name: string;
  tier: SubscriptionTier;
  price: number;
  priceDisplay: string;
  description: string;
  limits: TierLimits;
  features: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    dailyMessages: 50,
    monthlyMessages: 1500, // 50 * 30
    isUnlimited: false,
    includesTeamFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    customModels: false
  },
  [SubscriptionTier.STARTER]: {
    monthlyMessages: 2000,
    isUnlimited: false,
    includesTeamFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    customModels: false
  },
  [SubscriptionTier.PRO]: {
    isUnlimited: true,
    includesTeamFeatures: false,
    apiAccess: true,
    prioritySupport: true,
    customModels: false
  },
  [SubscriptionTier.BUSINESS]: {
    isUnlimited: true,
    includesTeamFeatures: true,
    maxTeamMembers: 10,
    apiAccess: true,
    prioritySupport: true,
    customModels: true
  }
};

export const TIER_INFO: Record<SubscriptionTier, TierInfo> = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    tier: SubscriptionTier.FREE,
    price: 0,
    priceDisplay: 'Free',
    description: 'Get started with basic AI chat capabilities',
    limits: TIER_LIMITS[SubscriptionTier.FREE],
    features: [
      '50 messages per day',
      'Access to all AI models',
      'Basic chat history',
      'Usage analytics'
    ]
  },
  [SubscriptionTier.STARTER]: {
    name: 'Starter',
    tier: SubscriptionTier.STARTER,
    price: 9.99,
    priceDisplay: '$9.99/month',
    description: 'Perfect for individuals and light users',
    limits: TIER_LIMITS[SubscriptionTier.STARTER],
    features: [
      '2,000 messages per month',
      'Access to all AI models',
      'Full chat history',
      'Advanced usage analytics',
      'Export conversations'
    ]
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    tier: SubscriptionTier.PRO,
    price: 19.99,
    priceDisplay: '$19.99/month',
    description: 'Unlimited AI conversations for power users',
    limits: TIER_LIMITS[SubscriptionTier.PRO],
    features: [
      'Unlimited messages',
      'Access to all AI models',
      'Priority response times',
      'API access',
      'Priority support',
      'Custom prompts library'
    ]
  },
  [SubscriptionTier.BUSINESS]: {
    name: 'Business',
    tier: SubscriptionTier.BUSINESS,
    price: 49.99,
    priceDisplay: '$49.99/month',
    description: 'Advanced features for teams and businesses',
    limits: TIER_LIMITS[SubscriptionTier.BUSINESS],
    features: [
      'Everything in Pro',
      'Team collaboration (up to 10 members)',
      'Custom AI models',
      'SSO integration',
      'Dedicated support',
      'Usage analytics dashboard',
      'Compliance features'
    ]
  }
};

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  subscription: UserSubscription;
  createdAt: Date;
  updatedAt: Date;
  messagesUsedToday: number;
  messagesUsedThisMonth: number;
  lastMessageAt?: Date;
  teamId?: string;
  role?: 'owner' | 'admin' | 'member';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  subscription: UserSubscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

// Helper functions
export function canSendMessage(profile: UserProfile): boolean {
  const limits = TIER_LIMITS[profile.subscription.tier];
  
  if (limits.isUnlimited) {
    return true;
  }
  
  if (limits.dailyMessages && profile.messagesUsedToday >= limits.dailyMessages) {
    return false;
  }
  
  if (limits.monthlyMessages && profile.messagesUsedThisMonth >= limits.monthlyMessages) {
    return false;
  }
  
  return true;
}

export function getRemainingMessages(profile: UserProfile): {
  daily?: number;
  monthly?: number;
  isUnlimited: boolean;
} {
  const limits = TIER_LIMITS[profile.subscription.tier];
  
  if (limits.isUnlimited) {
    return { isUnlimited: true };
  }
  
  return {
    daily: limits.dailyMessages ? limits.dailyMessages - profile.messagesUsedToday : undefined,
    monthly: limits.monthlyMessages ? limits.monthlyMessages - profile.messagesUsedThisMonth : undefined,
    isUnlimited: false
  };
}

export function getUpgradeRecommendation(profile: UserProfile): SubscriptionTier | null {
  const currentTier = profile.subscription.tier;
  const limits = TIER_LIMITS[currentTier];
  
  // If user is hitting limits, recommend upgrade
  if (!limits.isUnlimited) {
    const dailyUsageRate = limits.dailyMessages ? profile.messagesUsedToday / limits.dailyMessages : 0;
    const monthlyUsageRate = limits.monthlyMessages ? profile.messagesUsedThisMonth / limits.monthlyMessages : 0;
    
    if (dailyUsageRate > 0.8 || monthlyUsageRate > 0.8) {
      switch (currentTier) {
        case SubscriptionTier.FREE:
          return SubscriptionTier.STARTER;
        case SubscriptionTier.STARTER:
          return SubscriptionTier.PRO;
        default:
          return null;
      }
    }
  }
  
  return null;
}