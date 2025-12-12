import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/api/yahoo-finance";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting (5 snapshot requests per minute)
  const rateLimitResponse = await withRateLimit(
    request,
    { id: "portfolio-snapshot", limit: 5, window: 60 },
    session.user.id
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Get all portfolio holdings for user
    const portfolioItems = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    if (!portfolioItems || portfolioItems.length === 0) {
      return NextResponse.json(
        { error: "No portfolio holdings found" },
        { status: 400 }
      );
    }

    // Fetch current prices for all holdings
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = await getQuotes(symbols);

    // Create a map for quick lookup
    const quoteMap = new Map();
    quotes.forEach((q: any) => quoteMap.set(q.symbol, q));

    // Fetch sector information from StockCache
    const stockCacheData = await prisma.stockCache.findMany({
      where: {
        symbol: { in: symbols },
      },
      select: {
        symbol: true,
        sector: true,
      },
    });
    const sectorMap = new Map();
    stockCacheData.forEach((s) => sectorMap.set(s.symbol, s.sector));

    // Calculate portfolio values
    let totalValue = 0;
    let totalCost = 0;
    let totalDayChange = 0;
    const sectorAllocations = new Map();
    const holdings: any[] = [];

    portfolioItems.forEach((holding) => {
      const quote = quoteMap.get(holding.symbol);
      const currentPrice = quote?.regularMarketPrice || holding.avgCost;
      const previousClose = quote?.regularMarketPreviousClose || currentPrice;

      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
      const dayChange = holding.shares * (currentPrice - previousClose);

      totalValue += value;
      totalCost += costBasis;
      totalDayChange += dayChange;

      // Track sector allocation
      const sector = sectorMap.get(holding.symbol) || "Unknown";
      const current = sectorAllocations.get(sector) || { value: 0, count: 0 };
      sectorAllocations.set(sector, {
        value: current.value + value,
        count: current.count + 1,
      });

      holdings.push({
        symbol: holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        value,
        costBasis,
        gain,
        gainPercent,
        sector,
      });
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChangePercent =
      totalValue - totalDayChange > 0
        ? (totalDayChange / (totalValue - totalDayChange)) * 100
        : 0;

    // Calculate sector allocation percentages
    const sectors = Array.from(sectorAllocations.entries()).map(
      ([sector, data]: [string, any]) => ({
        sector,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        positionsCount: data.count,
      })
    );

    // Get top performers and losers
    const sortedByGain = [...holdings].sort((a, b) => b.gainPercent - a.gainPercent);
    const topPerformers = sortedByGain.slice(0, 5);
    const topLosers = sortedByGain.slice(-5).reverse();

    // Create snapshot
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId: session.user.id,
        totalValue,
        totalCost,
        totalGainLoss: totalGain,
        totalGainLossPerc: totalGainPercent,
        dayChange: totalDayChange,
        dayChangePerc: dayChangePercent,
        holdings: JSON.stringify(holdings),
        sectorAllocation: JSON.stringify(sectors),
        topPerformers: JSON.stringify(topPerformers),
        topLosers: JSON.stringify(topLosers),
      },
    });

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        totalValue: snapshot.totalValue,
        totalGainLoss: snapshot.totalGainLoss,
        totalGainLossPerc: snapshot.totalGainLossPerc,
        createdAt: snapshot.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating portfolio snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
