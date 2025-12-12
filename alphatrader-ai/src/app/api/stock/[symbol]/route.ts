import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuote, getHistoricalData } from "@/lib/api/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();

    // Check cache first
    const cachedData = await prisma.stockCache.findUnique({
      where: { symbol: symbolUpper },
    });

    const now = new Date();
    const cacheAge = cachedData ? now.getTime() - cachedData.lastUpdated.getTime() : Infinity;
    const isCacheValid = cacheAge < 300000; // 5 minutes

    if (cachedData && isCacheValid) {
      return NextResponse.json({
        symbol: cachedData.symbol,
        name: cachedData.name,
        exchange: cachedData.exchange,
        sector: cachedData.sector,
        industry: cachedData.industry,
        currentPrice: cachedData.currentPrice,
        previousClose: cachedData.previousClose,
        open: cachedData.open,
        dayHigh: cachedData.dayHigh,
        dayLow: cachedData.dayLow,
        volume: cachedData.volume,
        marketCap: cachedData.marketCap,
        peRatio: cachedData.peRatio,
        dividendYield: cachedData.dividendYield,
        week52High: cachedData.week52High,
        week52Low: cachedData.week52Low,
        beta: cachedData.beta,
        eps: cachedData.eps,
        profitMargin: cachedData.profitMargin,
        debtToEquity: cachedData.debtToEquity,
        isShariahCompliant: cachedData.isShariahCompliant,
        lastUpdated: cachedData.lastUpdated,
      });
    }

    // Fetch fresh data from Yahoo Finance
    const quote = await getQuote(symbolUpper);

    if (!quote) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Update cache
    const stockData = {
      symbol: symbolUpper,
      name: quote.longName || quote.shortName || symbolUpper,
      exchange: quote.exchange || null,
      sector: quote.sector || null,
      industry: quote.industry || null,
      currentPrice: quote.regularMarketPrice || null,
      previousClose: quote.regularMarketPreviousClose || null,
      open: quote.regularMarketOpen || null,
      dayHigh: quote.regularMarketDayHigh || null,
      dayLow: quote.regularMarketDayLow || null,
      volume: quote.regularMarketVolume || null,
      avgVolume: (quote as any).averageDailyVolume10Day || quote.averageVolume || null,
      marketCap: quote.marketCap || null,
      peRatio: quote.trailingPE || null,
      forwardPE: quote.forwardPE || null,
      dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
      dividendRate: (quote as any).dividendRate || null,
      beta: quote.beta || null,
      week52High: quote.fiftyTwoWeekHigh || null,
      week52Low: quote.fiftyTwoWeekLow || null,
      eps: (quote as any).trailingEps || (quote as any).epsTrailingTwelveMonths || null,
      profitMargin: (quote as any).profitMargins ? (quote as any).profitMargins * 100 : null,
      debtToEquity: (quote as any).debtToEquity || null,
      lastUpdated: new Date(),
    };

    await prisma.stockCache.upsert({
      where: { symbol: symbolUpper },
      update: stockData,
      create: stockData,
    });

    return NextResponse.json(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
