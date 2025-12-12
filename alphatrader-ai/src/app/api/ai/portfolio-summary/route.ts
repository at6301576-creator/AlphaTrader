import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIService, type AIMessage } from "@/lib/ai";
import { getQuotes } from "@/lib/api/stock-data";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch user's portfolio
    const portfolioItems = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    if (!portfolioItems || portfolioItems.length === 0) {
      return NextResponse.json(
        { error: "No portfolio holdings found" },
        { status: 400 }
      );
    }

    // Fetch current prices
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = await getQuotes(symbols);

    // Calculate portfolio metrics
    let totalValue = 0;
    let totalCost = 0;
    const holdings = portfolioItems.map((holding) => {
      const quote = quotes.find((q) => q.symbol === holding.symbol);
      const currentPrice = quote?.currentPrice || holding.avgCost;
      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      totalValue += value;
      totalCost += costBasis;

      return {
        symbol: holding.symbol,
        name: quote?.name || holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        value,
        gain,
        gainPercent,
        sector: quote?.sector || 'Unknown',
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Group by sector
    const sectorBreakdown: Record<string, { value: number; count: number }> = {};
    holdings.forEach((h) => {
      if (!sectorBreakdown[h.sector]) {
        sectorBreakdown[h.sector] = { value: 0, count: 0 };
      }
      sectorBreakdown[h.sector].value += h.value;
      sectorBreakdown[h.sector].count += 1;
    });

    // Build AI prompt
    const prompt = `Analyze this investment portfolio:

Portfolio Overview:
- Total Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Cost: $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Gain/Loss: $${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%)
- Number of Holdings: ${holdings.length}

Holdings:
${holdings.map((h, i) => `${i + 1}. ${h.symbol} (${h.name})
   - Position Value: $${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
   - Shares: ${h.shares} @ $${h.avgCost.toFixed(2)}
   - Current Price: $${h.currentPrice.toFixed(2)}
   - Gain/Loss: $${h.gain.toFixed(2)} (${h.gainPercent >= 0 ? '+' : ''}${h.gainPercent.toFixed(2)}%)
   - Sector: ${h.sector}`).join('\n\n')}

Sector Diversification:
${Object.entries(sectorBreakdown).map(([sector, data]) =>
  `- ${sector}: $${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${((data.value / totalValue) * 100).toFixed(1)}%) - ${data.count} ${data.count === 1 ? 'position' : 'positions'}`
).join('\n')}

Please provide a concise portfolio analysis covering:
1. Overall portfolio performance assessment
2. Diversification analysis (sector concentration, risks)
3. Top performers and underperformers
4. Key risks and opportunities
5. Brief recommendations for portfolio optimization

Keep the analysis practical and actionable.`;

    const aiService = getAIService();

    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are AlphaTrader AI, an expert portfolio analyst. Provide clear, actionable insights about investment portfolios. Focus on risk management, diversification, and practical recommendations. Always include a disclaimer that this is educational analysis, not financial advice.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await aiService.chat(messages, { temperature: 0.7, maxTokens: 1500 });

    return NextResponse.json({
      summary: response.content,
      portfolioMetrics: {
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        holdingsCount: holdings.length,
      },
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error("Portfolio summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate portfolio summary" },
      { status: 500 }
    );
  }
}
