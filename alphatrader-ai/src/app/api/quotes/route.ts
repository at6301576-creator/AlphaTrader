import { NextRequest } from "next/server";
import { getQuotes } from "@/lib/api/yahoo-finance";
import { withRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import {
  createSuccessResponse,
  createErrorResponse,
  validateRequest,
  withRateLimitHeaders,
  ErrorCode,
  ApiError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // Get user session for rate limiting
    const session = await auth();
    const userId = session?.user?.id;

    // Apply rate limiting (30 requests per minute for API calls)
    const rateLimitResponse = await withRateLimit(
      request,
      { id: "quotes-api", limit: 30, window: 60 },
      userId
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse and validate request body
    const body = await validateRequest(request, (data) => {
      if (!data.symbols || !Array.isArray(data.symbols) || data.symbols.length === 0) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Symbols array is required and must not be empty",
          400
        );
      }

      if (data.symbols.length > 50) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Maximum 50 symbols allowed per request",
          400
        );
      }

      return data;
    });

    const quotes = await getQuotes(body.symbols);

    // Return success response with rate limit headers
    return withRateLimitHeaders(
      createSuccessResponse({ quotes }),
      request,
      userId,
      "api"
    );
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
