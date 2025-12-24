import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/api/yahoo-finance";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y, all

    // Calculate date range based on period
    const currentDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(currentDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(currentDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get historical snapshots
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get current portfolio data
    const portfolioItems = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    if (!portfolioItems || portfolioItems.length === 0) {
      return NextResponse.json({
        currentValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPerc: 0,
        historicalData: [],
        performanceMetrics: {
          bestDay: null,
          worstDay: null,
          avgDailyReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          calmarRatio: 0,
          maxDrawdown: 0,
          maxDrawdownPeriod: { start: null, end: null },
          winRate: 0,
          annualizedReturn: 0,
          totalReturn: 0,
        },
        sectorAllocation: [],
        topPerformers: [],
        topLosers: [],
      });
    }

    // Fetch current prices
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = await getQuotes(symbols);
    const quoteMap = new Map(
      quotes && Array.isArray(quotes) ? quotes.map((q) => [q.symbol, q]) : []
    );

    // Fetch sector information
    const stockCacheData = await prisma.stockCache.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, sector: true },
    });
    const sectorMap = new Map(
      stockCacheData && Array.isArray(stockCacheData) ? stockCacheData.map((s) => [s.symbol, s.sector]) : []
    );

    // Calculate current portfolio metrics
    let totalValue = 0;
    let totalCost = 0;
    const sectorAllocations = new Map<string, number>();
    const holdings: any[] = [];

    for (const holding of portfolioItems) {
      const quote = quoteMap.get(holding.symbol);
      const currentPrice = quote?.regularMarketPrice || holding.avgCost;
      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      totalValue += value;
      totalCost += costBasis;

      const sector = sectorMap.get(holding.symbol) || "Unknown";
      sectorAllocations.set(sector, (sectorAllocations.get(sector) || 0) + value);

      holdings.push({
        symbol: holding.symbol,
        name: quote?.longName || quote?.shortName || holding.companyName || holding.symbol,
        value,
        costBasis,
        gain,
        gainPercent,
        sector,
      });
    }

    // Sort holdings by gain/loss
    holdings.sort((a, b) => b.gainPercent - a.gainPercent);
    const topPerformers = holdings.slice(0, 5);
    const topLosers = holdings.slice(-5).reverse();

    // Calculate sector allocation percentages
    const sectors = Array.from(sectorAllocations.entries()).map(([sector, value]) => ({
      name: sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

    // Calculate performance metrics from historical data
    let bestDay = null;
    let worstDay = null;
    let dailyReturns: number[] = [];
    let portfolioValues: number[] = [];
    let maxDrawdown = 0;
    let maxDrawdownPeriod = { start: null as Date | null, end: null as Date | null };

    if (snapshots.length > 1) {
      let peak = snapshots[0].totalValue;
      let peakDate = snapshots[0].createdAt;

      for (let i = 1; i < snapshots.length; i++) {
        const prevValue = snapshots[i - 1].totalValue;
        const currValue = snapshots[i].totalValue;
        const dailyReturn = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : 0;
        dailyReturns.push(dailyReturn);
        portfolioValues.push(currValue);

        // Track best and worst days
        if (bestDay === null || dailyReturn > bestDay.return) {
          bestDay = {
            date: snapshots[i].createdAt,
            return: dailyReturn,
          };
        }

        if (worstDay === null || dailyReturn < worstDay.return) {
          worstDay = {
            date: snapshots[i].createdAt,
            return: dailyReturn,
          };
        }

        // Calculate max drawdown
        if (currValue > peak) {
          peak = currValue;
          peakDate = snapshots[i].createdAt;
        }

        const drawdown = ((currValue - peak) / peak) * 100;
        if (drawdown < maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownPeriod = {
            start: peakDate,
            end: snapshots[i].createdAt,
          };
        }
      }
    }

    // Calculate average daily return
    const avgDailyReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      : 0;

    // Calculate volatility (standard deviation of daily returns)
    let volatility = 0;
    if (dailyReturns.length > 0) {
      const squaredDiffs = dailyReturns.map(r => Math.pow(r - avgDailyReturn, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / dailyReturns.length;
      volatility = Math.sqrt(variance);
    }

    // Calculate downside volatility (for Sortino ratio - only negative returns)
    const negativeReturns = dailyReturns.filter(r => r < 0);
    let downsideVolatility = 0;
    if (negativeReturns.length > 0) {
      const squaredNegDiffs = negativeReturns.map(r => Math.pow(r, 2));
      const downsideVariance = squaredNegDiffs.reduce((a, b) => a + b, 0) / negativeReturns.length;
      downsideVolatility = Math.sqrt(downsideVariance);
    }

    // Calculate Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
    const sharpeRatio = volatility > 0 ? avgDailyReturn / volatility : 0;

    // Calculate Sortino Ratio (uses downside volatility instead of total volatility)
    const sortinoRatio = downsideVolatility > 0 ? avgDailyReturn / downsideVolatility : 0;

    // Calculate Calmar Ratio (return / max drawdown)
    const annualizedReturn = avgDailyReturn * 252; // Assuming 252 trading days
    const calmarRatio = maxDrawdown < 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

    // Calculate win rate (percentage of positive return days)
    const positiveReturns = dailyReturns.filter(r => r > 0).length;
    const winRate = dailyReturns.length > 0 ? (positiveReturns / dailyReturns.length) * 100 : 0;

    // Format historical data for charts
    const historicalData = snapshots.map((snapshot) => ({
      date: snapshot.createdAt,
      value: snapshot.totalValue,
      cost: snapshot.totalCost,
      gainLoss: snapshot.totalGainLoss,
      gainLossPerc: snapshot.totalGainLossPerc,
    }));

    // Add current data point if not already in snapshots
    const lastSnapshot = snapshots[snapshots.length - 1];
    const currentTime = new Date();
    if (!lastSnapshot || currentTime.getTime() - lastSnapshot.createdAt.getTime() > 3600000) {
      // Add if more than 1 hour since last snapshot
      historicalData.push({
        date: currentTime,
        value: totalValue,
        cost: totalCost,
        gainLoss: totalValue - totalCost,
        gainLossPerc: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      });
    }

    return NextResponse.json({
      currentValue: totalValue,
      totalCost,
      totalGainLoss: totalValue - totalCost,
      totalGainLossPerc: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      historicalData,
      performanceMetrics: {
        bestDay,
        worstDay,
        avgDailyReturn,
        volatility,
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        maxDrawdown,
        maxDrawdownPeriod,
        winRate,
        annualizedReturn,
        totalReturn: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      },
      sectorAllocation: sectors,
      topPerformers,
      topLosers,
    });
  } catch (error) {
    console.error("Error fetching portfolio analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio analytics" },
      { status: 500 }
    );
  }
}

// Create a new snapshot
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current portfolio data
    const portfolioItems = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    if (!portfolioItems || portfolioItems.length === 0) {
      return NextResponse.json({ message: "No portfolio holdings to snapshot" });
    }

    // Fetch current prices
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = await getQuotes(symbols);
    const quoteMap = new Map(
      quotes && Array.isArray(quotes) ? quotes.map((q) => [q.symbol, q]) : []
    );

    // Fetch sector information
    const stockCacheData = await prisma.stockCache.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, sector: true },
    });
    const sectorMap = new Map(
      stockCacheData && Array.isArray(stockCacheData) ? stockCacheData.map((s) => [s.symbol, s.sector]) : []
    );

    // Calculate metrics
    let totalValue = 0;
    let totalCost = 0;
    let totalDayChange = 0;
    const sectorAllocations = new Map<string, number>();
    const holdings: any[] = [];

    for (const holding of portfolioItems) {
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

      const sector = sectorMap.get(holding.symbol) || "Unknown";
      sectorAllocations.set(sector, (sectorAllocations.get(sector) || 0) + value);

      holdings.push({
        symbol: holding.symbol,
        name: quote?.longName || quote?.shortName || holding.companyName || holding.symbol,
        value,
        costBasis,
        gain,
        gainPercent,
      });
    }

    // Get top performers and losers
    holdings.sort((a, b) => b.gainPercent - a.gainPercent);
    const topPerformers = holdings.slice(0, 5);
    const topLosers = holdings.slice(-5).reverse();

    // Sector allocation
    const sectors = Array.from(sectorAllocations.entries()).map(([sector, value]) => ({
      name: sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPerc = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dayChangePerc = (totalValue - totalDayChange) > 0
      ? (totalDayChange / (totalValue - totalDayChange)) * 100
      : 0;

    // Create snapshot
    await prisma.portfolioSnapshot.create({
      data: {
        userId: session.user.id,
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPerc,
        dayChange: totalDayChange,
        dayChangePerc,
        holdings: JSON.stringify(holdings),
        sectorAllocation: JSON.stringify(sectors),
        topPerformers: JSON.stringify(topPerformers),
        topLosers: JSON.stringify(topLosers),
      },
    });

    return NextResponse.json({ success: true, message: "Snapshot created successfully" });
  } catch (error) {
    console.error("Error creating portfolio snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio snapshot" },
      { status: 500 }
    );
  }
}
