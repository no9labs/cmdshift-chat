from typing import Tuple, Optional, Dict
from datetime import datetime
import redis.asyncio as redis
from enum import Enum
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class SubscriptionTier(Enum):
    FREE = "FREE"
    STARTER = "STARTER"
    PRO = "PRO"
    BUSINESS = "BUSINESS"

# Tier limits configuration
TIER_LIMITS = {
    SubscriptionTier.FREE: {
        "daily": 50,
        "monthly": 1500,  # 50 * 30
        "unlimited": False
    },
    SubscriptionTier.STARTER: {
        "daily": None,  # No daily limit
        "monthly": 2000,
        "unlimited": False
    },
    SubscriptionTier.PRO: {
        "daily": None,
        "monthly": None,
        "unlimited": True
    },
    SubscriptionTier.BUSINESS: {
        "daily": None,
        "monthly": None,
        "unlimited": True
    }
}

class SubscriptionService:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        # Initialize Supabase client
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        
    async def get_user_tier(self, user_id: str) -> SubscriptionTier:
        """
        Get user's subscription tier from Supabase database.
        """
        # Return FREE tier for anonymous users
        if not user_id or user_id == "anonymous":
            return SubscriptionTier.FREE
        
        # Special handling for test users
        if user_id.endswith("_starter"):
            return SubscriptionTier.STARTER
        elif user_id.endswith("_pro"):
            return SubscriptionTier.PRO
        elif user_id.startswith("test_"):
            return SubscriptionTier.FREE
        
        try:
            # Query user_profiles table for subscription tier
            response = self.supabase.table("user_profiles").select("subscription_tier").eq("id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                tier_value = response.data[0].get("subscription_tier", "FREE")
                # Convert string to enum, defaulting to FREE if invalid
                try:
                    return SubscriptionTier(tier_value)
                except ValueError:
                    logger.warning(f"Invalid subscription tier '{tier_value}' for user {user_id}, defaulting to FREE")
                    return SubscriptionTier.FREE
            else:
                # User not found in profiles table, return FREE tier
                logger.info(f"User {user_id} not found in user_profiles, defaulting to FREE tier")
                return SubscriptionTier.FREE
                
        except Exception as e:
            logger.error(f"Error fetching user tier from Supabase: {e}")
            # In case of any error, default to FREE tier to avoid blocking users
            return SubscriptionTier.FREE
    
    async def get_usage_count(self, user_id: str) -> Dict[str, int]:
        """Get current usage counts for a user"""
        # Use local timezone for user-friendly daily resets
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get daily message count from dedicated counter
        daily_messages_key = f"usage:{user_id}:{today}:messages"
        daily_messages = await self.redis_client.get(daily_messages_key)
        daily_messages = int(daily_messages) if daily_messages else 0
        
        # If no message counter exists, estimate from token usage
        if daily_messages == 0:
            daily_key = f"usage:{user_id}:{today}"
            daily_data = await self.redis_client.hgetall(daily_key)
            
            if daily_data:
                # Count messages as number of entries (simplified - could track actual message count)
                input_tokens = int(daily_data.get("input_tokens", 0))
                output_tokens = int(daily_data.get("output_tokens", 0))
                # Rough estimate: 1 message ≈ 500 tokens average
                daily_messages = (input_tokens + output_tokens) // 500
        
        # Get monthly usage
        monthly_key = f"usage:{user_id}:monthly"
        monthly_messages = await self.redis_client.get(monthly_key)
        monthly_messages = int(monthly_messages) if monthly_messages else 0
        
        return {
            "daily": daily_messages,
            "monthly": monthly_messages
        }
    
    async def increment_usage(self, user_id: str) -> None:
        """Increment usage counters for a user"""
        # Use local timezone for user-friendly daily resets
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Increment daily counter (stored with daily usage data)
        daily_key = f"usage:{user_id}:{today}:messages"
        await self.redis_client.incr(daily_key)
        await self.redis_client.expire(daily_key, 86400)  # Expire after 24 hours
        
        # Increment monthly counter
        monthly_key = f"usage:{user_id}:monthly"
        await self.redis_client.incr(monthly_key)
        await self.redis_client.expire(monthly_key, 2592000)  # Expire after 30 days
    
    async def check_usage_limit(self, user_id: str, tier: Optional[SubscriptionTier] = None) -> Tuple[bool, int, Optional[int]]:
        """
        Check if user has exceeded their usage limit.
        
        Returns:
            Tuple of (allowed: bool, remaining: int, limit: Optional[int])
            - allowed: Whether user can send more messages
            - remaining: Number of messages remaining (or -1 if unlimited)
            - limit: The applicable limit (daily or monthly, or None if unlimited)
        """
        # Get user tier if not provided
        if tier is None:
            tier = await self.get_user_tier(user_id)
        
        # Get tier limits
        limits = TIER_LIMITS[tier]
        
        # If unlimited tier, always allow
        if limits["unlimited"]:
            return (True, -1, None)
        
        # Get current usage
        usage = await self.get_usage_count(user_id)
        
        # Check daily limit first (if applicable)
        if limits["daily"] is not None:
            daily_limit = limits["daily"]
            daily_used = usage["daily"]
            daily_remaining = max(0, daily_limit - daily_used)
            
            if daily_used >= daily_limit:
                return (False, 0, daily_limit)
            
            # If daily limit is OK, check monthly
            if limits["monthly"] is not None:
                monthly_limit = limits["monthly"]
                monthly_used = usage["monthly"]
                monthly_remaining = max(0, monthly_limit - monthly_used)
                
                if monthly_used >= monthly_limit:
                    return (False, 0, monthly_limit)
                
                # Return the most restrictive remaining count
                return (True, min(daily_remaining, monthly_remaining), daily_limit)
            else:
                return (True, daily_remaining, daily_limit)
        
        # Check monthly limit only
        elif limits["monthly"] is not None:
            monthly_limit = limits["monthly"]
            monthly_used = usage["monthly"]
            monthly_remaining = max(0, monthly_limit - monthly_used)
            
            if monthly_used >= monthly_limit:
                return (False, 0, monthly_limit)
            
            return (True, monthly_remaining, monthly_limit)
        
        # No limits defined (shouldn't happen)
        return (True, -1, None)
    
    async def get_usage_summary(self, user_id: str) -> Dict:
        """Get detailed usage summary for a user"""
        tier = await self.get_user_tier(user_id)
        usage = await self.get_usage_count(user_id)
        limits = TIER_LIMITS[tier]
        
        summary = {
            "tier": tier.value,
            "usage": usage,
            "limits": {
                "daily": limits["daily"],
                "monthly": limits["monthly"],
                "unlimited": limits["unlimited"]
            },
            "remaining": {}
        }
        
        # Calculate remaining
        if not limits["unlimited"]:
            if limits["daily"] is not None:
                summary["remaining"]["daily"] = max(0, limits["daily"] - usage["daily"])
            if limits["monthly"] is not None:
                summary["remaining"]["monthly"] = max(0, limits["monthly"] - usage["monthly"])
        else:
            summary["remaining"]["unlimited"] = True
        
        return summary
    
    async def reset_daily_usage(self) -> int:
        """Reset daily usage counters for all users (for cron job)"""
        pattern = "usage:*:*:messages"
        count = 0
        
        async for key in self.redis_client.scan_iter(match=pattern):
            await self.redis_client.delete(key)
            count += 1
        
        logger.info(f"Reset daily usage for {count} users")
        return count
    
    async def reset_monthly_usage(self) -> int:
        """Reset monthly usage counters for all users (for cron job)"""
        pattern = "usage:*:monthly"
        count = 0
        
        async for key in self.redis_client.scan_iter(match=pattern):
            await self.redis_client.delete(key)
            count += 1
        
        logger.info(f"Reset monthly usage for {count} users")
        return count