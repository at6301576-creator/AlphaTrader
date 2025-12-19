/**
 * Centralized API Error Handling
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

/**
 * Handle errors consistently across all API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("[API Error]", error);

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          {
            error: {
              message: "A record with this value already exists",
              code: "DUPLICATE_ENTRY",
              details: error.meta,
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json(
          {
            error: {
              message: "Record not found",
              code: "NOT_FOUND",
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: {
              message: "Database error",
              code: "DATABASE_ERROR",
              details: process.env.NODE_ENV === "development" ? error.code : undefined,
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 500 }
        );
    }
  }

  // Handle validation errors from Zod or other validators
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      },
      meta: { timestamp: new Date().toISOString() },
    },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Async handler wrapper to automatically catch errors
 */
export function withErrorHandler<T = any>(
  handler: (req: Request, context?: any) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: Request, context?: any): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
