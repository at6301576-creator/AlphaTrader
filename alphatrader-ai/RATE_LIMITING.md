# Rate Limiting Documentation

This document describes the rate limiting implementation in AlphaTrader AI.

## Overview

The application uses an in-memory rate limiting system with support for Redis in production. Rate limiting protects the application from abuse and prevents exhaustion of external API quotas (Finnhub, Yahoo Finance).

## Implementation

### Core Library

Located at `src/lib/rate-limit.ts`, provides:
- In-memory rate limiting store
- Configurable rate limit policies
- IP-based and user-based identification
- Automatic cleanup of expired entries
- Rate limit response headers

### Key Features

1. **Multiple Identification Methods**
   - User ID (for authenticated requests)
   - IP Address (for public requests)
   - Fallback to "unknown" if neither available

2. **Configurable Limits**
   - Limit: Maximum requests allowed
   - Window: Time period in seconds
   - ID: Unique identifier for the rate limiter

3. **Rate Limit Headers**
   ```
   X-RateLimit-Limit: Maximum requests allowed
   X-RateLimit-Remaining: Requests remaining in window
   X-RateLimit-Reset: Unix timestamp when limit resets
   Retry-After: Seconds to wait before retrying (429 only)
   ```

## Rate Limit Policies

### API Endpoints

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/quotes` | 30 req | 60s | External API calls |
| `/api/screener` | 10 req | 60s | Expensive database queries |
| `/api/portfolio/snapshot` | 5 req | 60s | Resource-intensive calculation |
| `/api/portfolio` (POST) | 20 req | 60s | Mutation operations |
| `/api/watchlist/sparklines` | 30 req | 60s | External API calls |

### Pre-configured Rate Limiters

Available in `rateLimiters` export:

```typescript
rateLimiters.api           // 30/min - External API calls
rateLimiters.authenticated // 100/min - Standard authenticated
rateLimiters.public        // 20/min - Public endpoints
rateLimiters.mutations     // 10/min - Create/update/delete
rateLimiters.sensitive     // 5/min - Sensitive operations
```

## Usage

### Basic Usage

```typescript
import { withRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(
    request,
    { id: "my-endpoint", limit: 30, window: 60 },
    session?.user?.id
  );

  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }

  // Continue with request handling
  // ...
}
```

### Using Pre-configured Limiters

```typescript
import { rateLimiters, getIdentifier } from "@/lib/rate-limit";

const identifier = getIdentifier(request, userId);
const result = await rateLimiters.api.check(identifier);

if (!result.success) {
  // Rate limit exceeded
}
```

### Adding Rate Limit Headers

```typescript
return NextResponse.json(
  { data },
  {
    headers: {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    },
  }
);
```

## Response Format

### Success Response (200)

```json
{
  "data": "..."
}
```

Headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1702345678
```

### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

Headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702345678
Retry-After: 45
```

## Best Practices

### 1. Choose Appropriate Limits

- **API calls**: Use strict limits (5-30/min) to protect quotas
- **Database queries**: Balance user experience with server load
- **Mutations**: Prevent spam and abuse (10-20/min)
- **Reads**: Be more lenient (50-100/min)

### 2. Identify Users Properly

```typescript
// Prefer user ID over IP for authenticated routes
const session = await auth();
const identifier = getIdentifier(request, session?.user?.id);
```

### 3. Handle Rate Limit Responses

Client-side example:
```typescript
const response = await fetch('/api/endpoint');

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}
```

### 4. Monitor Rate Limits

```typescript
const remaining = response.headers.get('X-RateLimit-Remaining');
const limit = response.headers.get('X-RateLimit-Limit');

if (parseInt(remaining) < limit * 0.2) {
  console.warn('Approaching rate limit');
}
```

## Production Considerations

### Upgrading to Redis

For production with multiple servers, use Redis:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

class RedisRateLimitStore {
  async increment(key: string, windowMs: number) {
    const now = Date.now()
    const multi = redis.multi()

    multi.incr(key)
    multi.pexpire(key, windowMs)

    const [count] = await multi.exec()

    return {
      count: count as number,
      resetTime: now + windowMs
    }
  }
}
```

