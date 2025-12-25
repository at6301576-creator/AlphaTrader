import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/api/stock-data";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data in parallel
    const [portfolioItems, watchlists, recentScans, stockCache] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.watchlist.findMany({
        where: { userId: session.user.id },
      }),
      prisma.scanHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.stockCache.findMany({
        take: 100,
      }),
    ]);

    // Get current prices for portfolio
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = symbols.length > 0 ? await getQuotes(symbols) : [];

    // Calculate portfolio metrics with current prices
    let totalValue = 0;
    let totalCost = 0;
    const performanceData: Array<{
      symbol: string;
      name: string | null;
      shares: number;
      avgCost: number;
      currentPrice: number;
      value: number;
      gain: number;
      gainPercent: number;
      sector: string | null;
    }> = [];

    const sectorAllocations = new Map<string, { value: number; count: number }>();

    portfolioItems.forEach((holding) => {
      const quote = quotes.find((q) => q.symbol === holding.symbol);
      const currentPrice = quote?.currentPrice || holding.avgCost;
      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      totalValue += value;
      totalCost += costBasis;

      const sector = quote?.sector || "Unknown";
      const existing = sectorAllocations.get(sector) || { value: 0, count: 0 };
      sectorAllocations.set(sector, {
        value: existing.value + value,
        count: existing.count + 1,
      });

      performanceData.push({
        symbol: holding.symbol,
        name: quote?.name || null,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        value,
        gain,
        gainPercent,
        sector,
      });
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Format sector allocations
    const sectors = Array.from(sectorAllocations.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      positionsCount: data.count,
    }));

    // Get watchlist stocks
    const watchlistStocks: Array<{
      symbol: string;
      name: string | null;
      currentPrice: number | null;
      change: number | null;
      changePercent: number | null;
      watchlistName: string;
    }> = [];

    for (const watchlist of watchlists) {
      try {
        const symbolsArray = JSON.parse(watchlist.symbols as string);
        if (Array.isArray(symbolsArray) && symbolsArray.length > 0) {
          const watchlistQuotes = await getQuotes(symbolsArray.slice(0, 5));
          watchlistQuotes.forEach((quote) => {
            const change =
              quote.currentPrice && quote.previousClose
                ? quote.currentPrice - quote.previousClose
                : null;
            const changePercent =
              change && quote.previousClose
                ? (change / quote.previousClose) * 100
                : null;

            watchlistStocks.push({
              symbol: quote.symbol || "",
              name: quote.name || null,
              currentPrice: quote.currentPrice || null,
              change,
              changePercent,
              watchlistName: watchlist.name,
            });
          });
        }
      } catch (error) {
        console.error(`Error parsing watchlist ${watchlist.id}:`, error);
      }
    }

    // Get market movers from stock cache
    const marketMovers = stockCache
      .filter((s) => s.currentPrice && s.previousClose)
      .map((s) => {
        const change = s.currentPrice! - s.previousClose!;
        const changePercent = (change / s.previousClose!) * 100;
        return {
          symbol: s.symbol,
          name: s.name,
          currentPrice: s.currentPrice,
          change,
          changePercent,
          volume: s.volume,
        };
      })
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 10);

    // Get top gainers and losers
    const topGainers = marketMovers
      .filter((m) => m.changePercent > 0)
      .slice(0, 5);
    const topLosers = marketMovers
      .filter((m) => m.changePercent < 0)
      .slice(0, 5);

    return NextResponse.json({
      portfolio: {
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        positionsCount: portfolioItems.length,
        performance: performanceData,
        sectors,
      },
      watchlists: {
        count: watchlists.length,
        totalStocks: watchlists.reduce((sum, w) => {
          try {
            const symbols = JSON.parse(w.symbols as string);
            return sum + (Array.isArray(symbols) ? symbols.length : 0);
          } catch {
            return sum;
          }
        }, 0),
        recentStocks: watchlistStocks.slice(0, 10),
      },
      market: {
        topGainers,
        topLosers,
        movers: marketMovers,
      },
      activity: {
        recentScans: recentScans.map((scan) => ({
          id: scan.id,
          scanType: scan.scanType,
          resultsCount: scan.resultsCount,
          createdAt: scan.createdAt,
          markets: scan.markets,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching dashboard data" },
      { status: 500 }
    );
  }
}
