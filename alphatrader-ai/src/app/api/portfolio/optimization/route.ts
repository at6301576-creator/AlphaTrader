import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface OptimizationSuggestion {
  type: "diversification" | "risk" | "performance" | "rebalancing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
}

interface PortfolioOptimizationResponse {
  suggestions: OptimizationSuggestion[];
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  cached: boolean;
}

/**
 * GET /api/portfolio/optimization
 * Generate AI-powered portfolio optimization suggestions
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    console.error("[Portfolio Optimization] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[Portfolio Optimization] Request started for user: ${session.user.id} (${session.user.email})`);

  try {
    // Fetch all portfolio holdings for the user
    const holdings = await prisma.portfolio.findMany({
      where: {
        userId: session.user.id,
        soldDate: null, // Only active holdings
      },
    });

    console.log(`[Portfolio Optimization] Fetched ${holdings.length} holdings for user: ${session.user.id}`);

    if (holdings.length === 0) {
      return NextResponse.json({
        suggestions: [],
        overallScore: 0,
        strengths: ["Start building your portfolio by adding holdings"],
        weaknesses: ["No holdings to analyze"],
        cached: false,
      });
    }

    // Fetch analytics data for context
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const periodDays = period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch current prices from Yahoo Finance
    const { getQuotes } = await import("@/lib/api/yahoo-finance");
    const symbols = holdings.map(h => h.symbol);
    console.log(`[Portfolio Optimization] Fetching quotes for ${symbols.length} symbols: ${symbols.join(", ")}`);
    const quotes = await getQuotes(symbols);
    console.log(`[Portfolio Optimization] Successfully fetched ${quotes.length} quotes`);

    // Create a map of symbol to quote data
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    // Calculate basic metrics with current prices
    let totalValue = 0;
    let totalCost = 0;
    const holdingsWithPrices = holdings.map(h => {
      const quote = quoteMap.get(h.symbol);
      const currentPrice = (quote as any)?.regularMarketPrice || (quote as any)?.currentPrice || 0;
      const value = currentPrice * h.shares;
      const cost = h.avgCost * h.shares;
      totalValue += value;
      totalCost += cost;

      return {
        symbol: h.symbol,
        companyName: h.companyName || h.symbol,
        shares: h.shares,
        avgCost: h.avgCost,
        currentPrice,
        value,
        cost,
        sector: quote?.sector || "Unknown",
      };
    });

    const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Group holdings by sector
    const sectorAllocation = holdingsWithPrices.reduce((acc, holding) => {
      const sector = holding.sector || "Unknown";
      acc[sector] = (acc[sector] || 0) + holding.value;
      return acc;
    }, {} as Record<string, number>);

    const sectors = Object.entries(sectorAllocation).map(([sector, value]) => ({
      sector,
      value: value as number,
      percentage: totalValue > 0 ? ((value as number) / totalValue) * 100 : 0,
    }));

    // Calculate volatility if we have snapshots
    let volatility = 0;
    let sharpeRatio = 0;
    if (snapshots.length > 1) {
      const dailyReturns: number[] = [];
      for (let i = 1; i < snapshots.length; i++) {
        const prevValue = snapshots[i - 1].totalValue;
        const currValue = snapshots[i].totalValue;
        const dailyReturn = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : 0;
        dailyReturns.push(dailyReturn);
      }

      const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const squaredDiffs = dailyReturns.map(r => Math.pow(r - avgReturn, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / dailyReturns.length;
      volatility = Math.sqrt(variance);
      sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;
    }

    // Prepare portfolio summary for AI
    const portfolioSummary = {
      totalValue,
      totalReturn,
      holdingsCount: holdingsWithPrices.length,
      sectorAllocation: sectors,
      topHoldings: holdingsWithPrices
        .map(h => ({
          symbol: h.symbol,
          sector: h.sector,
          value: h.value,
          percentage: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
          return: h.cost > 0 ? ((h.value - h.cost) / h.cost) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      metrics: {
        volatility,
        sharpeRatio,
        hasHistoricalData: snapshots.length > 1,
      },
    };

    // Generate optimization suggestions using AI
    if (!OPENAI_API_KEY) {
      console.warn("[Portfolio Optimization] OpenAI API key not configured, using basic rule-based suggestions");
      // Return basic rule-based suggestions if no API key
      return NextResponse.json({
        suggestions: generateBasicSuggestions(portfolioSummary),
        overallScore: calculateBasicScore(portfolioSummary),
        strengths: generateBasicStrengths(portfolioSummary),
        weaknesses: generateBasicWeaknesses(portfolioSummary),
        cached: false,
      });
    }

    console.log(`[Portfolio Optimization] Generating AI-powered suggestions using OpenAI`);

    const prompt = `Analyze this investment portfolio and provide optimization suggestions.

Portfolio Summary:
- Total Value: $${totalValue.toFixed(2)}
- Total Return: ${totalReturn.toFixed(2)}%
- Number of Holdings: ${holdingsWithPrices.length}
- Sharpe Ratio: ${sharpeRatio.toFixed(2)}
- Volatility: ${volatility.toFixed(2)}%

Sector Allocation:
${sectors.map(s => `- ${s.sector}: ${s.percentage.toFixed(1)}%`).join('\n')}

Top Holdings:
${portfolioSummary.topHoldings.map(h => `- ${h.symbol} (${h.sector}): ${h.percentage.toFixed(1)}% of portfolio, ${h.return >= 0 ? '+' : ''}${h.return.toFixed(1)}% return`).join('\n')}

Provide your analysis in JSON format with the following structure:
{
  "overallScore": <number 0-100, where 100 is perfect>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "suggestions": [
    {
      "type": "diversification" | "risk" | "performance" | "rebalancing",
      "priority": "high" | "medium" | "low",
      "title": "<short title>",
      "description": "<detailed explanation>",
      "impact": "<expected impact on portfolio>",
      "actionItems": ["<action 1>", "<action 2>", ...]
    }
  ]
}

Consider:
1. Sector concentration risk (>30% in one sector is high risk)
2. Individual position size risk (>15% in one position is high risk)
3. Diversification across at least 8-12 stocks
4. Risk-adjusted returns (Sharpe ratio)
5. Underperforming positions that may need review
6. Rebalancing opportunities

Provide 3-5 actionable suggestions prioritized by potential impact.`;

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional investment portfolio analyst. Provide practical, actionable advice based on modern portfolio theory and risk management principles. Be specific and constructive.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Portfolio Optimization] OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("[Portfolio Optimization] No response content from OpenAI");
      throw new Error("No response from OpenAI");
    }

    console.log(`[Portfolio Optimization] Successfully received AI analysis`);

    const analysis: PortfolioOptimizationResponse = JSON.parse(content);
    analysis.cached = false;

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[Portfolio Optimization] Error generating portfolio optimization:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error(`[Portfolio Optimization] Error name: ${error.name}`);
      console.error(`[Portfolio Optimization] Error message: ${error.message}`);
      console.error(`[Portfolio Optimization] Error stack: ${error.stack}`);
    }

    return NextResponse.json(
      { error: "Failed to generate optimization suggestions" },
      { status: 500 }
    );
  }
}

// Helper functions for basic rule-based suggestions (fallback)
function generateBasicSuggestions(portfolioSummary: any): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check sector concentration
  const maxSectorAllocation = Math.max(...portfolioSummary.sectorAllocation.map((s: any) => s.percentage));
  if (maxSectorAllocation > 30) {
    const dominantSector = portfolioSummary.sectorAllocation.find((s: any) => s.percentage === maxSectorAllocation);
    suggestions.push({
      type: "diversification",
      priority: "high",
      title: "Reduce Sector Concentration Risk",
      description: `Your portfolio is heavily concentrated in ${dominantSector.sector} (${maxSectorAllocation.toFixed(1)}%). This exposes you to sector-specific risks.`,
      impact: "Reducing concentration would improve risk-adjusted returns and portfolio stability",
      actionItems: [
        `Consider reducing ${dominantSector.sector} allocation to below 25%`,
        "Add positions in underrepresented sectors",
        "Research opportunities in complementary sectors",
      ],
    });
  }

  // Check individual position size
  const maxPosition = Math.max(...portfolioSummary.topHoldings.map((h: any) => h.percentage));
  if (maxPosition > 15) {
    suggestions.push({
      type: "risk",
      priority: "medium",
      title: "Rebalance Oversized Positions",
      description: `Your largest position represents ${maxPosition.toFixed(1)}% of your portfolio, which may be too concentrated.`,
      impact: "Better position sizing reduces single-stock risk",
      actionItems: [
        "Consider trimming positions above 10-12% of portfolio",
        "Use proceeds to increase smaller positions or add new holdings",
      ],
    });
  }

  // Check diversification
  if (portfolioSummary.holdingsCount < 8) {
    suggestions.push({
      type: "diversification",
      priority: "high",
      title: "Increase Portfolio Diversification",
      description: `With only ${portfolioSummary.holdingsCount} holdings, your portfolio may not be adequately diversified.`,
      impact: "More holdings reduce unsystematic risk and improve stability",
      actionItems: [
        "Target 10-15 quality holdings for optimal diversification",
        "Look for stocks in underrepresented sectors",
        "Consider adding international exposure",
      ],
    });
  }

  // Check for underperformers
  const underperformers = portfolioSummary.topHoldings.filter((h: any) => h.return < -10);
  if (underperformers.length > 0) {
    suggestions.push({
      type: "performance",
      priority: "medium",
      title: "Review Underperforming Positions",
      description: `You have ${underperformers.length} position(s) with losses exceeding 10%.`,
      impact: "Addressing underperformers can improve overall returns",
      actionItems: [
        "Reassess investment thesis for each underperforming stock",
        "Consider tax-loss harvesting opportunities",
        "Decide whether to hold, average down, or exit each position",
      ],
    });
  }

  return suggestions;
}

function calculateBasicScore(portfolioSummary: any): number {
  let score = 100;

  // Deduct for sector concentration
  const maxSector = Math.max(...portfolioSummary.sectorAllocation.map((s: any) => s.percentage));
  if (maxSector > 40) score -= 20;
  else if (maxSector > 30) score -= 10;

  // Deduct for position concentration
  const maxPosition = Math.max(...portfolioSummary.topHoldings.map((h: any) => h.percentage));
  if (maxPosition > 20) score -= 15;
  else if (maxPosition > 15) score -= 8;

  // Deduct for lack of diversification
  if (portfolioSummary.holdingsCount < 5) score -= 25;
  else if (portfolioSummary.holdingsCount < 8) score -= 15;

  // Deduct for negative returns
  if (portfolioSummary.totalReturn < -10) score -= 15;
  else if (portfolioSummary.totalReturn < 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function generateBasicStrengths(portfolioSummary: any): string[] {
  const strengths: string[] = [];

  if (portfolioSummary.holdingsCount >= 10) {
    strengths.push("Well-diversified with multiple holdings");
  }

  if (portfolioSummary.totalReturn > 10) {
    strengths.push("Strong overall portfolio performance");
  }

  const maxSector = Math.max(...portfolioSummary.sectorAllocation.map((s: any) => s.percentage));
  if (maxSector < 25) {
    strengths.push("Good sector diversification");
  }

  if (portfolioSummary.sectorAllocation.length >= 5) {
    strengths.push("Exposure across multiple sectors");
  }

  return strengths.length > 0 ? strengths : ["Portfolio established and tracking"];
}

function generateBasicWeaknesses(portfolioSummary: any): string[] {
  const weaknesses: string[] = [];

  const maxSector = Math.max(...portfolioSummary.sectorAllocation.map((s: any) => s.percentage));
  if (maxSector > 30) {
    weaknesses.push("High concentration in single sector");
  }

  if (portfolioSummary.holdingsCount < 8) {
    weaknesses.push("Limited diversification");
  }

  const maxPosition = Math.max(...portfolioSummary.topHoldings.map((h: any) => h.percentage));
  if (maxPosition > 15) {
    weaknesses.push("Large individual position sizes");
  }

  if (portfolioSummary.totalReturn < 0) {
    weaknesses.push("Negative portfolio returns");
  }

  return weaknesses.length > 0 ? weaknesses : ["Room for optimization"];
}