### Environment Variables

```env
# Optional - for Redis-based rate limiting
REDIS_URL=redis://...
REDIS_TOKEN=...
```

### Monitoring

Track these metrics:
- Rate limit hits (429 responses)
- Requests per endpoint
- Top rate-limited users/IPs
- Average requests per window

Example with logging:
```typescript
if (!result.success) {
  console.log('Rate limit exceeded', {
    endpoint: config.id,
    identifier,
    limit: config.limit,
    window: config.window,
  })
}
```

## Troubleshooting

### Issue: Rate limit too strict

**Solution**: Adjust the limit or window
```typescript
{ id: "endpoint", limit: 50, window: 60 } // Increased limit
{ id: "endpoint", limit: 30, window: 120 } // Longer window
```

### Issue: Users sharing IP

**Problem**: Multiple users behind NAT/proxy hit same limit

**Solution**: Prioritize user ID over IP
```typescript
// Always provide userId when available
const identifier = getIdentifier(request, userId) // ✅ Good
const identifier = getIdentifier(request)         // ⚠️ Falls back to IP
```

### Issue: Rate limit bypassed

**Problem**: User clears cookies or switches IP

**Solution**: Combine multiple factors
```typescript
// Rate limit by both user and IP
await withRateLimit(request, config, userId)
await withRateLimit(request, { ...config, id: `${config.id}-ip` })
```

### Issue: Memory usage growing

**Problem**: Rate limit store accumulates entries

**Solution**: Cleanup runs automatically every minute, but you can tune it:
```typescript
// Reduce window time for short-lived limits
{ id: "quick", limit: 10, window: 10 } // Cleans up faster
```

## Testing

### Manual Testing

```bash
# Test rate limit
for i in {1..35}; do
  curl http://localhost:3000/api/quotes \
    -H "Content-Type: application/json" \
    -d '{"symbols":["AAPL"]}' \
    -w "\n%{http_code}\n"
done

# Should see 200s followed by 429s
```

### Automated Testing

```typescript
describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const responses = []

    // Make requests up to limit
    for (let i = 0; i < 35; i++) {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({ symbols: ['AAPL'] })
      })
      responses.push(res.status)
    }

    // First 30 should succeed
    expect(responses.slice(0, 30).every(s => s === 200)).toBe(true)

    // Next 5 should be rate limited
    expect(responses.slice(30).every(s => s === 429)).toBe(true)
  })
})
```

## Migration Guide

### Existing Endpoints

To add rate limiting to an existing endpoint:

1. Import the utility
```typescript
import { withRateLimit } from "@/lib/rate-limit";
```

2. Get user session (if authenticated)
```typescript
const session = await auth();
```

3. Apply rate limiting
```typescript
const rateLimitResponse = await withRateLimit(
  request,
  { id: "endpoint-name", limit: 30, window: 60 },
  session?.user?.id
);

if (rateLimitResponse) {
  return rateLimitResponse;
}
```

4. Test the endpoint
```bash
# Should return 200, then 429 after limit
```

## FAQ

**Q: Why in-memory instead of Redis?**
A: In-memory is simpler for single-server deployments. Production should use Redis for multi-server setups.

**Q: Can I exclude certain users from rate limits?**
A: Yes, check for admin status before applying limits:
```typescript
if (!session?.user?.isAdmin) {
  const rateLimitResponse = await withRateLimit(...)
  if (rateLimitResponse) return rateLimitResponse
}
```

**Q: How do I increase limits for premium users?**
A: Use different limits based on user tier:
```typescript
const limit = user.tier === 'premium' ? 100 : 30
await withRateLimit(request, { id: "api", limit, window: 60 }, userId)
```

**Q: What happens on server restart?**
A: In-memory store is cleared. Redis persists limits across restarts.

## Support

For issues or questions:
1. Check this documentation
2. Review implementation in `src/lib/rate-limit.ts`
3. Test with curl/Postman
4. Check server logs for rate limit events
