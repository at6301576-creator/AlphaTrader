import type { ChartDataPoint } from "@/types/stock";
import type { Time } from "lightweight-charts";

/**
 * Technical Indicators Library
 * Comprehensive collection of technical analysis indicators
 */

// ============================================================================
// MOVING AVERAGES
// ============================================================================

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(
  data: ChartDataPoint[],
  period: number
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
    result.push({
      time: data[i].time as Time,
      value: sum / period,
    });
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: ChartDataPoint[],
  period: number
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first value
  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  result.push({
    time: data[period - 1].time as Time,
    value: ema,
  });

  // Calculate EMA for the rest
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time as Time,
      value: ema,
    });
  }

  return result;
}

/**
 * Helper function to calculate EMA values as array
 */
function calculateEMAValues(data: ChartDataPoint[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  result[period - 1] = ema;

  // Calculate EMA for the rest
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result[i] = ema;
  }

  return result;
}

// ============================================================================
// BOLLINGER BANDS
// ============================================================================

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: ChartDataPoint[],
  period: number,
  stdDev: number
): {
  upper: Array<{ time: Time; value: number }>;
  middle: Array<{ time: Time; value: number }>;
  lower: Array<{ time: Time; value: number }>;
} {
  const upper: Array<{ time: Time; value: number }> = [];
  const middle: Array<{ time: Time; value: number }> = [];
  const lower: Array<{ time: Time; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sma = slice.reduce((acc, d) => acc + d.close, 0) / period;

    // Calculate standard deviation
    const squaredDiffs = slice.map((d) => Math.pow(d.close - sma, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
    const sd = Math.sqrt(variance);

    middle.push({ time: data[i].time as Time, value: sma });
    upper.push({ time: data[i].time as Time, value: sma + stdDev * sd });
    lower.push({ time: data[i].time as Time, value: sma - stdDev * sd });
  }

  return { upper, middle, lower };
}

// ============================================================================
// RSI (Relative Strength Index)
// ============================================================================

/**
 * RSI - Momentum oscillator (0-100)
 * Overbought > 70, Oversold < 30
 */
export function calculateRSI(
  data: ChartDataPoint[],
  period: number = 14
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < period + 1) return result;

  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate first average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate first RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  result.push({
    time: data[period].time as Time,
    value: rsi,
  });

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i + 1].time as Time,
      value: rsi,
    });
  }

  return result;
}

// ============================================================================
// MACD (Moving Average Convergence Divergence)
// ============================================================================

/**
 * MACD - Trend-following momentum indicator
 * Returns MACD line, Signal line, and Histogram
 */
export function calculateMACD(
  data: ChartDataPoint[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: Array<{ time: Time; value: number; color?: string }>;
  signal: Array<{ time: Time; value: number }>;
  histogram: Array<{ time: Time; value: number; color?: string }>;
} {
  const macd: Array<{ time: Time; value: number }> = [];
  const signal: Array<{ time: Time; value: number }> = [];
  const histogram: Array<{ time: Time; value: number; color?: string }> = [];

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMAValues(data, fastPeriod);
  const slowEMA = calculateEMAValues(data, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const startIndex = slowPeriod - 1;
  for (let i = startIndex; i < data.length; i++) {
    const macdValue = fastEMA[i] - slowEMA[i];
    macd.push({
      time: data[i].time as Time,
      value: macdValue,
    });
  }

  // Calculate signal line (EMA of MACD)
  if (macd.length < signalPeriod) return { macd, signal, histogram };

  const multiplier = 2 / (signalPeriod + 1);
  let signalEMA = macd.slice(0, signalPeriod).reduce((acc, d) => acc + d.value, 0) / signalPeriod;

  signal.push({
    time: macd[signalPeriod - 1].time,
    value: signalEMA,
  });

  for (let i = signalPeriod; i < macd.length; i++) {
    signalEMA = (macd[i].value - signalEMA) * multiplier + signalEMA;
    signal.push({
      time: macd[i].time,
      value: signalEMA,
    });
  }

  // Calculate histogram (MACD - Signal) with color
  for (let i = 0; i < signal.length; i++) {
    const histValue = macd[i + signalPeriod - 1].value - signal[i].value;
    histogram.push({
      time: signal[i].time,
      value: histValue,
      color: histValue >= 0 ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
    });
  }

  return { macd, signal, histogram };
}

// ============================================================================
// STOCHASTIC OSCILLATOR
// ============================================================================

/**
 * Stochastic Oscillator - Momentum indicator
 * %K line and %D line (0-100)
 * Overbought > 80, Oversold < 20
 */
export function calculateStochastic(
  data: ChartDataPoint[],
  kPeriod: number = 14,
  dPeriod: number = 3
): {
  k: Array<{ time: Time; value: number }>;
  d: Array<{ time: Time; value: number }>;
} {
  const k: Array<{ time: Time; value: number }> = [];
  const d: Array<{ time: Time; value: number }> = [];

  // Calculate %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map((d) => d.high));
    const low = Math.min(...slice.map((d) => d.low));
    const close = data[i].close;

    const kValue = ((close - low) / (high - low)) * 100;
    k.push({
      time: data[i].time as Time,
      value: isNaN(kValue) ? 50 : kValue,
    });
  }

  // Calculate %D (SMA of %K)
  for (let i = dPeriod - 1; i < k.length; i++) {
    const sum = k.slice(i - dPeriod + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
    d.push({
      time: k[i].time,
      value: sum / dPeriod,
    });
  }

  return { k, d };
}

// ============================================================================
// ATR (Average True Range)
// ============================================================================

/**
 * ATR - Volatility indicator
 * Measures market volatility
 */
export function calculateATR(
  data: ChartDataPoint[],
  period: number = 14
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < period + 1) return result;

  const trueRanges: number[] = [];

  // Calculate True Range for each period
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate first ATR (simple average)
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({
    time: data[period].time as Time,
    value: atr,
  });

  // Calculate subsequent ATR values (smoothed)
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push({
      time: data[i + 1].time as Time,
      value: atr,
    });
  }

  return result;
}

