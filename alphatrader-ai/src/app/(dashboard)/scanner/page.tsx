"use client";

import { useState, useEffect } from "react";
import { ScannerControls } from "@/components/scanner/ScannerControls";
import { StockCard } from "@/components/scanner/StockCard";
import { ScannerLoadingState } from "@/components/scanner/LoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Radar, TrendingUp, Filter, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ScannerFilters, ScanResult } from "@/types/scanner";

// Local storage key for persisting scanner results
const SCANNER_RESULTS_KEY = "alphatrader_scanner_results";

export default function ScannerPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("score");
  const [filterShariah, setFilterShariah] = useState<string>("all");

  // Load persisted results on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SCANNER_RESULTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if results are not too old (less than 30 minutes)
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < 30 * 60 * 1000) {
          setResults(parsed.results || []);
        } else {
          // Clear old results
          sessionStorage.removeItem(SCANNER_RESULTS_KEY);
        }
      }
    } catch (err) {
      console.error("Failed to load persisted scanner results:", err);
    }
  }, []);

  const handleScan = async (filters: ScannerFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error("Scan failed");
      }

      const data = await response.json();
      setResults(data.results);

      // Persist results to sessionStorage
      try {
        sessionStorage.setItem(SCANNER_RESULTS_KEY, JSON.stringify({
          results: data.results,
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.error("Failed to persist scanner results:", err);
      }

      toast.success(`Found ${data.results.length} opportunities!`);
    } catch (err) {
      setError("Failed to complete scan. Please try again.");
      toast.error("Scan failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWatchlist = async (symbol: string) => {
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Watchlist", symbols: [symbol] }),
      });

      if (!response.ok) throw new Error("Failed to add to watchlist");

      toast.success(`Added ${symbol} to watchlist`);
    } catch {
      toast.error("Failed to add to watchlist");
    }
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      // Find the stock in results to get the current price
      const stockResult = results.find(r => r.stock.symbol === symbol);
      const price = stockResult?.stock.currentPrice || 100; // Default price if not found

      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          shares: 1, // Default to 1 share
          avgCost: price,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to portfolio");

      toast.success(`Added 1 share of ${symbol} to portfolio at $${price.toFixed(2)}`);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      toast.error("Failed to add to portfolio");
    }
  };

  // Filter and sort results
  const filteredResults = results
    .filter((r) => {
      if (filterShariah === "compliant") {
        return r.stock.isShariahCompliant === true;
      }
      if (filterShariah === "non-compliant") {
        return r.stock.isShariahCompliant === false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "price":
          return (b.stock.currentPrice || 0) - (a.stock.currentPrice || 0);
        case "marketCap":
          return (b.stock.marketCap || 0) - (a.stock.marketCap || 0);
        case "pe":
          return (a.stock.peRatio || 999) - (b.stock.peRatio || 999);
        case "dividend":
          return (b.stock.dividendYield || 0) - (a.stock.dividendYield || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Radar className="h-8 w-8 text-emerald-500" />
          Market Scanner
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover undervalued stocks and investment opportunities across global markets
        </p>
      </div>

      {/* Scanner Controls */}
      <ScannerControls onScan={handleScan} isLoading={isLoading} />

      {/* Loading State */}
      {isLoading && <ScannerLoadingState />}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Results Header */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Scan Results
                  </CardTitle>
                  <CardDescription>
                    Found {results.length} potential opportunities
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] bg-secondary border-border">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="score">AI Score</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="marketCap">Market Cap</SelectItem>
                      <SelectItem value="pe">P/E Ratio</SelectItem>
                      <SelectItem value="dividend">Dividend</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterShariah} onValueChange={setFilterShariah}>
                    <SelectTrigger className="w-[160px] bg-secondary border-border">
                      <SelectValue placeholder="Shariah Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Stocks</SelectItem>
                      <SelectItem value="compliant">Shariah Compliant</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Strong Buy</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {results.filter((r) => r.recommendation === "strong_buy").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Buy</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {results.filter((r) => r.recommendation === "buy").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    results.reduce((sum, r) => sum + r.score, 0) / results.length
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Shariah Compliant</p>
                <p className="text-2xl font-bold text-amber-500">
                  {results.filter((r) => r.stock.isShariahCompliant).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result, index) => (
              <div
                key={result.stock.symbol}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                <StockCard
                  result={result}
                  onAddToWatchlist={handleAddToWatchlist}
                  onAddToPortfolio={handleAddToPortfolio}
                />
              </div>
            ))}
          </div>

          {filteredResults.length === 0 && (
            <Card className="bg-card border-border p-8 text-center">
              <p className="text-muted-foreground">
                No stocks match your current filters.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && !error && (
        <Card className="bg-card border-border p-12 text-center">
          <Radar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Configure your scan parameters above and click &quot;Start Scan&quot; to
            discover investment opportunities.
          </p>
        </Card>
      )}
    </div>
  );
}
