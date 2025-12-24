import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, entries auto-expire on check)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute (increased for legitimate traffic)

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entry or create new
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });

    // Lazy cleanup: remove expired entries when map gets large
    if (rateLimitMap.size > 1000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Apply rate limiting to API routes only
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!rateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // XSS protection
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (simplified for compatibility)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
