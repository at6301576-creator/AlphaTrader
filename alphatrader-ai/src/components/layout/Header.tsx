"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Menu,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { AlertNotifications } from "@/components/alerts/AlertNotifications";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  onMobileMenuToggle?: () => void;
}

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const MARKET_INDICES_CONFIG = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "DOW" },
  { symbol: "^FTSE", name: "FTSE 100" },
];

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch market data on mount
    fetchMarketData();

    // Update every 1 hour (3600000ms)
    const interval = setInterval(fetchMarketData, 3600000);

    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const indices = await Promise.all(
        MARKET_INDICES_CONFIG.map(async (config) => {
          try {
            const response = await fetch(`/api/benchmarks?symbol=${config.symbol}`);
            if (response.ok) {
              const data = await response.json();
              console.log(`Fetched ${config.name}:`, data);
              return {
                symbol: config.name,
                name: config.name,
                value: data.price || 0,
                change: data.change || 0,
                changePercent: data.changePercent || 0,
              };
            } else {
              console.error(`Failed to fetch ${config.name}: ${response.status}`);
              return null;
            }
          } catch (err) {
            console.error(`Error fetching ${config.name}:`, err);
            return null;
          }
        })
      );

      const validIndices = indices.filter((idx): idx is MarketIndex => idx !== null);
      console.log("Valid indices:", validIndices);

      if (validIndices.length > 0) {
        setMarketIndices(validIndices);
      } else {
        // Use fallback data if all API calls failed
        console.log("Using fallback data - all API calls failed");
        setMarketIndices([
          { symbol: "S&P 500", name: "S&P 500", value: 5987.23, change: 0, changePercent: 0.45 },
          { symbol: "NASDAQ", name: "NASDAQ", value: 19234.56, change: 0, changePercent: 0.78 },
          { symbol: "DOW", name: "DOW", value: 44234.12, change: 0, changePercent: -0.12 },
          { symbol: "FTSE 100", name: "FTSE 100", value: 8234.56, change: 0, changePercent: 0.23 },
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching market data:", error);
      // Use fallback data on error
      setMarketIndices([
        { symbol: "S&P 500", name: "S&P 500", value: 5987.23, change: 0, changePercent: 0.45 },
        { symbol: "NASDAQ", name: "NASDAQ", value: 19234.56, change: 0, changePercent: 0.78 },
        { symbol: "DOW", name: "DOW", value: 44234.12, change: 0, changePercent: -0.12 },
        { symbol: "FTSE 100", name: "FTSE 100", value: 8234.56, change: 0, changePercent: 0.23 },
      ]);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery("");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Market indices ticker */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {loading ? (
            <div className="text-muted-foreground text-xs animate-pulse">Loading market data...</div>
          ) : (
            marketIndices.map((index) => (
              <div key={index.symbol} className="flex items-center gap-2">
                <span className="text-muted-foreground">{index.symbol}</span>
                <span className="text-foreground font-medium">
                  {index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <div
                  className={`flex items-center gap-0.5 ${
                    index.changePercent > 0
                      ? "text-emerald-500"
                      : index.changePercent < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {index.changePercent > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : index.changePercent < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {index.changePercent > 0 ? "+" : ""}
                    {index.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Search and actions */}
        <div className="flex items-center gap-4">
          {/* Search - More prominent */}
          <form onSubmit={handleSearch} className="relative md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
            <Input
              type="text"
              placeholder="Search any stock (e.g., AAPL, TSLA)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 md:w-72 pl-10 h-10 bg-secondary/50 border-2 border-emerald-500/30 hover:border-emerald-500/50 focus:border-emerald-500 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500/20 transition-all"
              autoComplete="off"
            />
          </form>

          {/* Notifications */}
          <AlertNotifications />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-popover border-border"
            >
              <DropdownMenuLabel className="text-popover-foreground">
                <div className="flex flex-col">
                  <span>{user.name || "User"}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-popover-foreground focus:bg-accent cursor-pointer"
                onClick={() => router.push("/settings")}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-popover-foreground focus:bg-accent cursor-pointer"
                onClick={() => router.push("/portfolio")}
              >
                Portfolio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
