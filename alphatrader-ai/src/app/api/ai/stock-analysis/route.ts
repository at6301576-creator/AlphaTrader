import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIService, type AIMessage } from "@/lib/ai";
import { getQuote } from "@/lib/api/stock-data";
import * as finnhub from "@/lib/api/finnhub";
import { getHistoricalData } from "@/lib/api/yahoo-finance";
// import { calculateAllIndicators } from "@/lib/technical-indicators"; // TODO: Implement this function

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Fetch stock data
    const [quote, profile, historicalData, news] = await Promise.all([
      getQuote(symbol),
      finnhub.mapFinnhubToStock(symbol),
      getHistoricalData(symbol, '1y', '1d'),
      finnhub.getCompanyNews(symbol),
    ]);

    if (!quote || !profile) {
      return NextResponse.json(
        { error: "Stock data not found" },
        { status: 404 }
      );
    }

    // Calculate technical indicators
    let technicalIndicators: any = null;
    if (historicalData && historicalData.length > 0) {
      const ohlcv = {
        closes: historicalData.map(c => c.close),
        highs: historicalData.map(c => c.high),
        lows: historicalData.map(c => c.low),
        volumes: historicalData.map(c => c.volume),
      };
      // TODO: Implement calculateAllIndicators function
      // technicalIndicators = calculateAllIndicators(ohlcv);
    }

    // Get recent news headlines
    const recentNews = news.slice(0, 5).map(n => ({
      headline: n.title,
      sentiment: n.sentiment,
      date: new Date(n.publishedAt).toLocaleDateString(),
    }));

    // Build comprehensive analysis prompt
    const prompt = `Analyze ${symbol} (${profile.name || symbol}):

Current Market Data:
- Price: $${profile.currentPrice?.toFixed(2)} (${profile.previousClose ? `${((profile.currentPrice! - profile.previousClose) / profile.previousClose * 100).toFixed(2)}%` : 'N/A'})
- Market Cap: ${formatMarketCap(profile.marketCap || 0)}
- Volume: ${formatNumber(profile.volume || 0)} (Avg: ${formatNumber(profile.avgVolume || 0)})
- 52-Week Range: $${profile.week52Low?.toFixed(2)} - $${profile.week52High?.toFixed(2)}

Fundamental Metrics:
- P/E Ratio: ${profile.peRatio?.toFixed(2) || 'N/A'}
- P/B Ratio: ${profile.pbRatio?.toFixed(2) || 'N/A'}
- EPS: $${profile.eps?.toFixed(2) || 'N/A'}
- Dividend Yield: ${profile.dividendYield?.toFixed(2) || '0'}%
- Beta: ${profile.beta?.toFixed(2) || 'N/A'}

${technicalIndicators ? `Technical Analysis:
RSI (14): ${technicalIndicators.rsi14?.toFixed(1) || 'N/A'} ${getRSISignal(technicalIndicators.rsi14)}
MACD: ${technicalIndicators.macd ? `${technicalIndicators.macd.trend} (Histogram: ${technicalIndicators.macd.histogram.toFixed(2)})` : 'N/A'}
Moving Averages:
  - SMA 20: $${technicalIndicators.movingAverages.sma20?.toFixed(2) || 'N/A'}
  - SMA 50: $${technicalIndicators.movingAverages.sma50?.toFixed(2) || 'N/A'}
  - SMA 200: $${technicalIndicators.movingAverages.sma200?.toFixed(2) || 'N/A'}
Bollinger Bands: ${technicalIndicators.bollingerBands ? `$${technicalIndicators.bollingerBands.lower.toFixed(2)} - $${technicalIndicators.bollingerBands.upper.toFixed(2)}` : 'N/A'}
Stochastic: ${technicalIndicators.stochastic ? `${technicalIndicators.stochastic.k.toFixed(1)} (${technicalIndicators.stochastic.signal})` : 'N/A'}
ATR (14): ${technicalIndicators.atr14?.toFixed(2) || 'N/A'}
Trend: Short-term ${technicalIndicators.trend.shortTerm}, Medium-term ${technicalIndicators.trend.mediumTerm}, Long-term ${technicalIndicators.trend.longTerm}
Support Levels: ${technicalIndicators.supportResistance.support.map((s: number) => `$${s.toFixed(2)}`).join(', ') || 'N/A'}
Resistance Levels: ${technicalIndicators.supportResistance.resistance.map((r: number) => `$${r.toFixed(2)}`).join(', ') || 'N/A'}
` : ''}
Recent News:
${recentNews.length > 0 ? recentNews.map(n => `- ${n.headline} (${n.date})${n.sentiment ? ` [${n.sentiment}]` : ''}`).join('\n') : 'No recent news available'}

Please provide a comprehensive analysis covering:
1. Technical Outlook: Key price levels, momentum, and short-term direction
2. Fundamental Health: Valuation, financial strength, and growth potential
3. News Sentiment: Impact of recent developments
4. Risk Assessment: Key concerns and catalysts
5. Overall Rating: Bullish/Bearish/Neutral with confidence level

Be specific and actionable while maintaining professional disclaimer.`;

    const aiService = getAIService();

    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are AlphaTrader AI, an expert stock analyst combining technical analysis, fundamental analysis, and news sentiment. Provide clear, data-driven insights. Always include appropriate risk disclaimers. This is educational analysis, not financial advice.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await aiService.chat(messages, { temperature: 0.7, maxTokens: 2000 });

    return NextResponse.json({
      analysis: response.content,
      stockData: {
        symbol: symbol.toUpperCase(),
        name: profile.name,
        price: profile.currentPrice,
        change: profile.previousClose ? ((profile.currentPrice! - profile.previousClose) / profile.previousClose * 100) : null,
      },
      technicalIndicators,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error("Stock analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate stock analysis" },
      { status: 500 }
    );
  }
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

function getRSISignal(rsi: number | null): string {
  if (!rsi) return '';
  if (rsi > 70) return '(Overbought)';
  if (rsi < 30) return '(Oversold)';
  return '(Neutral)';
}
