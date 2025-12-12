import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/api/stock-data";

/**
 * Cron job to create daily portfolio snapshots for all users
 * Should run at market close (4:00 PM ET / 9:00 PM UTC)
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/snapshot",
 *     "schedule": "0 21 * * 1-5"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    // In production, add authorization header check
    const authHeader = request.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📸 Starting daily portfolio snapshot job...");

    // Get all users with portfolios
    const users = await prisma.user.findMany({
      include: {
        portfolios: {
          where: {
            soldDate: null, // Only active positions
          },
        },
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      // Skip users with no portfolio
      if (user.portfolios.length === 0) {
        continue;
      }

      try {
        // Get current prices for all holdings
        const symbols = user.portfolios.map((p) => p.symbol);
        const quotes = await getQuotes(symbols);

        if (!quotes || quotes.length === 0) {
          console.error(`No quotes found for user ${user.id}`);
          errorCount++;
          continue;
        }

        // Calculate portfolio metrics
        let totalValue = 0;
        let totalCost = 0;
        let totalDayChange = 0;

        const holdings = user.portfolios.map((position) => {
          const quote = quotes.find((q) => q.symbol === position.symbol);
          if (!quote) return null;

          const currentPrice = (quote as any).regularMarketPrice || quote.currentPrice || 0;
          const currentValue = currentPrice * position.shares;
          const costBasis = position.avgCost * position.shares;
          const gainLoss = currentValue - costBasis;
          const gainLossPercent = (gainLoss / costBasis) * 100;
          const dayChange = ((quote as any).regularMarketChange || 0) * position.shares;

          totalValue += currentValue;
          totalCost += costBasis;
          totalDayChange += dayChange;

          return {
            symbol: position.symbol,
            shares: position.shares,
            avgCost: position.avgCost,
            currentPrice: currentPrice,
            currentValue,
            costBasis,
            gainLoss,
            gainLossPercent,
            dayChange,
          };
        }).filter(Boolean);

        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
        const dayChangePercent = totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

        // Calculate sector allocation
        const sectorMap = new Map<string, number>();
        for (const holding of holdings) {
          if (!holding) continue;
          const quote = quotes.find((q) => q.symbol === holding.symbol);
          const sector = quote?.sector || "Unknown";
          sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.currentValue);
        }

        const sectors = Array.from(sectorMap.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: (value / totalValue) * 100,
        }));

        // Get top performers and losers
        const sortedByGain = [...holdings].filter(Boolean).sort((a, b) =>
          (b?.gainLossPercent || 0) - (a?.gainLossPercent || 0)
        );
        const topPerformers = sortedByGain.slice(0, 5);
        const topLosers = sortedByGain.slice(-5).reverse();

        // Create snapshot
        await prisma.portfolioSnapshot.create({
          data: {
            userId: user.id,
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

        successCount++;
        console.log(`✅ Snapshot created for user ${user.id}`);
      } catch (error) {
        console.error(`❌ Error creating snapshot for user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`📸 Snapshot job completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} snapshots`,
      errors: errorCount,
    });
  } catch (error) {
    console.error("❌ Snapshot cron job error:", error);
    return NextResponse.json(
      { error: "Snapshot job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
