/**
 * Portfolio Analytics Service
 * Calculates performance metrics, risk metrics, and portfolio composition
 */

import type {
  PortfolioPosition,
  PortfolioSummary,
  PortfolioPerformance,
  SectorAllocation,
  RiskMetrics,
  BenchmarkComparison,
  PortfolioAnalytics,
} from "@/types/portfolio-analytics";

interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
}

interface Quote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

interface StockProfile {
  symbol: string;
  name: string | null;
  sector: string | null;
}

/**
 * Calculate portfolio summary with current positions
 */
export function calculatePortfolioSummary(
  positions: Position[],
  quotes: Map<string, Quote>,
  profiles: Map<string, StockProfile>
): PortfolioSummary {
  const portfolioPositions: PortfolioPosition[] = [];
  let totalValue = 0;
  let totalCost = 0;
  let totalDayChange = 0;

  for (const position of positions) {
    const quote = quotes.get(position.symbol);
    const profile = profiles.get(position.symbol);

    if (!quote) continue;

    const currentPrice = quote.regularMarketPrice;
    const marketValue = currentPrice * position.shares;
    const costBasis = position.avgCost * position.shares;
    const unrealizedPL = marketValue - costBasis;
    const unrealizedPLPercent = (unrealizedPL / costBasis) * 100;
    const dayChange = quote.regularMarketChange * position.shares;
    const dayChangePercent = quote.regularMarketChangePercent;

    portfolioPositions.push({
      id: position.symbol,
      symbol: position.symbol,
      companyName: profile?.name || null,
      shares: position.shares,
      avgCost: position.avgCost,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPL,
      unrealizedPLPercent,
      dayChange,
      dayChangePercent,
      sector: profile?.sector || null,
      weight: 0, // Will calculate after total
    });

    totalValue += marketValue;
    totalCost += costBasis;
    totalDayChange += dayChange;
  }

  // Calculate weights
  for (const position of portfolioPositions) {
    position.weight = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
  }

  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const dayChangePercent = totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPL,
    totalPLPercent,
    dayChange: totalDayChange,
    dayChangePercent,
    positions: portfolioPositions,
    lastUpdated: new Date(),
  };
}

/**
 * Calculate sector allocation
 */
export function calculateSectorAllocation(
  positions: PortfolioPosition[]
): SectorAllocation[] {
  const sectorMap = new Map<string, SectorAllocation>();

  for (const position of positions) {
    const sector = position.sector || "Unknown";
    const existing = sectorMap.get(sector);

    if (existing) {
      existing.value += position.marketValue;
      existing.pl += position.unrealizedPL;
      existing.count += 1;
    } else {
      sectorMap.set(sector, {
        sector,
        value: position.marketValue,
        weight: 0, // Will calculate after
        pl: position.unrealizedPL,
        plPercent: 0,
        count: 1,
      });
    }
  }

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const allocations = Array.from(sectorMap.values());

  // Calculate weights and P/L percentages
  for (const allocation of allocations) {
    allocation.weight = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
    const costBasis = allocation.value - allocation.pl;
    allocation.plPercent = costBasis > 0 ? (allocation.pl / costBasis) * 100 : 0;
  }

  // Sort by value descending
  return allocations.sort((a, b) => b.value - a.value);
}

/**
 * Calculate risk metrics
 */
