import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Radar,
  Wallet,
  Eye,
  ArrowRight,
  BarChart3,
  Sparkles,
  Clock,
  Activity,
} from "lucide-react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getQuotes } from "@/lib/api/stock-data";
import { MarketStatus } from "@/components/MarketStatus";

async function getDashboardData(userId: string) {
  // Return empty data structure if no userId
  if (!userId) {
    return {
      portfolio: {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        positionsCount: 0,
        performance: [],
        sectors: [],
      },
      watchlists: {
        count: 0,
        totalStocks: 0,
        recentStocks: [],
      },
      market: {
        topGainers: [],
        topLosers: [],
        movers: [],
      },
      activity: {
        recentScans: [],
      },
    };
  }

  try {
    // Fetch all user data in parallel
    const [portfolioItems, watchlists, recentScans] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.watchlist.findMany({
        where: { userId },
      }),
      prisma.scanHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Get current prices for portfolio
    const symbols = portfolioItems.map((h) => h.symbol);
    const quotes = symbols.length > 0 ? await getQuotes(symbols) : [];

    // Calculate portfolio metrics with current prices
    let totalValue = 0;
    let totalCost = 0;
    const performanceData: Array<{
      symbol: string;
      name: string | null;
      shares: number;
      avgCost: number;
      currentPrice: number;
      value: number;
      gain: number;
      gainPercent: number;
      sector: string | null;
    }> = [];

    const sectorAllocations = new Map<string, { value: number; count: number }>();

    portfolioItems.forEach((holding) => {
      const quote = quotes.find((q) => q.symbol === holding.symbol);
      const currentPrice = quote?.currentPrice || holding.avgCost;
      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      totalValue += value;
      totalCost += costBasis;

      const sector = quote?.sector || "Unknown";
      const existing = sectorAllocations.get(sector) || { value: 0, count: 0 };
      sectorAllocations.set(sector, {
        value: existing.value + value,
        count: existing.count + 1,
      });

      performanceData.push({
        symbol: holding.symbol,
        name: quote?.name || null,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        value,
        gain,
        gainPercent,
        sector,
      });
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Format sector allocations
    const sectors = Array.from(sectorAllocations.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      positionsCount: data.count,
    }));

    // Get watchlist stocks
    const watchlistStocks: Array<{
      symbol: string;
      name: string | null;
      currentPrice: number | null;
      change: number | null;
      changePercent: number | null;
      watchlistName: string;
    }> = [];

    for (const watchlist of watchlists.slice(0, 3)) {
      try {
        const symbolsArray = JSON.parse(watchlist.symbols);
        if (Array.isArray(symbolsArray) && symbolsArray.length > 0) {
          const watchlistQuotes = await getQuotes(symbolsArray.slice(0, 5));
          watchlistQuotes.forEach((quote) => {
            const change =
              quote.currentPrice && quote.previousClose
                ? quote.currentPrice - quote.previousClose
                : null;
            const changePercent =
              change && quote.previousClose
                ? (change / quote.previousClose) * 100
                : null;

            watchlistStocks.push({
              symbol: quote.symbol || "",
              name: quote.name || null,
              currentPrice: quote.currentPrice || null,
              change,
              changePercent,
              watchlistName: watchlist.name,
            });
          });
        }
      } catch (error) {
        console.error(`Error parsing watchlist ${watchlist.id}:`, error);
      }
    }

    // Get market movers - fetch live data for popular stocks
    let topGainers: any[] = [];
    let topLosers: any[] = [];
    let marketMovers: any[] = [];

    try {
      // Popular US stocks to check for market movers
      const popularSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
        'JPM', 'V', 'WMT', 'JNJ', 'PG', 'MA', 'HD', 'CVX', 'LLY', 'ABBV',
        'MRK', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'NFLX', 'ADBE',
        'CSCO', 'ACN', 'TXN', 'AMD', 'INTC', 'QCOM', 'HON', 'UPS', 'SBUX'
      ];

      const marketQuotes = await getQuotes(popularSymbols);

      marketMovers = marketQuotes
        .filter((q) => q.currentPrice && q.previousClose)
        .map((q) => {
          const change = q.currentPrice! - q.previousClose!;
          const changePercent = (change / q.previousClose!) * 100;
          return {
            symbol: q.symbol || '',
            name: q.name || '',
            currentPrice: q.currentPrice,
            change,
            changePercent,
            volume: q.volume,
          };
        })
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

      topGainers = marketMovers
        .filter((m) => m.changePercent > 0)
        .slice(0, 5);

      topLosers = marketMovers
        .filter((m) => m.changePercent < 0)
        .slice(0, 5);
    } catch (error) {
      console.error("Error fetching market movers:", error);
    }

    return {
      portfolio: {
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        positionsCount: portfolioItems.length,
        performance: performanceData,
        sectors,
      },
      watchlists: {
        count: watchlists.length,
        totalStocks: watchlists.reduce((sum, w) => {
          try {
            const symbols = JSON.parse(w.symbols);
            return sum + (Array.isArray(symbols) ? symbols.length : 0);
          } catch {
            return sum;
          }
        }, 0),
        recentStocks: watchlistStocks.slice(0, 10),
      },
      market: {
        topGainers,
        topLosers,
        movers: marketMovers,
      },
      activity: {
        recentScans: recentScans.map((scan) => ({
          id: scan.id,
          scanType: scan.scanType,
          resultsCount: scan.resultsCount,
          createdAt: scan.createdAt,
          markets: scan.markets,
        })),
      },
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dashboardData = await getDashboardData(session.user.id);

  const portfolio = dashboardData?.portfolio || {
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    totalGainPercent: 0,
    positionsCount: 0,
    performance: [],
    sectors: [],
  };

  const watchlists = dashboardData?.watchlists || {
    count: 0,
    totalStocks: 0,
    recentStocks: [],
  };

  const market = dashboardData?.market || {
    topGainers: [],
    topLosers: [],
    movers: [],
  };

  const activity = dashboardData?.activity || {
    recentScans: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0] || "Trader"}!
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Here&apos;s what&apos;s happening with your investments today.
            <MarketStatus />
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/scanner">
            <Button className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/50 transition-all duration-300">
              <Radar className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="bg-card border-border hover:border-emerald-700/50 hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Portfolio Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold group-hover:text-emerald-400 transition-colors duration-300">
              ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${portfolio.totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {portfolio.totalGainPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {portfolio.totalGainPercent >= 0 ? '+' : ''}{portfolio.totalGainPercent.toFixed(2)}% (${portfolio.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border hover:border-blue-700/50 hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Positions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold group-hover:text-blue-400 transition-colors duration-300">{portfolio.positionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">
              Active holdings
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border hover:border-purple-700/50 hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Watchlist
            </CardTitle>
            <Eye className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold group-hover:text-purple-400 transition-colors duration-300">{watchlists.totalStocks}</div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">
              across {watchlists.count} list{watchlists.count !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-border hover:border-amber-700/50 hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Recent Scans
            </CardTitle>
            <Radar className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold group-hover:text-amber-400 transition-colors duration-300">{activity.recentScans.length}</div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">
              in the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Heatmap and Sector Allocation */}
      {portfolio.performance.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Heatmap */}
          <Card className="bg-card border-border hover:border-border/70 transition-all duration-300 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Performance Heatmap
              </CardTitle>
              <CardDescription>Visual breakdown of position performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {portfolio.performance.map((position: any) => {
                  const getColor = (percent: number) => {
                    if (percent >= 20) return "bg-emerald-600 hover:bg-emerald-500";
                    if (percent >= 10) return "bg-emerald-700 hover:bg-emerald-600";
                    if (percent >= 5) return "bg-emerald-800 hover:bg-emerald-700";
                    if (percent > 0) return "bg-emerald-900 hover:bg-emerald-800";
                    if (percent > -5) return "bg-red-900 hover:bg-red-800";
                    if (percent > -10) return "bg-red-800 hover:bg-red-700";
                    if (percent > -20) return "bg-red-700 hover:bg-red-600";
                    return "bg-red-600 hover:bg-red-500";
                  };

                  return (
                    <Link key={position.symbol} href={`/stock/${position.symbol}`}>
                      <div
                        className={`${getColor(position.gainPercent)} p-3 rounded-lg transition-all duration-300 cursor-pointer group relative`}
                        title={`${position.symbol}: ${position.gainPercent >= 0 ? '+' : ''}${position.gainPercent.toFixed(2)}%`}
                      >
                        <div className="text-xs font-bold text-white">{position.symbol}</div>
                        <div className={`text-xs font-medium mt-1 ${position.gainPercent >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                          {position.gainPercent >= 0 ? '+' : ''}{position.gainPercent.toFixed(1)}%
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sector Allocation */}
          <Card className="bg-card border-border hover:border-border/70 transition-all duration-300 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Sector Allocation
              </CardTitle>
              <CardDescription>Portfolio diversification by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardClient sectorData={portfolio.sectors} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Movers */}
        <Card className="lg:col-span-2 bg-card border-border hover:border-border/70 transition-all duration-300 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <CardHeader>
            <CardTitle>Market Movers</CardTitle>
            <CardDescription>Top gainers and losers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Gainers
                </h3>
                <div className="space-y-2">
                  {market.topGainers.length > 0 ? (
                    market.topGainers.map((stock: any) => (
                      <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer group">
                          <div>
                            <p className="font-medium text-sm group-hover:text-emerald-400 transition-colors">{stock.symbol}</p>
                            <p className="text-xs text-muted-foreground">{stock.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-500">+{stock.changePercent.toFixed(2)}%</p>
                            <p className="text-xs text-muted-foreground">${stock.currentPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </div>

              {/* Top Losers */}
              <div>
                <h3 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Top Losers
                </h3>
                <div className="space-y-2">
                  {market.topLosers.length > 0 ? (
                    market.topLosers.map((stock: any) => (
                      <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer group">
                          <div>
                            <p className="font-medium text-sm group-hover:text-red-400 transition-colors">{stock.symbol}</p>
                            <p className="text-xs text-muted-foreground">{stock.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-500">{stock.changePercent.toFixed(2)}%</p>
                            <p className="text-xs text-muted-foreground">${stock.currentPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-card border-border hover:border-border transition-all duration-300 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/scanner" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-emerald-900/20 hover:border-emerald-700 hover:text-emerald-400 transition-all duration-300 group"
              >
                <Radar className="mr-3 h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                Scan for Opportunities
              </Button>
            </Link>
            <Link href="/scanner?type=undervalued" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-blue-900/20 hover:border-blue-700 hover:text-blue-400 transition-all duration-300 group"
              >
                <TrendingDown className="mr-3 h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                Find Undervalued Stocks
              </Button>
            </Link>
            <Link href="/scanner?type=dividend" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-purple-900/20 hover:border-purple-700 hover:text-purple-400 transition-all duration-300 group"
              >
                <BarChart3 className="mr-3 h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                Dividend Opportunities
              </Button>
            </Link>
            <Link href="/scanner?shariah=true" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-amber-900/20 hover:border-amber-700 hover:text-amber-400 transition-all duration-300 group"
              >
                <Sparkles className="mr-3 h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                Shariah-Compliant Stocks
              </Button>
            </Link>
            <Link href="/portfolio" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-border hover:bg-indigo-900/20 hover:border-indigo-700 hover:text-indigo-400 transition-all duration-300 group"
              >
                <Wallet className="mr-3 h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                View Full Portfolio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watchlist Preview */}
        {watchlists.recentStocks.length > 0 && (
          <Card className="bg-card border-border hover:border-border transition-all duration-300 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Watchlist Highlights</CardTitle>
                <CardDescription>Stocks you&apos;re tracking</CardDescription>
              </div>
              <Link href="/watchlist">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-400 hover:bg-blue-900/20 transition-all duration-300">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {watchlists.recentStocks.slice(0, 5).map((stock: any) => (
                  <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer group">
                      <div>
                        <p className="font-medium text-sm group-hover:text-blue-400 transition-colors">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name || stock.watchlistName}</p>
                      </div>
                      {stock.currentPrice && (
                        <div className="text-right">
                          <p className="text-sm font-medium">${stock.currentPrice.toFixed(2)}</p>
                          {stock.changePercent !== null && (
                            <p className={`text-xs ${stock.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent scans */}
        <Card className="bg-card border-border hover:border-border transition-all duration-300 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your market scanning history</CardDescription>
            </div>
            <Link href="/scanner">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-900/20 transition-all duration-300">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activity.recentScans.length > 0 ? (
              <div className="space-y-2">
                {activity.recentScans.slice(0, 5).map((scan: any) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary group-hover:bg-emerald-600/20 flex items-center justify-center transition-all duration-300">
                        <Radar className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize group-hover:text-emerald-400 transition-colors">{scan.scanType} Scan</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-secondary group-hover:bg-emerald-600/20 group-hover:text-emerald-400 transition-all duration-300">
                      {scan.resultsCount}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Radar className="h-12 w-12 mx-auto text-muted-foreground/70 mb-3" />
                <p className="text-muted-foreground mb-4">No scans yet</p>
                <Link href="/scanner">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/50 transition-all duration-300">
                    Start your first scan
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
