"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radar, Loader2, Filter, ChevronDown, ChevronUp, Sparkles, Lightbulb, CheckCircle } from "lucide-react";
import {
  SCAN_TYPE_LABELS,
  SCAN_TYPE_DESCRIPTIONS,
  MARKET_LABELS,
  SECTORS,
  type ScanType,
  type Market,
  type ScannerFilters,
} from "@/types/scanner";
import { EXAMPLE_QUERIES } from "@/lib/ai/scanner-interpreter";
import type { ScannerInterpretation } from "@/lib/ai/scanner-interpreter";

interface ScannerControlsProps {
  onScan: (filters: ScannerFilters) => void;
  isLoading: boolean;
}

export function ScannerControls({ onScan, isLoading }: ScannerControlsProps) {
  const [scanType, setScanType] = useState<ScanType>("undervalued");
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>(["US"]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [shariahOnly, setShariahOnly] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [minMarketCap, setMinMarketCap] = useState<string>("");
  const [maxMarketCap, setMaxMarketCap] = useState<string>("");
  const [maxPERatio, setMaxPERatio] = useState<string>("");
  const [minDividendYield, setMinDividendYield] = useState<string>("");

  // Natural language query state
  const [nlQuery, setNlQuery] = useState<string>("");
  const [interpretation, setInterpretation] = useState<ScannerInterpretation | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);

  const toggleMarket = (market: Market) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const handleInterpretQuery = async () => {
    if (!nlQuery.trim()) return;

    setIsInterpreting(true);
    setInterpretError(null);
    setInterpretation(null);

    try {
      const response = await fetch("/api/scanner/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlQuery }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to interpret query");
      }

      const data = await response.json();
      setInterpretation(data.interpretation);
    } catch (error) {
      console.error("Interpretation error:", error);
      setInterpretError(error instanceof Error ? error.message : "Failed to interpret query");
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleNaturalLanguageScan = () => {
    if (!interpretation) return;

    // Use AI-interpreted filters
    const filters: ScannerFilters = {
      scanType: interpretation.scanType,
      markets: (interpretation.filters.markets || ["US"]) as Market[],
      sectors: interpretation.filters.sectors || [],
      shariahCompliantOnly: interpretation.filters.shariahCompliantOnly || false,
      ...interpretation.filters,
    };

    onScan(filters);
  };

  const handleScan = () => {
    const filters: ScannerFilters = {
      scanType,
      markets: selectedMarkets,
      sectors: selectedSectors,
      shariahCompliantOnly: shariahOnly,
      minMarketCap: minMarketCap ? parseFloat(minMarketCap) : undefined,
      maxMarketCap: maxMarketCap ? parseFloat(maxMarketCap) : undefined,
      maxPERatio: maxPERatio ? parseFloat(maxPERatio) : undefined,
      minDividendYield: minDividendYield ? parseFloat(minDividendYield) : undefined,
    };

    onScan(filters);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-emerald-500" />
          Market Scanner
        </CardTitle>
        <CardDescription>
          Find investment opportunities across global markets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="filters" className="data-[state=active]:bg-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Manual Filters
            </TabsTrigger>
            <TabsTrigger value="natural" className="data-[state=active]:bg-gray-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Natural Language (Premium)
            </TabsTrigger>
          </TabsList>

          {/* Natural Language Tab */}
          <TabsContent value="natural" className="space-y-4 mt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <Label className="text-base">Describe what you're looking for</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    AI will interpret your query and configure the scanner automatically
                  </p>
                </div>
              </div>

              <Textarea
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="e.g., beaten-down tech stocks with bullish RSI reversals..."
                className="bg-gray-800 border-gray-700 min-h-[100px] resize-none"
                maxLength={500}
              />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{nlQuery.length}/500 characters</span>
              </div>

              {/* Example Queries */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Examples (click to use):</Label>
                <div className="space-y-1">
                  {EXAMPLE_QUERIES.slice(0, 3).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNlQuery(example)}
                      className="block w-full text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded px-2 py-1.5 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interpret Button */}
              <Button
                onClick={handleInterpretQuery}
                disabled={isInterpreting || !nlQuery.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isInterpreting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Interpreting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Interpret Query
                  </>
                )}
              </Button>

              {/* Interpretation Error */}
              {interpretError && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-400">{interpretError}</p>
                </div>
              )}

              {/* Interpretation Result */}
              {interpretation && (
                <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-emerald-400 mb-1">
                        AI Interpretation ({interpretation.confidence} confidence)
                      </h4>
                      <p className="text-sm text-gray-300">{interpretation.explanation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Scan Type:</span>
                      <span className="ml-2 text-gray-200">{SCAN_TYPE_LABELS[interpretation.scanType]}</span>
                    </div>
                    {interpretation.filters.markets && interpretation.filters.markets.length > 0 && (
                      <div>
                        <span className="text-gray-500">Markets:</span>
                        <span className="ml-2 text-gray-200">
                          {interpretation.filters.markets.join(", ")}
                        </span>
                      </div>
                    )}
                    {interpretation.filters.sectors && interpretation.filters.sectors.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Sectors:</span>
                        <span className="ml-2 text-gray-200">
                          {interpretation.filters.sectors.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Run Scan Button */}
                  <Button
                    onClick={handleNaturalLanguageScan}
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scanning Markets...
                      </>
                    ) : (
                      <>
                        <Radar className="mr-2 h-5 w-5" />
                        Run Scan with AI Config
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Manual Filters Tab */}
          <TabsContent value="filters" className="space-y-6 mt-6">
        {/* Scan Type */}
        <div className="space-y-2">
          <Label>Scan Type</Label>
          <Select value={scanType} onValueChange={(v) => setScanType(v as ScanType)}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select scan type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {(Object.keys(SCAN_TYPE_LABELS) as ScanType[]).map((type) => (
                <SelectItem key={type} value={type} className="text-gray-200">
                  {SCAN_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">{SCAN_TYPE_DESCRIPTIONS[scanType]}</p>
        </div>

        {/* Markets */}
        <div className="space-y-2">
          <Label>Markets</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MARKET_LABELS) as Market[]).slice(0, 6).map((market) => (
              <Badge
                key={market}
                variant={selectedMarkets.includes(market) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedMarkets.includes(market)
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
                onClick={() => toggleMarket(market)}
              >
                {market}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sectors */}
        <div className="space-y-2">
          <Label>Sectors</Label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Badge
                key={sector}
                variant={selectedSectors.includes(sector) ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-colors ${
                  selectedSectors.includes(sector)
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
                onClick={() => toggleSector(sector)}
              >
                {sector}
              </Badge>
            ))}
          </div>
        </div>

        {/* Shariah Filter */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="shariah">Shariah Compliant Only</Label>
            <p className="text-sm text-gray-500">
              Filter for Shariah-compliant investments
            </p>
          </div>
          <Switch
            id="shariah"
            checked={shariahOnly}
            onCheckedChange={setShariahOnly}
          />
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          className="w-full justify-between text-gray-400 hover:text-white"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            {/* Numeric Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minMarketCap">Min Market Cap ($M)</Label>
                <Input
                  id="minMarketCap"
                  type="number"
                  value={minMarketCap}
                  onChange={(e) => setMinMarketCap(e.target.value)}
                  placeholder="100"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMarketCap">Max Market Cap ($M)</Label>
                <Input
                  id="maxMarketCap"
                  type="number"
                  value={maxMarketCap}
                  onChange={(e) => setMaxMarketCap(e.target.value)}
                  placeholder="No limit"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPERatio">Max P/E Ratio</Label>
                <Input
                  id="maxPERatio"
                  type="number"
                  value={maxPERatio}
                  onChange={(e) => setMaxPERatio(e.target.value)}
                  placeholder="No limit"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minDividendYield">Min Dividend Yield (%)</Label>
                <Input
                  id="minDividendYield"
                  type="number"
                  value={minDividendYield}
                  onChange={(e) => setMinDividendYield(e.target.value)}
                  placeholder="0"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scan Button */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
          onClick={handleScan}
          disabled={isLoading || selectedMarkets.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning Markets...
            </>
          ) : (
            <>
              <Radar className="mr-2 h-5 w-5" />
              Start Scan
            </>
          )}
        </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
