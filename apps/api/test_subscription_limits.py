#!/usr/bin/env python3
"""
Test script to verify subscription limits are working correctly.
Run this after starting the API server with: python test_subscription_limits.py
"""

import asyncio
import aiohttp
import json
from datetime import datetime

# Test configuration
API_BASE_URL = "http://localhost:8001/api/v1"
TEST_USERS = {
    "free_user": "test_free_user_123",
    "starter_user": "test_user_starter",  # ends with _starter
    "pro_user": "test_user_pro",  # ends with _pro
}

async def test_chat_endpoint(session, user_id, message_num):
    """Send a test message to the chat endpoint"""
    url = f"{API_BASE_URL}/completions"
    payload = {
        "messages": [
            {"role": "user", "content": f"Test message {message_num} at {datetime.now()}"}
        ],
        "model": "deepseek-chat",
        "stream": False,
        "user_id": user_id
    }
    
    try:
        async with session.post(url, json=payload) as response:
            data = await response.json()
            return {
                "status": response.status,
                "headers": dict(response.headers),
                "data": data
            }
    except Exception as e:
        return {"error": str(e)}

async def get_usage_stats(session, user_id):
    """Get usage statistics for a user"""
    url = f"{API_BASE_URL}/usage?user_id={user_id}"
    
    try:
        async with session.get(url) as response:
            data = await response.json()
            return {"status": response.status, "data": data}
    except Exception as e:
        return {"error": str(e)}

async def test_429_response_format(session):
    """Test the exact format of 429 error responses"""
    print("\n📋 Test 4: 429 Error Response Format")
    print("-" * 30)
    
    # Create a user that's already at limit
    limited_user = "test_free_at_limit"
    
    # First, use up all messages (simulate by using a special test user)
    print("Testing 429 response format...")
    
    # Try to send a message when at limit
    result = await test_chat_endpoint(session, limited_user, 51)
    
    if result['status'] == 429:
        print(f"✅ Got expected 429 status code")
        print(f"Response data: {json.dumps(result['data'], indent=2)}")
        
        # Verify response format
        expected_fields = ['detail']
        for field in expected_fields:
            if field in result['data']:
                print(f"✅ Found expected field '{field}': {result['data'][field]}")
            else:
                print(f"❌ Missing expected field '{field}'")
                
        # Check headers
        important_headers = ['x-messages-remaining', 'retry-after']
        print("\nHeaders:")
        for header in important_headers:
            value = result['headers'].get(header, 'Not present')
            print(f"  {header}: {value}")
    else:
        print(f"❌ Expected 429 but got {result['status']}")

async def test_subscription_limits():
    """Test subscription limits for different user tiers"""
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Subscription Limits System")
        print("=" * 50)
        
        # Test 1: FREE tier user (50 messages/day limit)
        print("\n📋 Test 1: FREE Tier User (50 messages/day limit)")
        free_user = TEST_USERS["free_user"]
        
        # Get initial usage
        usage = await get_usage_stats(session, free_user)
        if usage.get("status") == 200:
            total_messages = usage["data"].get("total_messages", 0)
            print(f"Initial messages for {free_user}: {total_messages}")
        
        # Calculate how many messages to send to reach the limit
        messages_to_send = 52 - total_messages  # Try to exceed limit by 2
        if messages_to_send <= 0:
            print(f"⚠️  User already has {total_messages} messages. Skipping to avoid confusion.")
        else:
            print(f"Sending {messages_to_send} test messages to exceed 50 message limit...")
            hit_limit = False
            successful_messages = 0
            
            for i in range(messages_to_send):
                result = await test_chat_endpoint(session, free_user, i+1)
                if result['status'] == 200:
                    successful_messages += 1
                    remaining = result['headers'].get('x-messages-remaining', 'N/A')
                    # Only print every 10th message to avoid clutter
                    if (i+1) % 10 == 0 or remaining == "1":
                        print(f"  Message {i+1}: Status={result['status']}, Remaining: {remaining}")
                elif result['status'] == 429:
                    print(f"  Message {i+1}: Status={result['status']}")
                    print(f"    ❌ Rate limited after {successful_messages} messages")
                    print(f"    Error: {result['data'].get('detail', 'Unknown error')}")
                    hit_limit = True
                    break
                else:
                    print(f"  Message {i+1}: Unexpected status {result['status']}")
                    print(f"    Error: {result['data']}")
                    break
                
                # Small delay between requests
                if i < 10:
                    await asyncio.sleep(0.5)
                else:
                    await asyncio.sleep(0.1)  # Faster after first 10
            
            if not hit_limit and successful_messages >= 50:
                print(f"  ⚠️  WARNING: Sent {successful_messages} messages without hitting limit!")
            elif hit_limit:
                print(f"  ✅ Correctly hit rate limit after {successful_messages} messages")
        
        # Check updated usage
        usage = await get_usage_stats(session, free_user)
        if usage.get("status") == 200:
            new_total = usage["data"].get("total_messages", 0)
            messages_sent = new_total - total_messages
            print(f"\nFinal messages for {free_user}: {new_total}")
            print(f"Messages sent in this test: {messages_sent}")
            
            # Verify limit enforcement
            if messages_sent == 50 - total_messages:
                print(f"✅ Limit correctly enforced at 50 messages/day")
            else:
                print(f"⚠️  Expected to send {50 - total_messages} messages but sent {messages_sent}")
        
        # Test 2: STARTER tier user (2000 messages/month, no daily limit)
        print("\n📋 Test 2: STARTER Tier User (2000 messages/month)")
        starter_user = TEST_USERS["starter_user"]
        
        usage = await get_usage_stats(session, starter_user)
        if usage.get("status") == 200:
            total_messages = usage["data"].get("total_messages", 0)
            monthly_total = usage["data"].get("monthly_total", {}).get("total_messages", 0)
            print(f"Initial monthly messages for {starter_user}: {monthly_total}")
        
        # Send test messages
        print("Sending 3 test messages...")
        for i in range(3):
            result = await test_chat_endpoint(session, starter_user, i+1)
            print(f"  Message {i+1}: Status={result['status']}")
            if result['status'] == 200:
                remaining = result['headers'].get('x-messages-remaining', 'N/A')
                print(f"    Messages remaining: {remaining}")
            await asyncio.sleep(1)
        
        # Test 3: PRO tier user (unlimited messages)
        print("\n📋 Test 3: PRO Tier User (unlimited messages)")
        pro_user = TEST_USERS["pro_user"]
        
        print("Sending 5 test messages...")
        for i in range(5):
            result = await test_chat_endpoint(session, pro_user, i+1)
            print(f"  Message {i+1}: Status={result['status']}")
            if result['status'] == 200:
                remaining = result['headers'].get('x-messages-remaining', 'N/A')
                print(f"    Messages remaining: {remaining} (should be -1 for unlimited)")
            await asyncio.sleep(1)
        
        # Test 4: 429 Error Response Format
        await test_429_response_format(session)
        
        print("\n✅ Subscription limit tests completed!")
        print("\nSummary:")
        print("- FREE tier: Should enforce 50 messages/day limit")
        print("- STARTER tier: Should enforce 2000 messages/month limit") 
        print("- PRO tier: Should have unlimited messages (-1 remaining)")
        print("- 429 errors: Should return proper error format with detail message")

if __name__ == "__main__":
    asyncio.run(test_subscription_limits())