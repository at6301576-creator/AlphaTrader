import { NextResponse } from "next/server";
import { addSecurityHeaders } from "./security";

/**
 * Standardized API response interface
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server Errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * HTTP status codes mapped to error codes
 */
const statusCodeMap: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    requestId?: string;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
    },
  };

  const nextResponse = NextResponse.json(response, {
    status: options?.status || 200,
  });

  // Add custom headers if provided
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      nextResponse.headers.set(key, value);
    });
  }

  // Add security headers
  return addSecurityHeaders(nextResponse);
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: Error | ApiError,
  options?: {
    requestId?: string;
    logError?: boolean;
  }
): NextResponse<ApiResponse<never>> {
  const isApiError = error instanceof ApiError;

  const errorCode = isApiError ? error.code : ErrorCode.INTERNAL_ERROR;
  const statusCode = isApiError ? error.statusCode : 500;
  const message = error.message || "An unexpected error occurred";
  const details = isApiError ? error.details : undefined;

  // Log error if enabled (default: true for 5xx errors)
  const shouldLog = options?.logError !== false && statusCode >= 500;
  if (shouldLog) {
    console.error(`[API Error] ${errorCode}:`, {
      message,
      details,
      stack: error.stack,
      requestId: options?.requestId,
    });
  }

  const response: ApiResponse<never> = {
    error: {
      message,
      code: errorCode,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
    },
  };

  const nextResponse = NextResponse.json(response, { status: statusCode });
  return addSecurityHeaders(nextResponse);
}

/**
 * Wraps an async API handler with standardized error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  options?: {
    requestId?: string;
    onError?: (error: Error) => void;
  }
): Promise<NextResponse<ApiResponse<T>>> {
  return handler()
    .then((data) =>
      createSuccessResponse(data, { requestId: options?.requestId })
    )
    .catch((error) => {
      if (options?.onError) {
        options.onError(error);
      }
      return createErrorResponse(error, { requestId: options?.requestId });
    });
}

/**
 * Validates request body against a schema
 */
export function validateRequest<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(data);
  } catch (error: any) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "Invalid request data",
      422,
      { validationErrors: error.errors || error.message }
    );
  }
}

/**
 * Checks if user is authenticated
 */
export function requireAuth(session: any): asserts session is NonNullable<typeof session> {
  if (!session?.user?.email) {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }
}

/**
 * Adds cache control headers to response
 */
export function withCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    private?: boolean;
  }
): NextResponse {
  const cacheDirectives: string[] = [];

  if (options.private) {
    cacheDirectives.push("private");
  } else {
    cacheDirectives.push("public");
  }

  if (options.maxAge !== undefined) {
    cacheDirectives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    cacheDirectives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    cacheDirectives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  response.headers.set("Cache-Control", cacheDirectives.join(", "));
  return response;
}

/**
 * Adds rate limit headers to response
 */
export function withRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: {
    limit: number;
    remaining: number;
    reset: number;
  }
): NextResponse {
  response.headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
  response.headers.set("X-RateLimit-Reset", rateLimitInfo.reset.toString());
  return response;
}
