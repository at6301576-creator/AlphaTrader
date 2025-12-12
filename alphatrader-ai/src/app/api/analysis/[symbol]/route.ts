import { NextRequest, NextResponse } from "next/server";
import {
  getQuote,
  getStockSummary,
  getHistoricalData,
  calculateTechnicalIndicators,
  mapQuoteToStock,
  type QuoteResult,
} from "@/lib/api/yahoo-finance";
import { screenShariahCompliance, type CompanyProfile, type FinancialData } from "@/services/shariah-screener";
import type { Stock, TechnicalIndicators } from "@/types/stock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Fetch all data in parallel
    const [quote, summary, chartData] = await Promise.all([
      getQuote(symbol),
      getStockSummary(symbol),
      getHistoricalData(symbol, "1y", "1d"),
    ]);

    if (!quote) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Calculate technical indicators
    const technicals = calculateTechnicalIndicators(chartData);

    // Build stock object
    const stockBase = mapQuoteToStock(quote);

    // Extract additional data from summary
    const profile = summary?.profile as { sector?: string; industry?: string; country?: string } | undefined;
    const financials = summary?.financials as {
      profitMargins?: number;
      operatingMargins?: number;
      returnOnEquity?: number;
      returnOnAssets?: number;
      debtToEquity?: number;
      currentRatio?: number;
      quickRatio?: number;
      freeCashFlow?: number;
      revenueGrowth?: number;
      earningsGrowth?: number;
    } | undefined;
    const keyStats = summary?.keyStats as {
      pegRatio?: number;
      enterpriseValue?: number;
      forwardPE?: number;
      priceToBook?: number;
    } | undefined;

    // Perform Shariah screening
    let shariahDetails = null;
    let isShariahCompliant = null;

    if (profile && financials) {
      const companyProfile: CompanyProfile = {
        sector: profile.sector,
        industry: profile.industry,
        businessSummary: undefined,
      };

      const financialData: FinancialData = {
        totalDebt: 0, // Would need from balance sheet
        totalAssets: 0, // Would need from balance sheet
        totalEquity: quote.marketCap || 0, // Using market cap as proxy
        interestIncome: 0, // Would need from income statement
        totalRevenue: 0, // Would need from income statement
        accountsReceivable: 0, // Would need from balance sheet
        cash: 0, // Would need from balance sheet
        shortTermInvestments: 0, // Would need from balance sheet
      };

      shariahDetails = screenShariahCompliance(companyProfile, financialData);
      isShariahCompliant = shariahDetails.overallStatus === "compliant";
    }

    const stock: Stock = {
      id: symbol,
      symbol: symbol,
      name: stockBase.name || null,
      exchange: stockBase.exchange || null,
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      country: profile?.country || null,
      currency: stockBase.currency || "USD",
      currentPrice: stockBase.currentPrice || null,
      previousClose: stockBase.previousClose || null,
      open: stockBase.open || null,
      dayHigh: stockBase.dayHigh || null,
      dayLow: stockBase.dayLow || null,
      volume: stockBase.volume || null,
      avgVolume: stockBase.avgVolume || null,
      priceChange: quote.regularMarketChange || undefined,
      priceChangePercent: quote.regularMarketChangePercent || undefined,
      marketCap: stockBase.marketCap || null,
      peRatio: stockBase.peRatio || null,
      forwardPE: stockBase.forwardPE || null,
      pbRatio: stockBase.pbRatio || null,
      psRatio: null,
      pegRatio: keyStats?.pegRatio || null,
      dividendYield: stockBase.dividendYield || null,
      dividendRate: null,
      payoutRatio: null,
      beta: stockBase.beta || null,
      week52High: stockBase.week52High || null,
      week52Low: stockBase.week52Low || null,
      eps: null,
      revenueGrowth: financials?.revenueGrowth || null,
      earningsGrowth: financials?.earningsGrowth || null,
      profitMargin: financials?.profitMargins || null,
      operatingMargin: financials?.operatingMargins || null,
      roe: financials?.returnOnEquity || null,
      roa: financials?.returnOnAssets || null,
      debtToEquity: financials?.debtToEquity || null,
      currentRatio: financials?.currentRatio || null,
      quickRatio: financials?.quickRatio || null,
      freeCashFlow: financials?.freeCashFlow || null,
      isShariahCompliant,
      shariahDetails,
      technicalData: technicals,
      fundamentalData: null,
      chartData,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      stock,
      chartData,
      technicals,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock analysis" },
      { status: 500 }
    );
  }
}
