import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import yahooFinance from "yahoo-finance2";

/**
 * Get sparkline data (7-day price history) for multiple symbols
 * POST /api/watchlist/sparklines
 * Body: { symbols: string[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      );
    }

    const sparklineData: Record<string, Array<{ date: string; price: number }>> = {};

    // Fetch 7-day historical data for each symbol
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    for (const symbol of symbols) {
      try {
        const result = await yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        });

        if (result && (result as any).quotes && (result as any).quotes.length > 0) {
          sparklineData[symbol] = (result as any).quotes.map((quote: any) => ({
            date: new Date(quote.date).toISOString(),
            price: quote.close || 0,
          }));
        } else {
          sparklineData[symbol] = [];
        }
      } catch (error) {
        console.error(`Error fetching sparkline for ${symbol}:`, error);
        sparklineData[symbol] = [];
      }
    }

    return NextResponse.json({ sparklines: sparklineData });
  } catch (error) {
    console.error("Error fetching sparklines:", error);
    return NextResponse.json(
      { error: "Failed to fetch sparklines" },
      { status: 500 }
    );
  }
}
