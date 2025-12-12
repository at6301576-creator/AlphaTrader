import { NextRequest, NextResponse } from "next/server";
import { getBenchmarkQuote, getBenchmarkHistory, BENCHMARKS } from "@/lib/api/benchmarks";

// Map Analysis page period format to benchmark API format
function mapPeriod(period: string): "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" {
  const periodMap: Record<string, "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y"> = {
    "7d": "5d",
    "30d": "1mo",
    "90d": "3mo",
    "1y": "1y",
    "all": "5y",
  };
  return periodMap[period] || "1y";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const periodParam = searchParams.get("period") || "1y";
    const period = mapPeriod(periodParam);
    const all = searchParams.get("all") === "true";

    console.log(`[Benchmark API] Request received - symbol: ${symbol || 'default'}, period: ${periodParam}, all: ${all}`);

    // If 'all' flag is set, return all major benchmarks
    if (all) {
      console.log(`[Benchmark API] Fetching all benchmarks`);
      const benchmarkSymbols = Object.values(BENCHMARKS).map(b => b.symbol);
      console.log(`[Benchmark API] Benchmark symbols: ${benchmarkSymbols.join(', ')}`);
      const quotes = await Promise.all(
        benchmarkSymbols.map(sym => getBenchmarkQuote(sym))
      );

      const validQuotes = quotes.filter(q => q !== null);
      console.log(`[Benchmark API] Successfully fetched ${validQuotes.length}/${quotes.length} benchmarks`);

      return NextResponse.json({
        benchmarks: validQuotes,
      });
    }

    // If specific symbol requested
    if (symbol) {
      console.log(`[Benchmark API] Fetching benchmark data for symbol: ${symbol}, period: ${period}`);
      const [quote, history] = await Promise.all([
        getBenchmarkQuote(symbol),
        getBenchmarkHistory(symbol, period),
      ]);

      console.log(`[Benchmark API] Quote result for ${symbol}:`, quote ? 'success' : 'null');
      console.log(`[Benchmark API] History result for ${symbol}:`, history ? `${history.length} points` : 'null');

      if (!quote) {
        console.error(`[Benchmark API] No quote data returned for symbol: ${symbol}`);
        return NextResponse.json(
          { error: "Benchmark not found" },
          { status: 404 }
        );
      }

      console.log(`[Benchmark API] Successfully fetched data for ${symbol}`);
      return NextResponse.json({
        ...quote,
        historicalData: history,
      });
    }

    // Default: return S&P 500
    console.log(`[Benchmark API] Fetching default benchmark (S&P 500), period: ${period}`);
    const [quote, history] = await Promise.all([
      getBenchmarkQuote(BENCHMARKS.SP500.symbol),
      getBenchmarkHistory(BENCHMARKS.SP500.symbol, period),
    ]);

    if (!quote) {
      console.error(`[Benchmark API] Failed to fetch default benchmark (S&P 500)`);
      return NextResponse.json(
        { error: "Failed to fetch benchmark data" },
        { status: 500 }
      );
    }

    console.log(`[Benchmark API] Successfully fetched default benchmark (S&P 500)`);
    return NextResponse.json({
      ...quote,
      historicalData: history,
    });
  } catch (error) {
    console.error("[Benchmark API] Error in benchmarks API:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error(`[Benchmark API] Error name: ${error.name}`);
      console.error(`[Benchmark API] Error message: ${error.message}`);
      console.error(`[Benchmark API] Error stack: ${error.stack}`);
    }

    return NextResponse.json(
      { error: "Failed to fetch benchmark data" },
      { status: 500 }
    );
  }
}
