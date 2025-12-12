"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radar, Loader2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  SCAN_TYPE_LABELS,
  SCAN_TYPE_DESCRIPTIONS,
  MARKET_LABELS,
  SECTORS,
  type ScanType,
  type Market,
  type ScannerFilters,
} from "@/types/scanner";

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
      </CardContent>
    </Card>
  );
}
