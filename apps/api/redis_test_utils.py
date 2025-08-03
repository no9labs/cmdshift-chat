#!/usr/bin/env python3
"""
Redis utility functions for testing subscription limits.
"""

import redis
import asyncio
from datetime import datetime
import sys

# Redis connection
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def show_user_usage(user_id):
    """Display all usage data for a user"""
    print(f"\n📊 Usage data for user: {user_id}")
    print("=" * 50)
    
    # Get today's date
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Daily token usage
    daily_key = f"usage:{user_id}:{today}"
    daily_data = r.hgetall(daily_key)
    if daily_data:
        print(f"\n📅 Today's usage ({today}):")
        for key, value in daily_data.items():
            print(f"  {key}: {value}")
    else:
        print(f"\n📅 No usage data for today ({today})")
    
    # Daily message count
    messages_key = f"usage:{user_id}:{today}:messages"
    messages = r.get(messages_key)
    print(f"\n💬 Messages today: {messages or 0}")
    
    # Monthly message count
    monthly_key = f"usage:{user_id}:monthly"
    monthly = r.get(monthly_key)
    print(f"📆 Messages this month: {monthly or 0}")
    
    # Show all keys for this user
    print(f"\n🔑 All Redis keys for {user_id}:")
    pattern = f"usage:{user_id}:*"
    keys = r.keys(pattern)
    for key in sorted(keys):
        print(f"  - {key}")

def set_user_messages(user_id, daily_count, monthly_count):
    """Set message counts for testing"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Set daily messages
    daily_key = f"usage:{user_id}:{today}:messages"
    if daily_count > 0:
        r.set(daily_key, daily_count)
        r.expire(daily_key, 86400)  # 24 hours
        print(f"✅ Set daily messages to {daily_count}")
    
    # Set monthly messages
    monthly_key = f"usage:{user_id}:monthly"
    if monthly_count > 0:
        r.set(monthly_key, monthly_count)
        r.expire(monthly_key, 2592000)  # 30 days
        print(f"✅ Set monthly messages to {monthly_count}")

def reset_user_usage(user_id):
    """Reset all usage data for a user"""
    pattern = f"usage:{user_id}:*"
    keys = r.keys(pattern)
    
    if keys:
        r.delete(*keys)
        print(f"🗑️  Deleted {len(keys)} keys for user {user_id}")
    else:
        print(f"ℹ️  No usage data found for user {user_id}")

def simulate_near_limit(user_id, tier="FREE"):
    """Set usage near the limit for testing"""
    if tier == "FREE":
        # Set to 45 messages (5 remaining)
        set_user_messages(user_id, 45, 45)
        print(f"📊 Set {user_id} to 45/50 daily messages (5 remaining)")
    elif tier == "STARTER":
        # Set to 1995 monthly messages (5 remaining)
        set_user_messages(user_id, 10, 1995)
        print(f"📊 Set {user_id} to 1995/2000 monthly messages (5 remaining)")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python redis_test_utils.py show USER_ID")
        print("  python redis_test_utils.py reset USER_ID")
        print("  python redis_test_utils.py set USER_ID DAILY MONTHLY")
        print("  python redis_test_utils.py near_limit USER_ID [FREE|STARTER]")
        return
    
    command = sys.argv[1]
    
    if command == "show" and len(sys.argv) >= 3:
        show_user_usage(sys.argv[2])
    
    elif command == "reset" and len(sys.argv) >= 3:
        reset_user_usage(sys.argv[2])
    
    elif command == "set" and len(sys.argv) >= 5:
        user_id = sys.argv[2]
        daily = int(sys.argv[3])
        monthly = int(sys.argv[4])
        set_user_messages(user_id, daily, monthly)
        show_user_usage(user_id)
    
    elif command == "near_limit" and len(sys.argv) >= 3:
        user_id = sys.argv[2]
        tier = sys.argv[3] if len(sys.argv) >= 4 else "FREE"
        simulate_near_limit(user_id, tier)
        show_user_usage(user_id)
    
    else:
        print("❌ Invalid command or arguments")

if __name__ == "__main__":
    main()