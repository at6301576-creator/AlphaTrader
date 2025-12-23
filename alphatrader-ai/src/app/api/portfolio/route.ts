import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { addPortfolioSchema, safeValidate } from "@/lib/validation";
import { portfolioService } from "@/services/portfolio.service";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
  validateRequest,
  withCacheHeaders,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { config } from "@/lib/config";

/**
 * GET /api/portfolio
 * Fetch portfolio summary for authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    requireAuth(session);

    const portfolio = await portfolioService.getPortfolioSummary(
      session.user.id
    );

    let response = createSuccessResponse(portfolio);

    // Add cache headers for better performance
    response = withCacheHeaders(response, {
      private: true,
      maxAge: config.cache.portfolioCacheTTL,
      staleWhileRevalidate: config.cache.portfolioStaleWhileRevalidate,
    });

    return response;
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * POST /api/portfolio
 * Add a new holding or update existing holding
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    requireAuth(session);

    // Apply rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      {
        id: "portfolio-mutations",
        limit: config.rateLimit.portfolioMutationsLimit,
        window: config.rateLimit.portfolioMutationsWindow,
      },
      session.user.id
    );

    if (rateLimitResult) {
      // Rate limit exceeded - add rate limit headers to error response
      const rateLimitInfo = {
        limit: config.rateLimit.portfolioMutationsLimit,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + config.rateLimit.portfolioMutationsWindow,
      };
      return withRateLimitHeaders(rateLimitResult, rateLimitInfo);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(body, addPortfolioSchema);

    // Add holding via service
    await portfolioService.addHolding(session.user.id, {
      symbol: validatedData.symbol,
      shares: validatedData.shares,
      avgCost: validatedData.avgCost,
      purchaseDate: validatedData.purchaseDate,
      companyName: validatedData.companyName,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
