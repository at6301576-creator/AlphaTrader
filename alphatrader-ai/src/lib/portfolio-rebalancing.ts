/**
 * Portfolio Rebalancing Library
 * Advanced algorithms for portfolio optimization and rebalancing
 */

export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  shares: number;
  currentPrice: number;
  currentValue: number;
  targetAllocation?: number;
  actualAllocation: number;
  sector?: string;
}

export interface RebalancingAction {
  symbol: string;
  companyName: string;
  action: "buy" | "sell" | "hold";
  currentShares: number;
  targetShares: number;
  sharesToTrade: number;
  currentValue: number;
  targetValue: number;
  valueDifference: number;
  reason: string;
}

export interface RebalancingStrategy {
  name: string;
  description: string;
  targetAllocations: Record<string, number>; // symbol -> percentage
}

export interface RebalancingPlan {
  strategy: string;
  totalValue: number;
  actions: RebalancingAction[];
  estimatedCost: number;
  taxImplications?: string;
  riskReduction: number;
  summary: {
    buyOrders: number;
    sellOrders: number;
    holdPositions: number;
    totalTrades: number;
  };
}

/**
 * Equal Weight Strategy
 * Allocates portfolio equally across all holdings
 */
export function calculateEqualWeightRebalancing(
  holdings: PortfolioHolding[],
  totalValue: number
): RebalancingPlan {
  const targetAllocation = 100 / holdings.length;
  const targetAllocations: Record<string, number> = {};

  holdings.forEach(h => {
    targetAllocations[h.symbol] = targetAllocation;
  });

  return calculateRebalancingPlan(holdings, totalValue, targetAllocations, "Equal Weight");
}

/**
 * Market Cap Weight Strategy
 * Allocates based on market capitalization (simulated by current value)
 */
export function calculateMarketCapWeightRebalancing(
  holdings: PortfolioHolding[],
  totalValue: number,
  marketCaps: Record<string, number> // symbol -> market cap
): RebalancingPlan {
  const totalMarketCap = Object.values(marketCaps).reduce((a, b) => a + b, 0);
  const targetAllocations: Record<string, number> = {};

  holdings.forEach(h => {
    const marketCap = marketCaps[h.symbol] || 0;
    targetAllocations[h.symbol] = totalMarketCap > 0 ? (marketCap / totalMarketCap) * 100 : 0;
  });

  return calculateRebalancingPlan(holdings, totalValue, targetAllocations, "Market Cap Weight");
}

/**
 * Sector Balance Strategy
 * Ensures no sector exceeds a certain threshold
 */
export function calculateSectorBalancedRebalancing(
  holdings: PortfolioHolding[],
  totalValue: number,
  maxSectorAllocation: number = 25 // Max 25% per sector
): RebalancingPlan {
  // Group by sector
  const sectorGroups: Record<string, PortfolioHolding[]> = {};
  holdings.forEach(h => {
    const sector = h.sector || "Unknown";
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(h);
  });

  const targetAllocations: Record<string, number> = {};
  const sectors = Object.keys(sectorGroups);

  // If we have few sectors, distribute evenly
  if (sectors.length <= 3) {
    const sectorTarget = 100 / sectors.length;
    sectors.forEach(sector => {
      const sectorHoldings = sectorGroups[sector];
      const holdingTarget = sectorTarget / sectorHoldings.length;
      sectorHoldings.forEach(h => {
        targetAllocations[h.symbol] = holdingTarget;
      });
    });
  } else {
    // Cap each sector at maxSectorAllocation
    sectors.forEach(sector => {
      const sectorHoldings = sectorGroups[sector];
      const sectorCurrentValue = sectorHoldings.reduce((sum, h) => sum + h.currentValue, 0);
      const sectorCurrentAllocation = (sectorCurrentValue / totalValue) * 100;

      if (sectorCurrentAllocation > maxSectorAllocation) {
        // Reduce this sector
        const holdingTarget = maxSectorAllocation / sectorHoldings.length;
        sectorHoldings.forEach(h => {
          targetAllocations[h.symbol] = holdingTarget;
        });
      } else {
        // Maintain current allocation
        sectorHoldings.forEach(h => {
          targetAllocations[h.symbol] = h.actualAllocation;
        });
      }
    });

    // Normalize to 100%
    const totalAllocation = Object.values(targetAllocations).reduce((a, b) => a + b, 0);
    if (totalAllocation > 0) {
      Object.keys(targetAllocations).forEach(symbol => {
        targetAllocations[symbol] = (targetAllocations[symbol] / totalAllocation) * 100;
      });
    }
  }

  return calculateRebalancingPlan(holdings, totalValue, targetAllocations, "Sector Balanced");
}

/**
 * Risk Parity Strategy
 * Allocates based on inverse volatility (lower volatility = higher allocation)
 */
