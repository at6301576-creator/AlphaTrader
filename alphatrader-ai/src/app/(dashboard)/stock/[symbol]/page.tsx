import { notFound } from "next/navigation";
import { getStockSummary, getHistoricalData, calculateTechnicalIndicators } from "@/lib/api/yahoo-finance";
import { getCompanyNews } from "@/lib/api/finnhub";
import { screenShariahCompliance } from "@/services/shariah-screener";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/analysis/StockChart";
import { TechnicalPanel } from "@/components/analysis/TechnicalPanel";
import { FundamentalsPanel } from "@/components/analysis/FundamentalsPanel";
import { ShariahPanel } from "@/components/analysis/ShariahPanel";
import { NewsSection } from "@/components/stock/NewsSection";
import { AIAnalysis } from "@/components/stock/AIAnalysis";
import { AnalystRatings } from "@/components/stock/AnalystRatings";
import { StockPageActions } from "@/components/stock/StockPageActions";
import { CreateTechnicalAlertDialog } from "@/components/alerts/CreateTechnicalAlertDialog";
import { TechnicalAlertsList } from "@/components/alerts/TechnicalAlertsList";
import { NewsSentimentCard } from "@/components/stock/NewsSentimentCard";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { Stock } from "@/types/stock";

interface StockPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

