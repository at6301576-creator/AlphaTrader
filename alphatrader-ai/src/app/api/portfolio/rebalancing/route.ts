import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateEqualWeightRebalancing,
  calculateSectorBalancedRebalancing,
  calculateRiskParityRebalancing,
  type PortfolioHolding,
  type RebalancingPlan,
} from "@/lib/portfolio-rebalancing";

/**
 * GET /api/portfolio/rebalancing
 * Generate portfolio rebalancing recommendations
 * Query params:
 *   - strategy: "equal_weight" | "sector_balanced" | "risk_parity"
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    console.error("[Portfolio Rebalancing] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[Portfolio Rebalancing] Request started for user: ${session.user.id}`);

  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy") || "equal_weight";

    // Fetch all portfolio holdings for the user
    const holdings = await prisma.portfolio.findMany({
      where: {
        userId: session.user.id,
        soldDate: null, // Only active holdings
      },
    });

    console.log(`[Portfolio Rebalancing] Fetched ${holdings.length} holdings for user: ${session.user.id}`);

    if (holdings.length === 0) {
      return NextResponse.json({
        error: "No portfolio holdings found",
        message: "Add holdings to your portfolio to get rebalancing recommendations",
      }, { status: 404 });
    }

    if (holdings.length < 2) {
      return NextResponse.json({
        error: "Insufficient holdings",
        message: "You need at least 2 holdings to generate rebalancing recommendations",
      }, { status: 400 });
    }

    // Fetch current prices from Yahoo Finance
    const { getQuotes } = await import("@/lib/api/yahoo-finance");
    const symbols = holdings.map(h => h.symbol);
    console.log(`[Portfolio Rebalancing] Fetching quotes for ${symbols.length} symbols`);
    const quotes = await getQuotes(symbols);
    console.log(`[Portfolio Rebalancing] Successfully fetched ${quotes.length} quotes`);

    // Create a map of symbol to quote data
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    // Calculate total value and prepare holdings data
    let totalValue = 0;
    const portfolioHoldings: PortfolioHolding[] = holdings.map(h => {
      const quote = quoteMap.get(h.symbol);
      const currentPrice = (quote as any)?.regularMarketPrice || (quote as any)?.currentPrice || h.avgCost;
      const currentValue = currentPrice * h.shares;
      totalValue += currentValue;

      return {
        symbol: h.symbol,
        companyName: h.companyName || h.symbol,
        shares: h.shares,
        currentPrice,
        currentValue,
        actualAllocation: 0, // Will be calculated below
        sector: (quote as any)?.sector || "Unknown",
      };
    });

    // Calculate actual allocations
    portfolioHoldings.forEach(h => {
      h.actualAllocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
    });

    console.log(`[Portfolio Rebalancing] Total portfolio value: $${totalValue.toFixed(2)}`);
    console.log(`[Portfolio Rebalancing] Using strategy: ${strategy}`);

    // Generate rebalancing plan based on strategy
    let rebalancingPlan: RebalancingPlan;

    switch (strategy) {
      case "equal_weight":
        rebalancingPlan = calculateEqualWeightRebalancing(portfolioHoldings, totalValue);
        break;

      case "sector_balanced":
        rebalancingPlan = calculateSectorBalancedRebalancing(portfolioHoldings, totalValue, 25);
        break;

      case "risk_parity":
        // Calculate simple volatility based on price movement (simplified)
        const volatilities: Record<string, number> = {};
        portfolioHoldings.forEach(h => {
          // Use sector-based default volatilities as a simple heuristic
          const sectorVolatility: Record<string, number> = {
            "Technology": 30,
            "Healthcare": 25,
            "Financial Services": 20,
            "Consumer Cyclical": 28,
            "Energy": 35,
            "Utilities": 15,
            "Real Estate": 18,
            "Consumer Defensive": 16,
            "Industrials": 22,
            "Communication Services": 27,
            "Unknown": 25,
          };
          volatilities[h.symbol] = sectorVolatility[h.sector || "Unknown"] || 25;
        });
        rebalancingPlan = calculateRiskParityRebalancing(portfolioHoldings, totalValue, volatilities);
        break;

      default:
        rebalancingPlan = calculateEqualWeightRebalancing(portfolioHoldings, totalValue);
    }

    console.log(`[Portfolio Rebalancing] Generated plan with ${rebalancingPlan.actions.length} actions`);
    console.log(`[Portfolio Rebalancing] Summary: ${rebalancingPlan.summary.buyOrders} buys, ${rebalancingPlan.summary.sellOrders} sells, ${rebalancingPlan.summary.holdPositions} holds`);

    // Add strategy descriptions
    const strategyDescriptions: Record<string, string> = {
      "equal_weight": "Allocates your portfolio equally across all holdings, providing maximum diversification.",
      "sector_balanced": "Ensures no single sector exceeds 25% of your portfolio, reducing sector concentration risk.",
      "risk_parity": "Allocates based on inverse volatility, giving more weight to stable stocks and less to volatile ones.",
    };

    return NextResponse.json({
      ...rebalancingPlan,
      strategyDescription: strategyDescriptions[strategy] || "",
      currentAllocations: portfolioHoldings.map(h => ({
        symbol: h.symbol,
        companyName: h.companyName,
        allocation: h.actualAllocation,
        value: h.currentValue,
        sector: h.sector,
      })),
    });
  } catch (error) {
    console.error("[Portfolio Rebalancing] Error generating rebalancing plan:", error);

    if (error instanceof Error) {
      console.error(`[Portfolio Rebalancing] Error name: ${error.name}`);
      console.error(`[Portfolio Rebalancing] Error message: ${error.message}`);
      console.error(`[Portfolio Rebalancing] Error stack: ${error.stack}`);
    }

    return NextResponse.json(
      { error: "Failed to generate rebalancing plan" },
      { status: 500 }
    );
  }
}