export function calculateRiskParityRebalancing(
  holdings: PortfolioHolding[],
  totalValue: number,
  volatilities: Record<string, number> // symbol -> annualized volatility
): RebalancingPlan {
  // Calculate inverse volatility weights
  const inverseVolatilities: Record<string, number> = {};
  let totalInverseVol = 0;

  holdings.forEach(h => {
    const vol = volatilities[h.symbol] || 20; // Default 20% if not provided
    const inverseVol = vol > 0 ? 1 / vol : 0;
    inverseVolatilities[h.symbol] = inverseVol;
    totalInverseVol += inverseVol;
  });

  // Calculate target allocations
  const targetAllocations: Record<string, number> = {};
  holdings.forEach(h => {
    targetAllocations[h.symbol] = totalInverseVol > 0
      ? (inverseVolatilities[h.symbol] / totalInverseVol) * 100
      : 100 / holdings.length;
  });

  return calculateRebalancingPlan(holdings, totalValue, targetAllocations, "Risk Parity");
}

/**
 * Custom Target Strategy
 * User-defined target allocations
 */
export function calculateCustomRebalancing(
  holdings: PortfolioHolding[],
  totalValue: number,
  customTargets: Record<string, number> // symbol -> percentage
): RebalancingPlan {
  return calculateRebalancingPlan(holdings, totalValue, customTargets, "Custom Targets");
}

/**
 * Core rebalancing calculation engine
 */
function calculateRebalancingPlan(
  holdings: PortfolioHolding[],
  totalValue: number,
  targetAllocations: Record<string, number>,
  strategyName: string
): RebalancingPlan {
  const actions: RebalancingAction[] = [];
  let estimatedCost = 0;
  const tradingCostPerTrade = 0; // Assume commission-free trading

  holdings.forEach(holding => {
    const targetAllocation = targetAllocations[holding.symbol] || 0;
    const targetValue = (targetAllocation / 100) * totalValue;
    const targetShares = holding.currentPrice > 0 ? targetValue / holding.currentPrice : 0;
    const sharesToTrade = targetShares - holding.shares;
    const valueDifference = targetValue - holding.currentValue;

    let action: "buy" | "sell" | "hold" = "hold";
    let reason = "";

    // Use a threshold to avoid tiny trades (< 1% of position or $100)
    const threshold = Math.max(holding.currentValue * 0.01, 100);

    if (Math.abs(valueDifference) > threshold) {
      if (sharesToTrade > 0) {
        action = "buy";
        reason = `Increase allocation from ${holding.actualAllocation.toFixed(1)}% to ${targetAllocation.toFixed(1)}%`;
        estimatedCost += tradingCostPerTrade;
      } else if (sharesToTrade < 0) {
        action = "sell";
        reason = `Reduce allocation from ${holding.actualAllocation.toFixed(1)}% to ${targetAllocation.toFixed(1)}%`;
        estimatedCost += tradingCostPerTrade;
      }
    } else {
      reason = `Current allocation (${holding.actualAllocation.toFixed(1)}%) is close to target (${targetAllocation.toFixed(1)}%)`;
    }

    actions.push({
      symbol: holding.symbol,
      companyName: holding.companyName,
      action,
      currentShares: holding.shares,
      targetShares: Math.round(targetShares * 100) / 100, // Round to 2 decimals
      sharesToTrade: Math.round(sharesToTrade * 100) / 100,
      currentValue: holding.currentValue,
      targetValue,
      valueDifference,
      reason,
    });
  });

  // Calculate summary
  const buyOrders = actions.filter(a => a.action === "buy").length;
  const sellOrders = actions.filter(a => a.action === "sell").length;
  const holdPositions = actions.filter(a => a.action === "hold").length;

  // Calculate risk reduction (measure of diversification improvement)
  const currentMaxAllocation = Math.max(...holdings.map(h => h.actualAllocation));
  const targetMaxAllocation = Math.max(...Object.values(targetAllocations));
  const riskReduction = currentMaxAllocation - targetMaxAllocation;

  return {
    strategy: strategyName,
    totalValue,
    actions: actions.sort((a, b) => Math.abs(b.valueDifference) - Math.abs(a.valueDifference)),
    estimatedCost,
    riskReduction,
    taxImplications: sellOrders > 0
      ? "Review tax implications before selling positions. Consider tax-loss harvesting opportunities."
      : "No sell orders, minimal tax impact.",
    summary: {
      buyOrders,
      sellOrders,
      holdPositions,
      totalTrades: buyOrders + sellOrders,
    },
  };
}

/**
 * Calculate drift from target allocations
 * Returns percentage points of drift for each holding
 */
export function calculateAllocationDrift(
  holdings: PortfolioHolding[],
  targetAllocations: Record<string, number>
): Record<string, number> {
  const drift: Record<string, number> = {};

  holdings.forEach(h => {
    const target = targetAllocations[h.symbol] || 0;
    drift[h.symbol] = h.actualAllocation - target;
  });

  return drift;
}

/**
 * Determine if rebalancing is needed based on drift threshold
 */
export function needsRebalancing(
  holdings: PortfolioHolding[],
  targetAllocations: Record<string, number>,
  driftThreshold: number = 5 // 5 percentage points
): boolean {
  const drift = calculateAllocationDrift(holdings, targetAllocations);
  return Object.values(drift).some(d => Math.abs(d) > driftThreshold);
}