async function getStockData(symbol: string) {
  try {
    // Fetch stock data and news in parallel
    const [summary, historicalData, news] = await Promise.all([
      getStockSummary(symbol),
      getHistoricalData(symbol, "1y", "1d"),
      getCompanyNews(symbol), // Last 7 days by default
    ]);

    if (!summary) {
      return null;
    }

    // Calculate technical indicators
    const technicalIndicators = historicalData.length > 0
      ? calculateTechnicalIndicators(historicalData)
      : null;

    // Type the summary data with proper assertions
    const profile = summary.profile as any;
    const financials = summary.financials as any;
    const keyStats = summary.keyStats as any;
    const details = summary.details as any;

    // Perform Shariah screening
    const shariahDetails = screenShariahCompliance(
      {
        sector: profile?.sector,
        industry: profile?.industry,
        businessSummary: profile?.longBusinessSummary,
      },
      {
        marketCap: summary.quote.marketCap,
        totalDebt: financials?.totalDebt,
        totalEquity: keyStats?.bookValue,
        totalAssets: financials?.totalAssets,
        cash: financials?.totalCash,
        shortTermInvestments: financials?.cashAndCashEquivalents,
        accountsReceivable: financials?.accountsReceivable,
        totalRevenue: financials?.totalRevenue,
        interestIncome: financials?.interestExpense || 0,
        interestExpense: financials?.interestExpense || 0,
      }
    );

    // Map to Stock type
    const stock: Stock = {
      id: symbol.toUpperCase(),
      symbol: symbol.toUpperCase(),
      name: summary.quote.longName || summary.quote.shortName || null,
      exchange: summary.quote.exchange || null,
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      country: profile?.country || null,
      currency: summary.quote.currency || "USD",
      currentPrice: summary.quote.regularMarketPrice || null,
      previousClose: summary.quote.regularMarketPreviousClose || null,
      open: summary.quote.regularMarketOpen || null,
      dayHigh: summary.quote.regularMarketDayHigh || null,
      dayLow: summary.quote.regularMarketDayLow || null,
      volume: summary.quote.regularMarketVolume || null,
      avgVolume: summary.quote.averageVolume || null,
      marketCap: summary.quote.marketCap || null,
      peRatio: summary.quote.trailingPE || null,
      forwardPE: summary.quote.forwardPE || null,
      pbRatio: summary.quote.priceToBook || null,
      psRatio: keyStats?.priceToSalesTrailing12Months || null,
      pegRatio: keyStats?.pegRatio || null,
      dividendYield: summary.quote.dividendYield ? summary.quote.dividendYield * 100 : null,
      dividendRate: details?.dividendRate || null,
      payoutRatio: details?.payoutRatio || null,
      beta: summary.quote.beta || null,
      week52High: summary.quote.fiftyTwoWeekHigh || null,
      week52Low: summary.quote.fiftyTwoWeekLow || null,
      eps: summary.quote.epsTrailingTwelveMonths || null,
      // Additional fields from summary
      profitMargin: financials?.profitMargins || null,
      operatingMargin: financials?.operatingMargins || null,
      roe: financials?.returnOnEquity || null,
      roa: financials?.returnOnAssets || null,
      debtToEquity: financials?.debtToEquity || null,
      currentRatio: financials?.currentRatio || null,
      quickRatio: financials?.quickRatio || null,
      freeCashFlow: financials?.freeCashflow || null,
      revenueGrowth: financials?.revenueGrowth || null,
      earningsGrowth: financials?.earningsGrowth || null,
      // Shariah compliance
      isShariahCompliant: shariahDetails.overallStatus === "compliant",
      shariahDetails: shariahDetails,
      technicalData: technicalIndicators,
      fundamentalData: null,
      chartData: historicalData,
      lastUpdated: new Date(),
    };

    return {
      stock,
      historicalData,
      technicalIndicators,
      shariahDetails,
      news,
      profile: summary.profile,
      financials: summary.financials,
      keyStats: summary.keyStats,
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    return null;
  }
}

export default async function StockPage({ params }: StockPageProps) {
  const { symbol } = await params;
  const data = await getStockData(symbol);

  if (!data) {
    notFound();
  }

  const { stock, historicalData, technicalIndicators, shariahDetails, news } = data;

  const priceChange = stock.currentPrice && stock.previousClose
    ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
    : 0;

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: stock.currency || "USD",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/scanner">
          <Button variant="ghost" size="sm" className="hover:bg-gray-800 hover:text-emerald-400 transition-all duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
        </Link>
        <StockPageActions symbol={stock.symbol} currentPrice={stock.currentPrice} />
      </div>

      {/* Stock Header */}
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                {stock.exchange && (
                  <Badge variant="outline" className="text-gray-400 border-gray-700">
                    {stock.exchange}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-gray-400 mb-2">{stock.name}</p>
              <div className="flex flex-wrap gap-2">
                {stock.sector && (
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 transition-colors duration-300">
                    {stock.sector}
                  </Badge>
                )}
                {stock.industry && (
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 transition-colors duration-300">
                    {stock.industry}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-4xl font-bold mb-1">
                {formatPrice(stock.currentPrice)}
              </div>
              <div
                className={`flex items-center justify-start md:justify-end text-lg ${
                  priceChange >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {priceChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart and Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <div className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <StockChart
              symbol={stock.symbol}
              data={historicalData}
            />
          </div>

          {/* Technical Analysis */}
          {technicalIndicators && (
            <div className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
              <TechnicalPanel
                technicals={technicalIndicators}
              />
            </div>
          )}

          {/* Fundamentals */}
          <div className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <FundamentalsPanel stock={stock} />
          </div>

          {/* News Section */}
          <div className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <NewsSection news={news} symbol={stock.symbol} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Analyst Ratings */}
          <div className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <AnalystRatings symbol={stock.symbol} currentPrice={stock.currentPrice} />
          </div>

          {/* News Sentiment Analysis */}
          <div className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '250ms', animationFillMode: 'backwards' }}>
            <NewsSentimentCard symbol={stock.symbol} days={7} />
          </div>

          {/* Shariah Compliance */}
          <div className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <ShariahPanel details={shariahDetails} />
          </div>

          {/* AI Analysis */}
          <div className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <AIAnalysis symbol={stock.symbol} />
          </div>

          {/* Technical Alerts */}
          <div className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Technical Alerts</CardTitle>
                  <CreateTechnicalAlertDialog
                    symbol={stock.symbol}
                    companyName={stock.name || undefined}
                    trigger={
                      <Button size="sm" variant="outline" className="text-xs">
                        Create Alert
                      </Button>
                    }
                  />
                </div>
                <CardDescription>
                  Active alerts for {stock.symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TechnicalAlertsList symbol={stock.symbol} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
