import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotes, type QuoteResult } from "@/lib/api/yahoo-finance";
import { withRateLimit } from "@/lib/rate-limit";
import { addPortfolioSchema, safeValidate } from "@/lib/validation";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[Portfolio API] Fetching portfolio for user: ${session.user.id}`);

    // Get all portfolio holdings for user with optimized query
    const portfolioItems = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { symbol: 'asc' }, // Add ordering for consistent results
      select: {
        id: true,
        symbol: true,
        companyName: true,
        shares: true,
        avgCost: true,
        purchaseDate: true,
        soldDate: true,
      },
    });

    console.log(`[Portfolio API] Found ${portfolioItems.length} holdings`);

    if (!portfolioItems || portfolioItems.length === 0) {
      return NextResponse.json({
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
      });
    }

    // Fetch current prices for all holdings
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = await getQuotes(symbols);

    // Create a map for quick lookup
    const quoteMap = new Map<string, QuoteResult>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

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
    const sectorMap = new Map<string, string | null>();
    stockCacheData.forEach((s) => sectorMap.set(s.symbol, s.sector));

    // Calculate portfolio values
    let totalValue = 0;
    let totalCost = 0;
    let totalDayChange = 0;
    const sectorAllocations = new Map<string, { value: number; count: number }>();

    const holdings = portfolioItems.map((holding) => {
      const quote = quoteMap.get(holding.symbol);
      const currentPrice = quote?.regularMarketPrice || holding.avgCost;
      const previousClose = quote?.regularMarketPreviousClose || currentPrice;

      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
      const dayChange = holding.shares * (currentPrice - previousClose);
      const dayChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

      totalValue += value;
      totalCost += costBasis;
      totalDayChange += dayChange;

      // Track sector allocation
      const sector = sectorMap.get(holding.symbol) || "Unknown";
      const current = sectorAllocations.get(sector) || { value: 0, count: 0 };
      sectorAllocations.set(sector, { value: current.value + value, count: current.count + 1 });

      return {
        id: holding.id,
        symbol: holding.symbol,
        name: quote?.longName || quote?.shortName || holding.companyName || holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        previousClose,
        value,
        costBasis,
        gain,
        gainPercent,
        dayChange,
        dayChangePercent,
        sector,
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChangePercent = (totalValue - totalDayChange) > 0
      ? (totalDayChange / (totalValue - totalDayChange)) * 100
      : 0;

    // Calculate sector allocation percentages
    const sectors = Array.from(sectorAllocations.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      positionsCount: data.count,
    }));

    const response = NextResponse.json({
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange: totalDayChange,
      dayChangePercent,
      holdings,
      sectorAllocations: sectors,
    });

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');

    console.log(`[Portfolio API] Successfully returned portfolio data`);
    return response;
  } catch (error) {
    console.error("[Portfolio API] Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting (20 mutations per minute)
  const rateLimitResponse = await withRateLimit(
    request,
    { id: "portfolio-mutations", limit: 20, window: 60 },
    session.user.id
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = safeValidate(addPortfolioSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "error" in validation ? validation.error : "Invalid input" },
        { status: 400 }
      );
    }

    const { symbol, shares, avgCost, purchaseDate, companyName } = validation.data;
    const symbolUpper = symbol; // Already uppercased by schema

    // Check if holding already exists
    const existing = await prisma.portfolio.findFirst({
      where: {
        userId: session.user.id,
        symbol: symbolUpper,
      },
    });

    if (existing) {
      // Update existing holding (average the cost)
      const totalShares = existing.shares + shares;
      const totalCostBasis = (existing.shares * existing.avgCost) + (shares * avgCost);

      await prisma.portfolio.update({
        where: { id: existing.id },
        data: {
          shares: totalShares,
          avgCost: totalCostBasis / totalShares,
        },
      });
    } else {
      // Create new holding
      await prisma.portfolio.create({
        data: {
          userId: session.user.id,
          symbol: symbolUpper,
          companyName,
          shares,
          avgCost,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding holding:", error);
    return NextResponse.json(
      { error: "Failed to add holding" },
      { status: 500 }
    );
  }
}
