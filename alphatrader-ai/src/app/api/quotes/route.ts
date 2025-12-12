import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/api/yahoo-finance";
import { withRateLimit, getIdentifier, rateLimiters } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

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

    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      );
    }

    // Limit number of symbols per request
    if (symbols.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 symbols per request" },
        { status: 400 }
      );
    }

    const quotes = await getQuotes(symbols);

    // Get rate limit info for response headers
    const identifier = getIdentifier(request, userId);
    const rateLimitInfo = await rateLimiters.api.check(identifier);

    return NextResponse.json(
      { quotes },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitInfo.limit.toString(),
          "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
          "X-RateLimit-Reset": rateLimitInfo.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
