import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
  calculateADX,
  calculateCCI,
  calculateWilliamsR,
  calculateOBV,
  calculateParabolicSAR,
  calculateVWAP,
  detectRSISignal,
  detectMACDCrossover,
  detectMACrossover,
  detectStochasticSignal,
  detectADXSignal,
  detectCCISignal,
  detectWilliamsRSignal,
} from '../technical-indicators';
import type { ChartDataPoint } from '@/types/stock';

// Helper function to create test data
function createTestData(length: number = 50): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let basePrice = 100;

  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * 4; // Random change between -2 and +2
    basePrice += change;
    const high = basePrice + Math.random() * 2;
    const low = basePrice - Math.random() * 2;
    const close = basePrice;
    const volume = Math.floor(1000000 + Math.random() * 500000);

    data.push({
      time: `2024-01-${String(i + 1).padStart(2, '0')}` as any,
      open: basePrice - change / 2,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}

describe('Technical Indicators', () => {
  describe('Moving Averages', () => {
    it('should calculate SMA correctly', () => {
      const data = createTestData(20);
      const period = 10;
      const sma = calculateSMA(data, period);

      expect(sma).toHaveLength(data.length - period + 1);
      expect(sma[0].value).toBeGreaterThan(0);

      // First SMA should be average of first 10 closes
      const expectedFirst =
        data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
      expect(sma[0].value).toBeCloseTo(expectedFirst, 2);
    });

    it('should calculate EMA correctly', () => {
      const data = createTestData(20);
      const period = 10;
      const ema = calculateEMA(data, period);

      expect(ema).toHaveLength(data.length - period + 1);
      expect(ema[0].value).toBeGreaterThan(0);
      // EMA should react faster than SMA to price changes
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const data = createTestData(30);
      const period = 20;
      const stdDev = 2;
      const bb = calculateBollingerBands(data, period, stdDev);

      expect(bb.upper).toHaveLength(data.length - period + 1);
      expect(bb.middle).toHaveLength(data.length - period + 1);
      expect(bb.lower).toHaveLength(data.length - period + 1);

      // Upper band should be above middle, middle above lower
      expect(bb.upper[0].value).toBeGreaterThan(bb.middle[0].value);
      expect(bb.middle[0].value).toBeGreaterThan(bb.lower[0].value);
    });
  });

  describe('RSI', () => {
    it('should calculate RSI correctly', () => {
      const data = createTestData(30);
      const rsi = calculateRSI(data, 14);

      expect(rsi.length).toBeGreaterThan(0);

      // RSI should be between 0 and 100
      rsi.forEach((point) => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    });

    it('should detect overbought condition', () => {
      const signal = detectRSISignal(75);
      expect(signal.type).toBe('overbought');
      expect(signal.value).toBe(75);
    });

    it('should detect oversold condition', () => {
      const signal = detectRSISignal(25);
      expect(signal.type).toBe('oversold');
      expect(signal.value).toBe(25);
    });

    it('should detect neutral condition', () => {
      const signal = detectRSISignal(50);
      expect(signal.type).toBe('neutral');
    });
  });

  describe('MACD', () => {
    it('should calculate MACD correctly', () => {
      const data = createTestData(50);
      const macd = calculateMACD(data, 12, 26, 9);

      expect(macd.macd.length).toBeGreaterThan(0);
      expect(macd.signal.length).toBeGreaterThan(0);
      expect(macd.histogram.length).toBeGreaterThan(0);

      // Histogram should be MACD - Signal
      const lastMacd = macd.macd[macd.macd.length - 1].value;
      const lastSignal = macd.signal[macd.signal.length - 1].value;
      const lastHist = macd.histogram[macd.histogram.length - 1].value;

      expect(lastHist).toBeCloseTo(lastMacd - lastSignal, 2);
    });

    it('should detect bullish crossover', () => {
      const signal = detectMACDCrossover(5, 4, 4, 5);
      expect(signal.type).toBe('bullish_crossover');
    });

    it('should detect bearish crossover', () => {
      const signal = detectMACDCrossover(-5, -4, -4, -5);
      expect(signal.type).toBe('bearish_crossover');
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate Stochastic correctly', () => {
      const data = createTestData(30);
      const stoch = calculateStochastic(data, 14, 3);

      expect(stoch.k.length).toBeGreaterThan(0);
      expect(stoch.d.length).toBeGreaterThan(0);

      // %K and %D should be between 0 and 100
      stoch.k.forEach((point) => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });

      stoch.d.forEach((point) => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    });

    it('should detect overbought condition', () => {
      const signal = detectStochasticSignal(85, 85);
      expect(signal.type).toBe('overbought');
    });

    it('should detect oversold condition', () => {
      const signal = detectStochasticSignal(15, 15);
      expect(signal.type).toBe('oversold');
    });
  });

  describe('ATR', () => {
    it('should calculate ATR correctly', () => {
      const data = createTestData(30);
      const atr = calculateATR(data, 14);

      expect(atr.length).toBeGreaterThan(0);

      // ATR should always be positive
      atr.forEach((point) => {
        expect(point.value).toBeGreaterThan(0);
      });
    });
  });

  describe('ADX', () => {
    it('should calculate ADX correctly', () => {
      const data = createTestData(50);
      const adx = calculateADX(data, 14);

      expect(adx.adx.length).toBeGreaterThan(0);
      expect(adx.plusDI.length).toBeGreaterThan(0);
      expect(adx.minusDI.length).toBeGreaterThan(0);

      // ADX should be between 0 and 100
      adx.adx.forEach((point) => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    });

    it('should detect trend strength', () => {
      const signal = detectADXSignal(45, 30, 15);
      expect(signal.type).toBe('strong_trend');
      expect(signal.trendDirection).toBe('bullish');
    });

    it('should detect weak trend', () => {
      const signal = detectADXSignal(25, 20, 18);
      expect(signal.type).toBe('weak_trend');
    });

    it('should detect no trend', () => {
      const signal = detectADXSignal(15, 10, 12);
      expect(signal.type).toBe('no_trend');
    });
  });

  describe('CCI', () => {
    it('should calculate CCI correctly', () => {
      const data = createTestData(30);
      const cci = calculateCCI(data, 20);

      expect(cci.length).toBeGreaterThan(0);

      // CCI typically ranges from -300 to +300
      cci.forEach((point) => {
        expect(point.value).toBeGreaterThan(-500);
        expect(point.value).toBeLessThan(500);
      });
    });

    it('should detect overbought condition', () => {
      const signal = detectCCISignal(150);
      expect(signal.type).toBe('overbought');
    });

    it('should detect oversold condition', () => {
      const signal = detectCCISignal(-150);
      expect(signal.type).toBe('oversold');
    });
  });

  describe('Williams %R', () => {
    it('should calculate Williams %R correctly', () => {
      const data = createTestData(30);
      const willR = calculateWilliamsR(data, 14);

      expect(willR.length).toBeGreaterThan(0);

      // Williams %R should be between -100 and 0
      willR.forEach((point) => {
        expect(point.value).toBeGreaterThanOrEqual(-100);
        expect(point.value).toBeLessThanOrEqual(0);
      });
    });

    it('should detect overbought condition', () => {
      const signal = detectWilliamsRSignal(-10);
      expect(signal.type).toBe('overbought');
    });

    it('should detect oversold condition', () => {
      const signal = detectWilliamsRSignal(-85);
      expect(signal.type).toBe('oversold');
    });
  });

  describe('OBV', () => {
    it('should calculate OBV correctly', () => {
      const data = createTestData(30);
      const obv = calculateOBV(data);

      expect(obv).toHaveLength(data.length);

      // First OBV should equal first volume
      expect(obv[0].value).toBe(data[0].volume);
    });
  });

  describe('Parabolic SAR', () => {
    it('should calculate Parabolic SAR correctly', () => {
      const data = createTestData(30);
      const sar = calculateParabolicSAR(data, 0.02, 0.2);

      expect(sar).toHaveLength(data.length);

      // SAR should have trend direction
      sar.forEach((point) => {
        expect(['up', 'down']).toContain(point.trend);
      });
    });
  });

  describe('VWAP', () => {
    it('should calculate VWAP correctly', () => {
      const data = createTestData(30);
      const vwap = calculateVWAP(data);

      expect(vwap).toHaveLength(data.length);

      // VWAP should be positive
      vwap.forEach((point) => {
        expect(point.value).toBeGreaterThan(0);
      });
    });
  });

  describe('MA Crossover Detection', () => {
    it('should detect golden cross', () => {
      const signal = detectMACrossover(105, 100, 95, 100);
      expect(signal.type).toBe('golden_cross');
    });

    it('should detect death cross', () => {
      const signal = detectMACrossover(95, 100, 105, 100);
      expect(signal.type).toBe('death_cross');
    });

    it('should detect neutral when no crossover', () => {
      const signal = detectMACrossover(105, 100, 105, 100);
      expect(signal.type).toBe('neutral');
    });
  });
});
