import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  interval: number; // in milliseconds
  maxRequests: number;
}

/**
 * Apply rate limiting to a request
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, maxRequests: 10 }
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;

  let record = rateLimitStore.get(key);

  // Reset if interval has passed
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + config.interval,
    };
    rateLimitStore.set(key, record);
  }

  record.count++;

  const success = record.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    reset: record.resetAt,
  };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  return forwardedFor?.split(',')[0].trim() ||
         realIp ||
         cfConnectingIp ||
         'unknown';
}

/**
 * Validate cron request authentication
 */
export function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === cronSecret;
}

/**
 * Validate input against a Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Invalid input' };
  }
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return entities[char] || char;
    });
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

/**
 * Create error response with security headers
 */
export function createSecureErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  const response = NextResponse.json({ error: message }, { status });
  return addSecurityHeaders(response);
}

/**
 * Create success response with security headers
 */
export function createSecureResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addSecurityHeaders(response);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = [
    'password123', 'admin123', 'welcome123', '123456789012',
    'qwerty123456', 'password12345'
  ];

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
