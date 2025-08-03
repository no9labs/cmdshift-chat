# Testing Subscription Limits

This guide helps you verify that subscription limits are working correctly in CmdShift Chat.

## Prerequisites

1. Start the Redis server:
   ```bash
   redis-server
   ```

2. Start the API server:
   ```bash
   cd apps/api
   pnpm dev
   ```

3. Start the web server:
   ```bash
   cd apps/web
   pnpm dev
   ```

## Test Scenarios

### 1. Test FREE Tier Limits (50 messages/day)

1. **Login** with a test user account
2. **Navigate** to `/profile` to see your current tier (should show FREE)
3. **Check usage**: Note the "Messages Today" count
4. **Send messages** in the chat interface
5. **Observe**:
   - The header should show "X messages remaining today"
   - The count should decrease with each message
   - The number should turn orange when ≤10 messages remain
6. **Hit the limit**: After 50 messages, you should see:
   - Input field disabled
   - Placeholder text: "Daily message limit reached. Upgrade to continue."
   - Orange upgrade prompt banner
   - 429 error response

### 2. Test STARTER Tier Limits (2000 messages/month)

To test STARTER tier, you can:
1. Create a user with ID ending in `_starter` (e.g., `user123_starter`)
2. Or modify the subscription service to return STARTER for your test user

**Expected behavior**:
- No daily limit message counter
- Messages count towards monthly total
- After 2000 messages in a month, same limiting behavior as FREE tier

### 3. Test PRO Tier (Unlimited)

To test PRO tier:
1. Create a user with ID ending in `_pro` (e.g., `user123_pro`)

**Expected behavior**:
- No usage counter shown in header
- No limits enforced
- `X-Messages-Remaining` header should be `-1`

## Automated Testing

Run the automated test script:

```bash
cd apps/api
python test_subscription_limits.py
```

This script will:
- Test FREE tier with rate limiting
- Test STARTER tier with monthly limits
- Test PRO tier with unlimited access
- Verify proper headers and responses

## Verification Checklist

- [ ] FREE tier shows daily message count in header
- [ ] FREE tier enforces 50 messages/day limit
- [ ] Input is disabled when limit is reached
- [ ] Upgrade prompt appears when limit is hit
- [ ] Profile page shows accurate usage statistics
- [ ] STARTER tier enforces 2000 messages/month
- [ ] PRO tier has unlimited access
- [ ] Usage resets at midnight local time
- [ ] API returns proper 429 status codes
- [ ] X-Messages-Remaining header is accurate

## Debugging Tips

1. **Check Redis** for usage data:
   ```bash
   redis-cli
   > KEYS usage:*
   > HGETALL usage:USER_ID:2024-01-20
   > GET usage:USER_ID:2024-01-20:messages
   ```

2. **Check API logs** for subscription checks

3. **Monitor network tab** for:
   - 429 responses when limited
   - X-Messages-Remaining header values

4. **Profile page** should show:
   - Current usage (today/month)
   - Remaining messages
   - Subscription tier badge

## Reset Usage (for testing)

To reset a user's usage for testing:

```bash
redis-cli
> DEL usage:USER_ID:2024-01-20:messages
> DEL usage:USER_ID:monthly
```

Replace `USER_ID` with actual user ID and date with current date.