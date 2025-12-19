import { notFound } from "next/navigation";
import { getStockSummary, getHistoricalData, calculateTechnicalIndicators } from "@/lib/api/yahoo-finance";
import { getCompanyNews } from "@/lib/api/finnhub";
import { screenShariahCompliance } from "@/services/shariah-screener";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StockChartLazy as StockChart } from "@/components/analysis/StockChartLazy";
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
  BarChart3,
  LineChart,
  Newspaper,
  Bell,
  Info,
  ShieldCheck,
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
              <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{stock.symbol}</h1>
                {stock.exchange && (
                  <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs sm:text-sm">
                    {stock.exchange}
                  </Badge>
                )}
                {shariahDetails && (
                  <Badge
                    variant="outline"
                    className={`font-semibold text-xs sm:text-sm ${
                      shariahDetails.overallStatus === "compliant"
                        ? "text-emerald-400 border-emerald-700 bg-emerald-950/30"
                        : shariahDetails.overallStatus === "non-compliant"
                        ? "text-red-400 border-red-700 bg-red-950/30"
                        : "text-yellow-400 border-yellow-700 bg-yellow-950/30"
                    }`}
                  >
                    {shariahDetails.overallStatus === "compliant" ? "✓ Shariah Compliant" :
                     shariahDetails.overallStatus === "non-compliant" ? "✗ Not Shariah Compliant" :
                     "⚠ Doubtful"}
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
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                {formatPrice(stock.currentPrice)}
              </div>
              <div
                className={`flex items-center justify-start md:justify-end text-base sm:text-lg ${
                  priceChange >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                )}
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="w-full bg-gray-900 border border-gray-800 rounded-lg p-1 overflow-x-auto">
          <TooltipProvider>
            <TabsList className="bg-transparent w-auto inline-flex gap-1 min-w-min">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">Overview</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stock overview and quick metrics</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="technical" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <LineChart className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">Technical</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Technical indicators and chart analysis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="fundamentals" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">Fundamentals</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Financial statements and key metrics</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="news" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <Newspaper className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">News</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Latest news and sentiment analysis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="alerts" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">Alerts</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set up price and technical alerts</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="shariah" className="data-[state=active]:bg-emerald-600 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:block">Shariah</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shariah compliance screening and details</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </TooltipProvider>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Full Width Chart */}
          <StockChart
            symbol={stock.symbol}
            data={historicalData}
          />

          {/* Two Column Layout for Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Key Metrics */}
              {technicalIndicators && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Quick Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Signal</div>
                        <div className={`font-bold text-lg ${
                          technicalIndicators.overallSignal.includes("buy") ? "text-green-500" :
                          technicalIndicators.overallSignal.includes("sell") ? "text-red-500" :
                          "text-yellow-500"
                        }`}>
                          {technicalIndicators.overallSignal.replace("_", " ").toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">RSI (14)</div>
                        <div className="font-bold text-lg text-white">
                          {technicalIndicators.rsi?.toFixed(1) || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">ATR</div>
                        <div className="font-bold text-lg text-white">
                          ${technicalIndicators.atr?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">ADX</div>
                        <div className="font-bold text-lg text-white">
                          {technicalIndicators.adx?.toFixed(1) || "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <AnalystRatings symbol={stock.symbol} currentPrice={stock.currentPrice} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <NewsSentimentCard symbol={stock.symbol} days={7} />
              <AIAnalysis symbol={stock.symbol} />
            </div>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <StockChart
                symbol={stock.symbol}
                data={historicalData}
              />
            </div>
            {technicalIndicators && (
              <div className="lg:col-span-3">
                <TechnicalPanel technicals={technicalIndicators} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FundamentalsPanel stock={stock} />
            </div>
            <div className="space-y-6">
              <AnalystRatings symbol={stock.symbol} currentPrice={stock.currentPrice} />
            </div>
          </div>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NewsSection news={news} symbol={stock.symbol} />
            </div>
            <div>
              <NewsSentimentCard symbol={stock.symbol} days={7} />
            </div>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Technical Alerts</CardTitle>
                  <CardDescription>
                    Set up and manage alerts for technical indicator conditions
                  </CardDescription>
                </div>
                <CreateTechnicalAlertDialog
                  symbol={stock.symbol}
                  companyName={stock.name || undefined}
                  trigger={
                    <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                      <Bell className="h-4 w-4 mr-2" />
                      Create Alert
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <TechnicalAlertsList symbol={stock.symbol} />
            </CardContent>
          </Card>

          {/* Alert Guide */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Alert Types</CardTitle>
              <CardDescription>Available technical indicator alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-white">RSI Alerts</div>
                  <div className="text-gray-400">Get notified when RSI crosses overbought (70) or oversold (30) levels</div>
                </div>
                <div>
                  <div className="font-semibold text-white">MACD Crossover</div>
                  <div className="text-gray-400">Alert on bullish or bearish MACD crossovers</div>
                </div>
                <div>
                  <div className="font-semibold text-white">Moving Average Crossover</div>
                  <div className="text-gray-400">Golden Cross (bullish) or Death Cross (bearish) signals</div>
                </div>
                <div>
                  <div className="font-semibold text-white">Bollinger Bands</div>
                  <div className="text-gray-400">Price breaking above upper band or below lower band</div>
                </div>
                <div>
                  <div className="font-semibold text-white">Stochastic</div>
                  <div className="text-gray-400">Overbought/oversold conditions and crossover signals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shariah Tab */}
        <TabsContent value="shariah" className="space-y-6">
          <ShariahPanel details={shariahDetails} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
