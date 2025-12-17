# Security Enhancements - AlphaTrader AI

This document outlines the security improvements implemented in the AlphaTrader AI application.

## 🔒 Security Features Implemented

### 1. Authentication & Authorization

#### ✅ Protected Cron Endpoints
**Location:** `src/app/api/cron/**`

- **Issue:** Cron endpoints were unprotected, allowing anyone to trigger expensive operations
- **Fix:** Implemented API key authentication using `CRON_SECRET` environment variable
- **Impact:** Prevents unauthorized access to scheduled jobs

**Setup Required:**
```bash
# Add to your .env file
CRON_SECRET=<generate-a-strong-random-secret>
```

**Usage:**
```bash
curl -X GET https://yourapp.com/api/cron/snapshot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### ✅ API Route Authentication
**Location:** All API routes in `src/app/api/**`

- All authenticated routes now use NextAuth session validation
- Consistent error responses with security headers
- Proper 401 Unauthorized responses for unauthenticated requests

### 2. Rate Limiting

#### ✅ Global Rate Limiting
**Location:** `src/middleware.ts`

- **Limit:** 60 requests per minute per IP address
- **Scope:** All API routes
- **Response:** 429 Too Many Requests with Retry-After header

#### ✅ Endpoint-Specific Rate Limiting
**Location:** `src/lib/security.ts`

Implemented rate limiting for sensitive operations:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/register` | 5 requests | 1 hour |
| `/api/scanner` | 10 requests | 1 hour |
| `/api/ai/chat` | 20 requests | 1 hour |

**Note:** Current implementation uses in-memory storage. For production with multiple instances, migrate to Redis.

### 3. Input Validation

#### ✅ Zod Schema Validation
**Location:** `src/lib/security.ts`

All API routes now validate input using Zod schemas:

- **Registration:** Email format, name length, password requirements
- **AI Chat:** Message format, content length (max 10,000 chars), role validation
- **Proper error messages** with field-specific validation errors

Example:
```typescript
const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(12),
});
```

### 4. Password Security

#### ✅ Strong Password Requirements
**Location:** `src/lib/security.ts`, `src/app/api/auth/register/route.ts`

New password requirements:
- ✅ Minimum 12 characters (previously 6)
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character
- ✅ Blocks common passwords
- ✅ Bcrypt cost factor increased from 10 to 12

### 5. Security Headers

#### ✅ Comprehensive Security Headers
**Location:** `src/middleware.ts`, `src/lib/security.ts`

Implemented headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | DENY | Prevents clickjacking |
| `X-Content-Type-Options` | nosniff | Prevents MIME sniffing |
| `X-XSS-Protection` | 1; mode=block | XSS protection |
| `Referrer-Policy` | strict-origin-when-cross-origin | Controls referrer info |
| `Permissions-Policy` | Restrictive | Limits browser features |
| `Strict-Transport-Security` | max-age=31536000 | Forces HTTPS (production) |
| `Content-Security-Policy` | Restrictive | Prevents XSS attacks |

### 6. CORS Configuration

#### ✅ Configurable CORS
**Location:** `src/middleware.ts`

- **Development:** Allows localhost origins
- **Production:** Uses whitelist from `ALLOWED_ORIGINS` environment variable
- **Credentials:** Properly configured for authenticated requests

**Setup:**
```bash
# Add to .env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### 7. Content Security Policy (CSP)

#### ✅ Strict CSP in Production
**Location:** `src/middleware.ts`

Configured CSP directives:
- `default-src 'self'` - Only load resources from same origin
- `script-src` - Allows self and inline scripts (for Next.js)
- `style-src` - Allows self and inline styles
- `img-src` - Allows self, data URIs, and HTTPS images
- `connect-src` - Whitelists specific API endpoints
- `frame-ancestors 'none'` - Prevents framing
- `base-uri 'self'` - Prevents base tag injection
- `form-action 'self'` - Restricts form submissions

### 8. Centralized Security Utilities

#### ✅ Security Helper Functions
**Location:** `src/lib/security.ts`

New utilities:
- `validateCronAuth()` - Validates cron job authentication
- `rateLimit()` - Applies rate limiting
- `validateInput()` - Validates input with Zod schemas
- `validatePasswordStrength()` - Checks password complexity
- `sanitizeString()` - Prevents XSS in string inputs
- `createSecureResponse()` - Creates responses with security headers
- `createSecureErrorResponse()` - Creates error responses with security headers
- `getClientIdentifier()` - Extracts client IP for rate limiting

## 🚨 Critical Security Recommendations

### 1. Environment Variables

**CRITICAL:** Set these in production:

```bash
# Required for authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Required for cron jobs
CRON_SECRET=<generate-with-openssl-rand-base64-32>

# Required for CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Database Security

Current schema is secure with:
- ✅ Proper foreign key constraints
- ✅ Indexed fields for performance
- ✅ No sensitive data in logs

**Additional recommendations:**
- Enable SSL/TLS for database connections
- Use connection pooling
- Implement database backup encryption

### 3. Rate Limiting in Production

**CRITICAL:** The current in-memory rate limiting won't work with multiple instances.

**Migration to Redis:**
```typescript
// Example Redis implementation
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function rateLimit(key: string, limit: number, window: number) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  return count <= limit;
}
```

### 4. Logging & Monitoring

**Recommendations:**
- Remove `console.log` statements in production
- Implement structured logging (e.g., Winston, Pino)
- Set up error monitoring (e.g., Sentry)
- Monitor rate limit violations
- Track failed authentication attempts

### 5. API Key Security

**Current risks:**
- API keys in environment variables (acceptable)
- No key rotation mechanism

**Recommendations:**
- Implement API key rotation
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Monitor API key usage

### 6. Session Security

**Current implementation:**
- ✅ JWT tokens for sessions
- ✅ Secure cookie settings

**Recommendations:**
- Implement session timeout
- Add refresh token mechanism
- Implement concurrent session limits

## 🔍 Security Checklist for Deployment

- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Set strong `CRON_SECRET` (32+ characters)
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable HTTPS/SSL
- [ ] Configure database SSL/TLS
- [ ] Set up Redis for distributed rate limiting
- [ ] Remove development API keys
- [ ] Enable production logging
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup strategy
- [ ] Review CSP policy and adjust for your domain
- [ ] Test all rate limits
- [ ] Verify cron job authentication
- [ ] Run security audit (npm audit)
- [ ] Update dependencies

## 🛡️ Security Testing

### Manual Tests

1. **Test cron authentication:**
```bash
# Should fail without auth
curl https://yourapp.com/api/cron/snapshot

# Should succeed with auth
curl -H "Authorization: Bearer YOUR_SECRET" https://yourapp.com/api/cron/snapshot
```

2. **Test rate limiting:**
```bash
# Run this 61 times quickly
for i in {1..61}; do curl https://yourapp.com/api/scanner; done
# 61st request should return 429
```

3. **Test password validation:**
```bash
# Should fail (weak password)
curl -X POST https://yourapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak","name":"Test"}'
```

### Automated Testing

Consider implementing:
- OWASP ZAP scanning
- npm audit in CI/CD
- Dependabot for dependency updates
- Security headers testing (securityheaders.com)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🔄 Future Enhancements

Consider implementing:
1. **Two-Factor Authentication (2FA)**
2. **Account lockout after failed attempts**
3. **IP-based geolocation blocking**
4. **Webhook signature verification**
5. **API request signing**
6. **Web Application Firewall (WAF)**
7. **DDoS protection (Cloudflare)**
8. **Automated security scanning in CI/CD**
9. **Security incident response plan**
10. **Regular penetration testing**

---

**Last Updated:** 2025-12-12
**Security Contact:** [Add your security contact email]