/**
 * ADX - Trend strength indicator
 * Measures the strength of a trend (not direction)
 */
export function calculateADX(
  data: ChartDataPoint[],
  period: number = 14
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < period * 2) return result;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trueRanges: number[] = [];

  // Calculate directional movements and true ranges
  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return result;

  // Calculate smoothed +DM, -DM, and TR
  let smoothedPlusDM = plusDM.slice(0, period).reduce((sum, val) => sum + val, 0);
  let smoothedMinusDM = minusDM.slice(0, period).reduce((sum, val) => sum + val, 0);
  let smoothedTR = trueRanges.slice(0, period).reduce((sum, val) => sum + val, 0);

  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = period; i < trueRanges.length; i++) {
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
    smoothedTR = smoothedTR - (smoothedTR / period) + trueRanges[i];

    plusDI.push((smoothedPlusDM / smoothedTR) * 100);
    minusDI.push((smoothedMinusDM / smoothedTR) * 100);
  }

  if (plusDI.length < period) return result;

  // Calculate DX values
  const dx: number[] = [];
  for (let i = 0; i < plusDI.length; i++) {
    const diDiff = Math.abs(plusDI[i] - minusDI[i]);
    const diSum = plusDI[i] + minusDI[i];
    dx.push(diSum === 0 ? 0 : (diDiff / diSum) * 100);
  }

  // Calculate ADX (smoothed DX)
  let adx = dx.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  result.push({
    time: data[period * 2].time as Time,
    value: adx,
  });

  for (let i = period; i < dx.length; i++) {
    adx = ((adx * (period - 1)) + dx[i]) / period;
    result.push({
      time: data[i + period + 1].time as Time,
      value: adx,
    });
  }

  return result;
}

/**
 * Williams %R - Momentum oscillator
 * Similar to Stochastic but measures overbought/oversold on a scale of -100 to 0
 */
export function calculateWilliamsR(
  data: ChartDataPoint[],
  period: number = 14
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map((d) => d.high));
    const lowestLow = Math.min(...slice.map((d) => d.low));
    const close = data[i].close;

    const williamsR = highestHigh !== lowestLow
      ? ((highestHigh - close) / (highestHigh - lowestLow)) * -100
      : -50;

    result.push({
      time: data[i].time as Time,
      value: williamsR,
    });
  }

  return result;
}

/**
 * CCI - Commodity Channel Index
 * Identifies cyclical trends and overbought/oversold conditions
 */
export function calculateCCI(
  data: ChartDataPoint[],
  period: number = 20
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);

    // Calculate Typical Price
    const typicalPrices = slice.map((d) => (d.high + d.low + d.close) / 3);

    // Calculate SMA of Typical Price
    const smaTP = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;

    // Calculate Mean Deviation
    const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;

    // Calculate CCI
    const currentTP = typicalPrices[typicalPrices.length - 1];
    const cci = meanDeviation !== 0 ? (currentTP - smaTP) / (0.015 * meanDeviation) : 0;

    result.push({
      time: data[i].time as Time,
      value: cci,
    });
  }

  return result;
}

/**
 * Parabolic SAR - Stop and Reverse
 * Determines potential reversal points in price direction
 */
