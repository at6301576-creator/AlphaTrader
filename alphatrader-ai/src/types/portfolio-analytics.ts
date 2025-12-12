/**
 * Portfolio Analytics Types
 * For tracking performance, risk metrics, and portfolio composition
 */

export interface PortfolioPosition {
  id: string;
  symbol: string;
  companyName: string | null;
  shares: number;
  avgCost: number;
  currentPrice: number | null;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string | null;
  weight: number; // Percentage of total portfolio
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: PortfolioPosition[];
  lastUpdated: Date;
}

export interface PortfolioPerformance {
  date: string;
  value: number;
  pl: number;
  plPercent: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  weight: number;
  pl: number;
  plPercent: number;
  count: number; // Number of positions in this sector
}

export interface RiskMetrics {
  // Volatility
  dailyVolatility: number;
  annualizedVolatility: number;

  // Beta (vs S&P 500)
  beta: number;

  // Risk-adjusted returns
  sharpeRatio: number;

  // Drawdown
  maxDrawdown: number;
  currentDrawdown: number;

  // Diversification
  sectorConcentration: number; // 0-1, higher = more concentrated
  positionConcentration: number; // 0-1, higher = more concentrated

  // Value at Risk (95% confidence)
  valueAtRisk: number;
}

export interface BenchmarkComparison {
  benchmarkSymbol: string;
  benchmarkName: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number; // Portfolio return - benchmark return
  correlation: number;
}

export interface PortfolioAnalytics {
  summary: PortfolioSummary;
  performance: PortfolioPerformance[];
  sectorAllocation: SectorAllocation[];
  riskMetrics: RiskMetrics;
  benchmarks: BenchmarkComparison[];
}

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  date: Date;
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  positions: string; // JSON string of positions at that time
}
