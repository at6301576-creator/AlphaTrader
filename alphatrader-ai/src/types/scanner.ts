import { Stock } from "./stock";

export type ScanType =
  | "undervalued"
  | "momentum"
  | "dividend"
  | "growth"
  | "value"
  | "quality"
  | "turnaround"
  | "breakout"
  | "penny_stocks";

export type Market =
  | "US"
  | "UK"
  | "DE"
  | "FR"
  | "JP"
  | "CN"
  | "HK"
  | "IN"
  | "AU"
  | "CA"
  | "SA"
  | "AE";

export interface ScannerFilters {
  scanType: ScanType;
  markets: Market[];
  sectors: string[];
  shariahCompliantOnly: boolean;

  // Price filters
  minPrice?: number;
  maxPrice?: number;

  // Market cap filters (in millions)
  minMarketCap?: number;
  maxMarketCap?: number;

  // Valuation filters
  maxPERatio?: number;
  minPERatio?: number;
  maxPBRatio?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  maxPEGRatio?: number;

  // Growth filters
  minRevenueGrowth?: number;
  minEarningsGrowth?: number;

  // Quality filters
  minROE?: number;
  minROA?: number;
  maxDebtToEquity?: number;

  // Technical filters
  minRSI?: number;
  maxRSI?: number;
  aboveSMA?: number; // 20, 50, 200
  belowSMA?: number;
}

export interface ScanResult {
  stock: Stock;
  score: number;
  signals: ScanSignal[];
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  reasonSummary: string;
}

export interface ScanSignal {
  type: "positive" | "negative" | "neutral";
  category: "valuation" | "growth" | "quality" | "technical" | "momentum" | "shariah";
  message: string;
  weight: number;
}

export interface ScanHistoryItem {
  id: string;
  scanType: ScanType;
  markets: Market[];
  parameters: ScannerFilters;
  resultsCount: number;
  topResults: ScanResult[];
  createdAt: Date;
}

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  undervalued: "Undervalued Stocks",
  momentum: "Momentum Plays",
  dividend: "Dividend Gems",
  growth: "Growth Stocks",
  value: "Value Investing",
  quality: "Quality Companies",
  turnaround: "Turnaround Candidates",
  breakout: "Breakout Potential",
  penny_stocks: "Penny Stocks",
};

export const SCAN_TYPE_DESCRIPTIONS: Record<ScanType, string> = {
  undervalued: "Find stocks trading below their intrinsic value based on P/E, P/B, and other metrics",
  momentum: "Identify stocks with strong price momentum and positive technical signals",
  dividend: "Discover high-yield dividend stocks with sustainable payouts",
  growth: "Find companies with strong revenue and earnings growth",
  value: "Classic value investing approach - low valuations with solid fundamentals",
  quality: "High-quality companies with strong profitability and low debt",
  turnaround: "Companies showing signs of recovery and potential upside",
  breakout: "Stocks breaking out of consolidation patterns with volume confirmation",
  penny_stocks: "Low-priced stocks under $5 with high growth potential and volatility",
};

export const MARKET_LABELS: Record<Market, string> = {
  US: "United States",
  UK: "United Kingdom",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  CN: "China",
  HK: "Hong Kong",
  IN: "India",
  AU: "Australia",
  CA: "Canada",
  SA: "Saudi Arabia",
  AE: "UAE",
};

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Industrials",
  "Energy",
  "Utilities",
  "Real Estate",
  "Basic Materials",
  "Communication Services",
  "Cryptocurrency Mining",
];
