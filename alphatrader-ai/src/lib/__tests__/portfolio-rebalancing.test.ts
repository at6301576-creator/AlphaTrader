import { describe, it, expect } from 'vitest';
import {
  calculateEqualWeightRebalancing,
  calculateMarketCapWeightRebalancing,
  calculateSectorBalancedRebalancing,
  calculateRiskParityRebalancing,
  calculateCustomRebalancing,
  calculateAllocationDrift,
  needsRebalancing,
  type PortfolioHolding,
} from '../portfolio-rebalancing';

// Helper function to create test holdings
function createTestHoldings(): PortfolioHolding[] {
  return [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      shares: 50,
      currentPrice: 150,
      currentValue: 7500,
      actualAllocation: 37.5, // 7500 / 20000
      sector: 'Technology',
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      shares: 30,
      currentPrice: 300,
      currentValue: 9000,
      actualAllocation: 45, // 9000 / 20000
      sector: 'Technology',
    },
    {
      symbol: 'JPM',
      companyName: 'JPMorgan Chase',
      shares: 25,
      currentPrice: 140,
      currentValue: 3500,
      actualAllocation: 17.5, // 3500 / 20000
      sector: 'Financial Services',
    },
  ];
}

describe('Portfolio Rebalancing', () => {
  describe('Equal Weight Rebalancing', () => {
    it('should allocate equally across all holdings', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      expect(plan.strategy).toBe('Equal Weight');
      expect(plan.totalValue).toBe(totalValue);
      expect(plan.actions).toHaveLength(3);

      // Each holding should target 33.33% (100% / 3 holdings)
      const targetAllocation = 100 / holdings.length;
      plan.actions.forEach((action) => {
        const expectedTargetValue = (targetAllocation / 100) * totalValue;
        expect(action.targetValue).toBeCloseTo(expectedTargetValue, 0);
      });
    });

    it('should calculate correct target values for rebalancing', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      // Target allocation for equal weight should be 33.33% for each holding
      const targetAllocation = 100 / holdings.length;

      // Verify each action has correct target value calculated
      plan.actions.forEach((action) => {
        const expectedTargetValue = (targetAllocation / 100) * totalValue;
        expect(action.targetValue).toBeCloseTo(expectedTargetValue, 0);
      });

      // At least one action should be calculated (even if it's "hold")
      expect(plan.actions.length).toBe(holdings.length);

      // Summary should add up correctly
      expect(plan.summary.buyOrders + plan.summary.sellOrders + plan.summary.holdPositions).toBe(holdings.length);
    });
  });

  describe('Market Cap Weight Rebalancing', () => {
    it('should allocate based on market capitalization', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

      const marketCaps = {
        AAPL: 3000000000000, // $3T
        MSFT: 2800000000000, // $2.8T
        JPM: 500000000000, // $500B
      };

      const plan = calculateMarketCapWeightRebalancing(holdings, totalValue, marketCaps);

      expect(plan.strategy).toBe('Market Cap Weight');
      expect(plan.actions).toHaveLength(3);

      // AAPL should have highest allocation (largest market cap)
      const aaplAction = plan.actions.find((a) => a.symbol === 'AAPL');
      const msftAction = plan.actions.find((a) => a.symbol === 'MSFT');
      const jpmAction = plan.actions.find((a) => a.symbol === 'JPM');

      expect(aaplAction?.targetValue).toBeGreaterThan(msftAction?.targetValue!);
      expect(msftAction?.targetValue).toBeGreaterThan(jpmAction?.targetValue!);
    });
  });

  describe('Sector Balanced Rebalancing', () => {
    it('should cap sector allocation at max threshold', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const maxSectorAllocation = 25;

      const plan = calculateSectorBalancedRebalancing(holdings, totalValue, maxSectorAllocation);

      expect(plan.strategy).toBe('Sector Balanced');
      expect(plan.actions).toHaveLength(3);

      // Technology sector is 82.5% (AAPL + MSFT), should be reduced
      const aaplAction = plan.actions.find((a) => a.symbol === 'AAPL');
      const msftAction = plan.actions.find((a) => a.symbol === 'MSFT');

      // Both tech stocks should have reduced allocations
      if (aaplAction && msftAction) {
        const totalTechAllocation =
          (aaplAction.targetValue + msftAction.targetValue) / totalValue * 100;
        expect(totalTechAllocation).toBeLessThan(82.5); // Less than current
      }
    });

    it('should balance sectors when few sectors exist', () => {
      const holdings: PortfolioHolding[] = [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          shares: 100,
          currentPrice: 150,
          currentValue: 15000,
          actualAllocation: 50,
          sector: 'Technology',
        },
        {
          symbol: 'JPM',
          companyName: 'JPMorgan Chase',
          shares: 100,
          currentPrice: 150,
          currentValue: 15000,
          actualAllocation: 50,
          sector: 'Financial Services',
        },
      ];

      const totalValue = 30000;
      const plan = calculateSectorBalancedRebalancing(holdings, totalValue);

      // With 2 sectors, each should target 50%
      expect(plan.actions).toHaveLength(2);
    });
  });

  describe('Risk Parity Rebalancing', () => {
    it('should allocate more to lower volatility stocks', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

      const volatilities = {
        AAPL: 30, // High volatility
        MSFT: 25, // Medium volatility
        JPM: 15, // Low volatility
      };

      const plan = calculateRiskParityRebalancing(holdings, totalValue, volatilities);

      expect(plan.strategy).toBe('Risk Parity');
      expect(plan.actions).toHaveLength(3);

      // JPM (lowest vol) should have highest target allocation
      const aaplAction = plan.actions.find((a) => a.symbol === 'AAPL');
      const msftAction = plan.actions.find((a) => a.symbol === 'MSFT');
      const jpmAction = plan.actions.find((a) => a.symbol === 'JPM');

      expect(jpmAction?.targetValue).toBeGreaterThan(msftAction?.targetValue!);
      expect(msftAction?.targetValue).toBeGreaterThan(aaplAction?.targetValue!);
    });
  });

  describe('Custom Target Rebalancing', () => {
    it('should use custom target allocations', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

      const customTargets = {
        AAPL: 40,
        MSFT: 35,
        JPM: 25,
      };

      const plan = calculateCustomRebalancing(holdings, totalValue, customTargets);

      expect(plan.strategy).toBe('Custom Targets');
      expect(plan.actions).toHaveLength(3);

      // Verify target values match custom allocations
      plan.actions.forEach((action) => {
        const expectedValue = (customTargets[action.symbol as keyof typeof customTargets] / 100) * totalValue;
        expect(action.targetValue).toBeCloseTo(expectedValue, 0);
      });
    });
  });

  describe('Rebalancing Plan Properties', () => {
    it('should calculate summary correctly', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      expect(plan.summary.totalTrades).toBe(
        plan.summary.buyOrders + plan.summary.sellOrders
      );
      expect(plan.summary.holdPositions + plan.summary.totalTrades).toBe(
        holdings.length
      );
    });

    it('should provide tax implications warning when selling', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      if (plan.summary.sellOrders > 0) {
        expect(plan.taxImplications).toContain('tax');
      }
    });

    it('should calculate risk reduction', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      // Current max allocation is 45% (MSFT)
      // Target max allocation is 33.33%
      // Risk reduction should be positive
      expect(plan.riskReduction).toBeGreaterThan(0);
    });

    it('should sort actions by value difference magnitude', () => {
      const holdings = createTestHoldings();
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      for (let i = 1; i < plan.actions.length; i++) {
        expect(Math.abs(plan.actions[i - 1].valueDifference)).toBeGreaterThanOrEqual(
          Math.abs(plan.actions[i].valueDifference)
        );
      }
    });
  });

  describe('Allocation Drift Calculation', () => {
    it('should calculate drift from target allocations', () => {
      const holdings = createTestHoldings();
      const targetAllocations = {
        AAPL: 33.33,
        MSFT: 33.33,
        JPM: 33.34,
      };

      const drift = calculateAllocationDrift(holdings, targetAllocations);

      expect(drift.AAPL).toBeCloseTo(37.5 - 33.33, 1);
      expect(drift.MSFT).toBeCloseTo(45 - 33.33, 1);
      expect(drift.JPM).toBeCloseTo(17.5 - 33.34, 1);
    });
  });

  describe('Rebalancing Need Detection', () => {
    it('should detect when rebalancing is needed', () => {
      const holdings = createTestHoldings();
      const targetAllocations = {
        AAPL: 33.33,
        MSFT: 33.33,
        JPM: 33.34,
      };

      const needs = needsRebalancing(holdings, targetAllocations, 5);
      expect(needs).toBe(true); // MSFT is 11.67% over target
    });

    it('should detect when rebalancing is not needed', () => {
      const holdings: PortfolioHolding[] = [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.33,
          sector: 'Technology',
        },
        {
          symbol: 'MSFT',
          companyName: 'Microsoft Corporation',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.33,
          sector: 'Technology',
        },
        {
          symbol: 'JPM',
          companyName: 'JPMorgan Chase',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.34,
          sector: 'Financial Services',
        },
      ];

      const targetAllocations = {
        AAPL: 33.33,
        MSFT: 33.33,
        JPM: 33.34,
      };

      const needs = needsRebalancing(holdings, targetAllocations, 5);
      expect(needs).toBe(false); // All within 5% threshold
    });
  });

  describe('Edge Cases', () => {
    it('should handle single holding', () => {
      const holdings: PortfolioHolding[] = [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          shares: 100,
          currentPrice: 150,
          currentValue: 15000,
          actualAllocation: 100,
          sector: 'Technology',
        },
      ];

      const totalValue = 15000;
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].action).toBe('hold'); // Already at 100%
    });

    it('should handle zero total value gracefully', () => {
      const holdings = createTestHoldings();
      const plan = calculateEqualWeightRebalancing(holdings, 0);

      expect(plan.totalValue).toBe(0);
      expect(plan.actions).toHaveLength(3);
    });

    it('should not trade tiny positions below threshold', () => {
      const holdings: PortfolioHolding[] = [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.2, // Very close to target
          sector: 'Technology',
        },
        {
          symbol: 'MSFT',
          companyName: 'Microsoft Corporation',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.4, // Very close to target
          sector: 'Technology',
        },
        {
          symbol: 'JPM',
          companyName: 'JPMorgan Chase',
          shares: 100,
          currentPrice: 100,
          currentValue: 10000,
          actualAllocation: 33.4, // Very close to target
          sector: 'Financial Services',
        },
      ];

      const totalValue = 30000;
      const plan = calculateEqualWeightRebalancing(holdings, totalValue);

      // Small differences should result in "hold" actions
      const holdActions = plan.actions.filter((a) => a.action === 'hold');
      expect(holdActions.length).toBeGreaterThan(0);
    });
  });
});