export function calculateParabolicSAR(
  data: ChartDataPoint[],
  accelerationFactor: number = 0.02,
  maxAcceleration: number = 0.2
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  if (data.length < 2) return result;

  let isUptrend = data[1].close > data[0].close;
  let sar = isUptrend ? data[0].low : data[0].high;
  let ep = isUptrend ? data[0].high : data[0].low;
  let af = accelerationFactor;

  result.push({
    time: data[0].time as Time,
    value: sar,
  });

  for (let i = 1; i < data.length; i++) {
    const current = data[i];

    // Calculate new SAR
    sar = sar + af * (ep - sar);

    // Check for trend reversal
    let reversed = false;
    if (isUptrend) {
      if (current.low < sar) {
        isUptrend = false;
        reversed = true;
        sar = ep;
        ep = current.low;
        af = accelerationFactor;
      }
    } else {
      if (current.high > sar) {
        isUptrend = true;
        reversed = true;
        sar = ep;
        ep = current.high;
        af = accelerationFactor;
      }
    }

    // Update EP and AF if not reversed
    if (!reversed) {
      if (isUptrend) {
        if (current.high > ep) {
          ep = current.high;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      } else {
        if (current.low < ep) {
          ep = current.low;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    }

    result.push({
      time: current.time as Time,
      value: sar,
    });
  }

  return result;
}

// ============================================================================
// VOLUME INDICATORS
// ============================================================================

/**
 * Volume Moving Average
 */
export function calculateVolumeSMA(
  data: ChartDataPoint[],
  period: number = 20
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.volume, 0);
    result.push({
      time: data[i].time as Time,
      value: sum / period,
    });
  }

  return result;
}

// ============================================================================
// SIGNAL DETECTION FOR ALERTS
// ============================================================================

/**
 * Detect RSI signals
 */
export interface RSISignal {
  type: "overbought" | "oversold" | "neutral";
  value: number;
  threshold: number;
}

export function detectRSISignal(rsiValue: number): RSISignal {
  if (rsiValue >= 70) {
    return { type: "overbought", value: rsiValue, threshold: 70 };
  } else if (rsiValue <= 30) {
    return { type: "oversold", value: rsiValue, threshold: 30 };
  }
  return { type: "neutral", value: rsiValue, threshold: 50 };
}

/**
 * Detect MACD crossover signals
 */
export interface MACDSignal {
  type: "bullish_crossover" | "bearish_crossover" | "neutral";
  macdValue: number;
  signalValue: number;
}

export function detectMACDCrossover(
  currentMACD: number,
  currentSignal: number,
  prevMACD: number,
  prevSignal: number
): MACDSignal {
  // Bullish crossover: MACD crosses above signal
  if (prevMACD <= prevSignal && currentMACD > currentSignal) {
    return {
      type: "bullish_crossover",
      macdValue: currentMACD,
      signalValue: currentSignal,
    };
  }

  // Bearish crossover: MACD crosses below signal
  if (prevMACD >= prevSignal && currentMACD < currentSignal) {
    return {
      type: "bearish_crossover",
      macdValue: currentMACD,
      signalValue: currentSignal,
    };
  }

  return {
    type: "neutral",
    macdValue: currentMACD,
    signalValue: currentSignal,
  };
}

/**
 * Detect Moving Average crossover
 */
export interface MACrossoverSignal {
  type: "golden_cross" | "death_cross" | "neutral";
  fastMA: number;
  slowMA: number;
}

export function detectMACrossover(
  currentFast: number,
  currentSlow: number,
  prevFast: number,
  prevSlow: number
): MACrossoverSignal {
  // Golden Cross: Fast MA crosses above slow MA (bullish)
  if (prevFast <= prevSlow && currentFast > currentSlow) {
    return {
      type: "golden_cross",
      fastMA: currentFast,
      slowMA: currentSlow,
    };
  }

  // Death Cross: Fast MA crosses below slow MA (bearish)
  if (prevFast >= prevSlow && currentFast < currentSlow) {
    return {
      type: "death_cross",
      fastMA: currentFast,
      slowMA: currentSlow,
    };
  }

  return {
    type: "neutral",
    fastMA: currentFast,
    slowMA: currentSlow,
  };
}

/**
 * Detect Stochastic signals
 */
export interface StochasticSignal {
  type: "overbought" | "oversold" | "bullish_crossover" | "bearish_crossover" | "neutral";
  kValue: number;
  dValue: number;
}

export function detectStochasticSignal(
  currentK: number,
  currentD: number,
  prevK?: number,
  prevD?: number
): StochasticSignal {
  // Overbought
  if (currentK >= 80 && currentD >= 80) {
    return { type: "overbought", kValue: currentK, dValue: currentD };
  }

  // Oversold
  if (currentK <= 20 && currentD <= 20) {
    return { type: "oversold", kValue: currentK, dValue: currentD };
  }

  // Check for crossovers if previous values provided
  if (prevK !== undefined && prevD !== undefined) {
    // Bullish crossover: %K crosses above %D
    if (prevK <= prevD && currentK > currentD) {
      return { type: "bullish_crossover", kValue: currentK, dValue: currentD };
    }

    // Bearish crossover: %K crosses below %D
    if (prevK >= prevD && currentK < currentD) {
      return { type: "bearish_crossover", kValue: currentK, dValue: currentD };
    }
  }

  return { type: "neutral", kValue: currentK, dValue: currentD };
}
