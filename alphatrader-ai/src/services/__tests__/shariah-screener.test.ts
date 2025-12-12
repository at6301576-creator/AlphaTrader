import { describe, it, expect } from 'vitest';
import { quickShariahCheck, screenShariahCompliance } from '../shariah-screener';

describe('Shariah Screener', () => {
  describe('quickShariahCheck', () => {
    it('should pass compliant industries', () => {
      const result = quickShariahCheck('Technology', 'Computer Software');
      expect(result).toBe(true);
    });

    it('should fail non-compliant industries', () => {
      const result = quickShariahCheck('Consumer Goods', 'Alcoholic Beverages');
      expect(result).toBe(false);
    });

    it('should fail financial services', () => {
      const result = quickShariahCheck('Financial', 'Banking');
      expect(result).toBe(false);
    });
  });

  describe('screenShariahCompliance', () => {
    it('should pass compliant stocks with good ratios', () => {
      const result = screenShariahCompliance(
        { sector: 'Technology', industry: 'Computer Software' },
        {
          totalDebt: 100,
          totalEquity: 500,
          totalAssets: 1000,
          marketCap: 1000,
          cash: 50,
          accountsReceivable: 100,
          totalRevenue: 500,
          interestIncome: 5,
        }
      );

      expect(result.overallStatus).toBe('compliant');
      expect(result.businessScreening.passed).toBe(true);
      expect(result.financialScreening.debtToEquityPassed).toBe(true);
    });

    it('should fail stocks with high debt', () => {
      const result = screenShariahCompliance(
        { sector: 'Technology', industry: 'Computer Software' },
        {
          totalDebt: 500,
          totalEquity: 500,
          totalAssets: 1000,
          marketCap: 1000,
        }
      );

      expect(result.financialScreening.debtToEquityPassed).toBe(false);
    });

    it('should fail non-compliant industries', () => {
      const result = screenShariahCompliance(
        { sector: 'Consumer Goods', industry: 'Alcoholic Beverages' },
        {
          totalDebt: 100,
          totalEquity: 500,
        }
      );

      expect(result.overallStatus).toBe('non-compliant');
      expect(result.businessScreening.passed).toBe(false);
    });
  });
});
