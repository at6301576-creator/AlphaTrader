"use client";

import { useState, useEffect } from "react";
import { Filter, Search, Save, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

interface ScreenerFilters {
  // Price & Market Cap
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;

  // Valuation
  minPE?: number;
  maxPE?: number;
  minPB?: number;
  maxPB?: number;
  minPS?: number;
  maxPS?: number;

  // Dividends
  minDividendYield?: number;
  maxDividendYield?: number;

  // Growth
  minRevenueGrowth?: number;
  minEarningsGrowth?: number;

  // Profitability
  minProfitMargin?: number;
  minROE?: number;
  minROA?: number;

  // Financial Health
  maxDebtToEquity?: number;
  minCurrentRatio?: number;

  // Technical
  minBeta?: number;
  maxBeta?: number;
  near52WeekHigh?: boolean;
  near52WeekLow?: boolean;

  // Filters
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  shariahCompliant?: boolean;
}

interface ScreenerResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  volume: number;
  isShariahCompliant: boolean;
}

interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filters: string;
  isPublic: boolean;
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>({});
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [presets, setPresets] = useState<ScreenerPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("marketCap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/screener/presets");
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Error fetching presets:", error);
    }
  };

  const handleScreen = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          sortBy,
          sortOrder,
          limit: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setFilterOptions(data.filterOptions);
      }
    } catch (error) {
      console.error("Error running screener:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName) return;

    try {
      const response = await fetch("/api/screener/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          description: presetDescription,
          filters,
        }),
      });

      if (response.ok) {
        setSaveDialogOpen(false);
        setPresetName("");
        setPresetDescription("");
        fetchPresets();
      }
    } catch (error) {
      console.error("Error saving preset:", error);
    }
  };

  const handleLoadPreset = (preset: ScreenerPreset) => {
    try {
      const parsedFilters = typeof preset.filters === 'string'
        ? JSON.parse(preset.filters)
        : preset.filters;
      setFilters(parsedFilters);
    } catch (error) {
      console.error("Error loading preset:", error);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof ScreenerFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Stock Screener</h1>
          <p className="text-muted-foreground mt-1">Filter stocks by fundamental and technical criteria</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border">
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle>Save Screener Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Preset Name</Label>
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., Value Stocks"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="e.g., Low P/E ratio with high dividend yield"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <Button onClick={handleSavePreset} className="w-full bg-blue-600 hover:bg-blue-700">
                  Save Preset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleClearFilters} variant="outline" className="border-border">
            Clear Filters
          </Button>
          <Button onClick={handleScreen} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Screening...
              </>
            ) : (
              <>
                <Filter className="h-4 w-4 mr-2" />
                Run Screen
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Filters Sidebar */}
        <div className="space-y-4">
          {/* Presets */}
          {presets.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Saved Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full justify-start border-border"
                  >
                    {preset.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {/* Price & Market Cap */}
                <AccordionItem value="price" className="border-border">
                  <AccordionTrigger>Price & Market Cap</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Price</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) => updateFilter("minPrice", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Price</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) => updateFilter("maxPrice", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min Market Cap</Label>
                      <Input
                        type="number"
                        placeholder="Min (in millions)"
                        value={filters.minMarketCap || ""}
                        onChange={(e) => updateFilter("minMarketCap", parseFloat(e.target.value) * 1e6)}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Market Cap</Label>
                      <Input
                        type="number"
                        placeholder="Max (in millions)"
                        value={filters.maxMarketCap || ""}
                        onChange={(e) => updateFilter("maxMarketCap", parseFloat(e.target.value) * 1e6)}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Valuation */}
                <AccordionItem value="valuation" className="border-border">
                  <AccordionTrigger>Valuation</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min P/E</Label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minPE || ""}
                          onChange={(e) => updateFilter("minPE", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max P/E</Label>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPE || ""}
                          onChange={(e) => updateFilter("maxPE", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min P/B</Label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minPB || ""}
                          onChange={(e) => updateFilter("minPB", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max P/B</Label>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPB || ""}
                          onChange={(e) => updateFilter("maxPB", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Dividends */}
                <AccordionItem value="dividends" className="border-border">
                  <AccordionTrigger>Dividends</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Dividend Yield (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 2.5"
                        value={filters.minDividendYield || ""}
                        onChange={(e) => updateFilter("minDividendYield", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Dividend Yield (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 8"
                        value={filters.maxDividendYield || ""}
                        onChange={(e) => updateFilter("maxDividendYield", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Growth */}
                <AccordionItem value="growth" className="border-border">
                  <AccordionTrigger>Growth</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Revenue Growth (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={filters.minRevenueGrowth || ""}
                        onChange={(e) => updateFilter("minRevenueGrowth", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min Earnings Growth (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 15"
                        value={filters.minEarningsGrowth || ""}
                        onChange={(e) => updateFilter("minEarningsGrowth", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Profitability */}
                <AccordionItem value="profitability" className="border-border">
                  <AccordionTrigger>Profitability</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Profit Margin (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={filters.minProfitMargin || ""}
                        onChange={(e) => updateFilter("minProfitMargin", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min ROE (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 15"
                        value={filters.minROE || ""}
                        onChange={(e) => updateFilter("minROE", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min ROA (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 8"
                        value={filters.minROA || ""}
                        onChange={(e) => updateFilter("minROA", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Financial Health */}
                <AccordionItem value="health" className="border-border">
                  <AccordionTrigger>Financial Health</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Max Debt to Equity</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1.5"
                        value={filters.maxDebtToEquity || ""}
                        onChange={(e) => updateFilter("maxDebtToEquity", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min Current Ratio</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1.5"
                        value={filters.minCurrentRatio || ""}
                        onChange={(e) => updateFilter("minCurrentRatio", parseFloat(e.target.value))}
                        className="bg-secondary border-border mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Technical */}
                <AccordionItem value="technical" className="border-border">
                  <AccordionTrigger>Technical</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min Beta</Label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minBeta || ""}
                          onChange={(e) => updateFilter("minBeta", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Beta</Label>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxBeta || ""}
                          onChange={(e) => updateFilter("maxBeta", parseFloat(e.target.value))}
                          className="bg-secondary border-border mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Near 52-Week High</Label>
                      <Switch
                        checked={filters.near52WeekHigh || false}
                        onCheckedChange={(checked) => updateFilter("near52WeekHigh", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Near 52-Week Low</Label>
                      <Switch
                        checked={filters.near52WeekLow || false}
                        onCheckedChange={(checked) => updateFilter("near52WeekLow", checked)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Categorical Filters */}
                <AccordionItem value="categorical" className="border-border">
                  <AccordionTrigger>Categories</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {filterOptions && (
                      <>
                        <div>
                          <Label className="text-xs">Sector</Label>
                          <Select
                            value={filters.sector || ""}
                            onValueChange={(value) => updateFilter("sector", value)}
                          >
                            <SelectTrigger className="bg-secondary border-border mt-1">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="">All</SelectItem>
                              {filterOptions.sectors?.map((sector: string) => (
                                <SelectItem key={sector} value={sector}>
                                  {sector}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Exchange</Label>
                          <Select
                            value={filters.exchange || ""}
                            onValueChange={(value) => updateFilter("exchange", value)}
                          >
                            <SelectTrigger className="bg-secondary border-border mt-1">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="">All</SelectItem>
                              {filterOptions.exchanges?.map((exchange: string) => (
                                <SelectItem key={exchange} value={exchange}>
                                  {exchange}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Shariah Compliant Only</Label>
                      <Switch
                        checked={filters.shariahCompliant || false}
                        onCheckedChange={(checked) => updateFilter("shariahCompliant", checked)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Screening Results</CardTitle>
                  {results.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Found {results.length} stocks matching your criteria
                    </p>
                  )}
                </div>
                {results.length > 0 && (
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="marketCap">Market Cap</SelectItem>
                      <SelectItem value="peRatio">P/E Ratio</SelectItem>
                      <SelectItem value="pbRatio">P/B Ratio</SelectItem>
                      <SelectItem value="dividendYield">Dividend Yield</SelectItem>
                      <SelectItem value="changePercent">% Change</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Symbol</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">Price</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">Change</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">Market Cap</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">P/E</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">P/B</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">Div Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((stock) => (
                        <tr key={stock.symbol} className="border-b border-border hover:bg-secondary/50">
                          <td className="py-4 px-4">
                            <Link
                              href={`/stock/${stock.symbol}`}
                              className="font-medium hover:text-blue-400 transition-colors"
                            >
                              {stock.symbol}
                            </Link>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </td>
                          <td className="text-right py-4 px-4">${stock.currentPrice?.toFixed(2)}</td>
                          <td className="text-right py-4 px-4">
                            <div className={stock.changePercent >= 0 ? "text-green-500" : "text-red-500"}>
                              {stock.changePercent >= 0 ? "+" : ""}
                              {stock.changePercent?.toFixed(2)}%
                            </div>
                          </td>
                          <td className="text-right py-4 px-4">{formatMarketCap(stock.marketCap)}</td>
                          <td className="text-right py-4 px-4">{stock.peRatio?.toFixed(2) || "N/A"}</td>
                          <td className="text-right py-4 px-4">{stock.pbRatio?.toFixed(2) || "N/A"}</td>
                          <td className="text-right py-4 px-4">{stock.dividendYield?.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Set your filters and click "Run Screen" to find stocks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