export function calculateRiskMetrics(
  performance: PortfolioPerformance[],
  positions: PortfolioPosition[],
  benchmarkReturns?: number[]
): RiskMetrics {
  if (performance.length < 2) {
    // Not enough data for calculations
    return {
      dailyVolatility: 0,
      annualizedVolatility: 0,
      beta: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      sectorConcentration: 0,
      positionConcentration: 0,
      valueAtRisk: 0,
    };
  }

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < performance.length; i++) {
    const prevValue = performance[i - 1].value;
    const currValue = performance[i].value;
    if (prevValue > 0) {
      returns.push((currValue - prevValue) / prevValue);
    }
  }

  // Volatility
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252); // 252 trading days

  // Beta (if benchmark data provided)
  let beta = 1.0;
  if (benchmarkReturns && benchmarkReturns.length === returns.length) {
    const avgBenchmark =
      benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
    const covariance =
      returns.reduce(
        (sum, r, i) => sum + (r - avgReturn) * (benchmarkReturns[i] - avgBenchmark),
        0
      ) / returns.length;
    const benchmarkVariance =
      benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - avgBenchmark, 2), 0) /
      benchmarkReturns.length;
    beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1.0;
  }

  // Sharpe Ratio (assuming 0% risk-free rate for simplicity)
  const annualizedReturn = avgReturn * 252;
  const sharpeRatio =
    annualizedVolatility > 0 ? annualizedReturn / annualizedVolatility : 0;

  // Drawdown
  let peak = performance[0].value;
  let maxDrawdown = 0;
  let currentDrawdown = 0;

  for (const point of performance) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = peak > 0 ? (peak - point.value) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const currentValue = performance[performance.length - 1].value;
  currentDrawdown = peak > 0 ? (peak - currentValue) / peak : 0;

  // Concentration metrics
  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

  // Sector concentration (Herfindahl index)
  const sectorMap = new Map<string, number>();
  for (const position of positions) {
    const sector = position.sector || "Unknown";
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + position.marketValue);
  }
  const sectorWeights = Array.from(sectorMap.values()).map((v) =>
    totalValue > 0 ? v / totalValue : 0
  );
  const sectorConcentration = sectorWeights.reduce(
    (sum, w) => sum + w * w,
    0
  );

  // Position concentration (Herfindahl index)
  const positionWeights = positions.map((p) =>
    totalValue > 0 ? p.marketValue / totalValue : 0
  );
  const positionConcentration = positionWeights.reduce(
    (sum, w) => sum + w * w,
    0
  );

  // Value at Risk (95% confidence, assuming normal distribution)
  const valueAtRisk = totalValue * (1.645 * dailyVolatility);

  return {
    dailyVolatility,
    annualizedVolatility,
    beta,
    sharpeRatio,
    maxDrawdown,
    currentDrawdown,
    sectorConcentration,
    positionConcentration,
    valueAtRisk,
  };
}

/**
 * Compare portfolio to benchmark
 */
export function compareToBenchmark(
  portfolioPerformance: PortfolioPerformance[],
  benchmarkPerformance: PortfolioPerformance[],
  benchmarkSymbol: string,
  benchmarkName: string
): BenchmarkComparison {
  if (portfolioPerformance.length === 0 || benchmarkPerformance.length === 0) {
    return {
      benchmarkSymbol,
      benchmarkName,
      portfolioReturn: 0,
      benchmarkReturn: 0,
      alpha: 0,
      correlation: 0,
    };
  }

  // Calculate returns
  const portfolioStart = portfolioPerformance[0].value;
  const portfolioEnd = portfolioPerformance[portfolioPerformance.length - 1].value;
  const portfolioReturn =
    portfolioStart > 0 ? ((portfolioEnd - portfolioStart) / portfolioStart) * 100 : 0;

  const benchmarkStart = benchmarkPerformance[0].value;
  const benchmarkEnd = benchmarkPerformance[benchmarkPerformance.length - 1].value;
  const benchmarkReturn =
    benchmarkStart > 0 ? ((benchmarkEnd - benchmarkStart) / benchmarkStart) * 100 : 0;

  const alpha = portfolioReturn - benchmarkReturn;

  // Calculate correlation
  const minLength = Math.min(portfolioPerformance.length, benchmarkPerformance.length);
  const portfolioReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let i = 1; i < minLength; i++) {
    const pPrev = portfolioPerformance[i - 1].value;
    const pCurr = portfolioPerformance[i].value;
    const bPrev = benchmarkPerformance[i - 1].value;
    const bCurr = benchmarkPerformance[i].value;

    if (pPrev > 0 && bPrev > 0) {
      portfolioReturns.push((pCurr - pPrev) / pPrev);
      benchmarkReturns.push((bCurr - bPrev) / bPrev);
    }
  }

  let correlation = 0;
  if (portfolioReturns.length > 0) {
    const avgP =
      portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const avgB =
      benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

    const covariance =
      portfolioReturns.reduce(
        (sum, r, i) => sum + (r - avgP) * (benchmarkReturns[i] - avgB),
        0
      ) / portfolioReturns.length;

    const stdP = Math.sqrt(
      portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgP, 2), 0) /
        portfolioReturns.length
    );
    const stdB = Math.sqrt(
      benchmarkReturns.reduce((sum, r) => sum + Math.pow(r - avgB, 2), 0) /
        benchmarkReturns.length
    );

    correlation = stdP > 0 && stdB > 0 ? covariance / (stdP * stdB) : 0;
  }

  return {
    benchmarkSymbol,
    benchmarkName,
    portfolioReturn,
    benchmarkReturn,
    alpha,
    correlation,
  };
}
