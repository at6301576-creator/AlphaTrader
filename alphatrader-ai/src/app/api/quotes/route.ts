import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/api/yahoo-finance";
import { withRateLimit, getIdentifier, rateLimiters } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { getCached, setCache, CACHE_TTL, CACHE_KEYS } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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

    // Try to get quotes from cache
    const cachePromises = symbols.map((symbol: string) =>
      getCached<any>(CACHE_KEYS.stockQuote(symbol))
    );
    const cachedQuotes = await Promise.all(cachePromises);

    // Identify which symbols need to be fetched
    const symbolsToFetch: string[] = [];
    const quotesMap = new Map<string, any>();

    symbols.forEach((symbol: string, index: number) => {
      const cached = cachedQuotes[index];
      if (cached) {
        quotesMap.set(symbol, cached);
      } else {
        symbolsToFetch.push(symbol);
      }
    });

    // Fetch uncached quotes
    let freshQuotes: any[] = [];
    if (symbolsToFetch.length > 0) {
      freshQuotes = await getQuotes(symbolsToFetch);

      // Cache the fresh quotes (fire and forget)
      freshQuotes.forEach((quote) => {
        if (quote && quote.symbol) {
          quotesMap.set(quote.symbol, quote);
          setCache(
            CACHE_KEYS.stockQuote(quote.symbol),
            quote,
            CACHE_TTL.STOCK_QUOTE
          ).catch((err) => console.error('Cache error:', err));
        }
      });
    }

    // Reconstruct quotes in original order
    const quotes = symbols.map((symbol: string) => quotesMap.get(symbol)).filter(Boolean);

    const duration = Date.now() - startTime;
    const cacheHitRate = ((symbols.length - symbolsToFetch.length) / symbols.length * 100).toFixed(1);

    console.log(
      `[Quotes API] Fetched ${symbols.length} quotes in ${duration}ms ` +
      `(${cacheHitRate}% cache hit rate, ${symbolsToFetch.length} API calls)`
    );

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
