/**
 * Technical Calculator Service
 * Calculates technical indicators from chart data and generates analysis signals
 */

import type { ChartDataPoint, TechnicalIndicators, Stock } from "@/types/stock";
import {
  calculateRSI,
  calculateSMA,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands,
} from "./technical-indicators";

/**
 * Calculate all technical indicators for a stock
 */
export function calculateTechnicalIndicators(
  chartData: ChartDataPoint[]
): TechnicalIndicators | null {
  // Need at least 200 data points for reliable calculations
  if (chartData.length < 50) {
    return null;
  }

  try {
    const currentPrice = chartData[chartData.length - 1].close;

    // Calculate RSI
    const rsiData = calculateRSI(chartData, 14);
    const currentRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : null;

    // Calculate Moving Averages
    const sma20Data = calculateSMA(chartData, 20);
    const sma50Data = calculateSMA(chartData, 50);
    const sma200Data = chartData.length >= 200 ? calculateSMA(chartData, 200) : [];

    const ema20Data = calculateEMA(chartData, 20);
    const ema50Data = calculateEMA(chartData, 50);
    const ema200Data = chartData.length >= 200 ? calculateEMA(chartData, 200) : [];

    const currentSMA20 = sma20Data.length > 0 ? sma20Data[sma20Data.length - 1].value : null;
    const currentSMA50 = sma50Data.length > 0 ? sma50Data[sma50Data.length - 1].value : null;
    const currentSMA200 = sma200Data.length > 0 ? sma200Data[sma200Data.length - 1].value : null;

    const currentEMA20 = ema20Data.length > 0 ? ema20Data[ema20Data.length - 1].value : null;
    const currentEMA50 = ema50Data.length > 0 ? ema50Data[ema50Data.length - 1].value : null;
    const currentEMA200 = ema200Data.length > 0 ? ema200Data[ema200Data.length - 1].value : null;

    // Calculate MACD
    const macdData = calculateMACD(chartData, 12, 26, 9);
    const currentMACD =
      macdData.macd.length > 0
        ? {
            value: macdData.macd[macdData.macd.length - 1].value,
            signal: macdData.signal.length > 0 ? macdData.signal[macdData.signal.length - 1].value : 0,
            histogram: macdData.histogram.length > 0 ? macdData.histogram[macdData.histogram.length - 1].value : 0,
          }
        : null;

    // Calculate Bollinger Bands
    const bbData = calculateBollingerBands(chartData, 20, 2);
    const currentBB =
      bbData.upper.length > 0
        ? {
            upper: bbData.upper[bbData.upper.length - 1].value,
            middle: bbData.middle[bbData.middle.length - 1].value,
            lower: bbData.lower[bbData.lower.length - 1].value,
            width: bbData.upper[bbData.upper.length - 1].value - bbData.lower[bbData.lower.length - 1].value,
          }
        : null;

    // Determine trend signal
    const trendSignal = determineTrendSignal(currentPrice, currentSMA50, currentSMA200, currentMACD);

    // Determine overall signal
    const overallSignal = determineOverallSignal(currentRSI, currentMACD, trendSignal);

    return {
      // Moving Averages
      sma20: currentSMA20,
      sma50: currentSMA50,
      sma200: currentSMA200,
      ema20: currentEMA20,
      ema50: currentEMA50,
      ema200: currentEMA200,

      // Momentum
      rsi: currentRSI,
      rsi14: currentRSI,
      macd: currentMACD,
      stochastic: null, // Can add later if needed
      williamsR: null,

      // Volatility
      atr: null, // Can add later if needed
      bollingerBands: currentBB,
      keltnerChannels: null,

      // Volume
      obv: null,
      vwap: null,
      volumeProfile: null,

      // Trend
      adx: null,
      parabolicSar: null,
      ichimoku: null,

      // Support/Resistance
      supportLevels: [],
      resistanceLevels: [],

      // Signals
      overallSignal,
      trendSignal,
    };
  } catch (error) {
    console.error("Error calculating technical indicators:", error);
    return null;
  }
}

/**
 * Determine trend signal based on moving averages and MACD
 */
function determineTrendSignal(
  currentPrice: number,
  sma50: number | null,
  sma200: number | null,
  macd: { value: number; signal: number; histogram: number } | null
): "bullish" | "bearish" | "neutral" {
  let bullishScore = 0;
  let bearishScore = 0;

  // Check price vs SMA50
  if (sma50 !== null) {
    if (currentPrice > sma50) {
      bullishScore += 1;
    } else {
      bearishScore += 1;
    }
  }

  // Check price vs SMA200
  if (sma200 !== null) {
    if (currentPrice > sma200) {
      bullishScore += 1;
    } else {
      bearishScore += 1;
    }
  }

  // Check MACD
  if (macd !== null) {
    if (macd.histogram > 0) {
      bullishScore += 1;
    } else {
      bearishScore += 1;
    }
  }

  if (bullishScore > bearishScore) {
    return "bullish";
  } else if (bearishScore > bullishScore) {
    return "bearish";
  } else {
    return "neutral";
  }
}

/**
 * Determine overall signal combining multiple indicators
 */
function determineOverallSignal(
  rsi: number | null,
  macd: { value: number; signal: number; histogram: number } | null,
  trendSignal: "bullish" | "bearish" | "neutral"
): "strong_buy" | "buy" | "hold" | "sell" | "strong_sell" {
  let score = 0;

  // RSI analysis
  if (rsi !== null) {
    if (rsi < 30) {
      score += 2; // Oversold - buy signal
    } else if (rsi < 40) {
      score += 1; // Mildly oversold
    } else if (rsi > 70) {
      score -= 2; // Overbought - sell signal
    } else if (rsi > 60) {
      score -= 1; // Mildly overbought
    }
  }

  // MACD analysis
  if (macd !== null) {
    if (macd.histogram > 0) {
      score += 1; // Bullish momentum
    } else {
      score -= 1; // Bearish momentum
    }
  }

  // Trend analysis
  if (trendSignal === "bullish") {
    score += 1;
  } else if (trendSignal === "bearish") {
    score -= 1;
  }

  // Convert score to signal
  if (score >= 3) {
    return "strong_buy";
  } else if (score >= 1) {
    return "buy";
  } else if (score <= -3) {
    return "strong_sell";
  } else if (score <= -1) {
    return "sell";
  } else {
    return "hold";
  }
}

/**
 * Detect volume surge (current volume vs average)
 */
export function detectVolumeSurge(stock: Stock): boolean {
  if (!stock.volume || !stock.avgVolume || stock.avgVolume === 0) {
    return false;
  }

  // Volume surge if current volume is 1.5x or more than average
  return stock.volume >= stock.avgVolume * 1.5;
}

/**
 * Get RSI signal type
 */
export function getRSISignal(rsi: number | null): {
  type: "overbought" | "oversold" | "neutral";
  message: string;
} {
  if (rsi === null) {
    return { type: "neutral", message: "RSI data not available" };
  }

  if (rsi > 70) {
    return {
      type: "overbought",
      message: `RSI overbought at ${rsi.toFixed(1)}`,
    };
  } else if (rsi < 30) {
    return {
      type: "oversold",
      message: `RSI oversold at ${rsi.toFixed(1)} (potential reversal)`,
    };
  } else {
    return { type: "neutral", message: `RSI neutral at ${rsi.toFixed(1)}` };
  }
}

/**
 * Get MACD signal type
 */
export function getMACDSignal(macd: { value: number; signal: number; histogram: number } | null): {
  type: "bullish" | "bearish" | "neutral";
  message: string;
} {
  if (macd === null) {
    return { type: "neutral", message: "MACD data not available" };
  }

  if (macd.histogram > 0) {
    return {
      type: "bullish",
      message: "MACD bullish (positive momentum)",
    };
  } else if (macd.histogram < 0) {
    return {
      type: "bearish",
      message: "MACD bearish (negative momentum)",
    };
  } else {
    return { type: "neutral", message: "MACD neutral" };
  }
}

/**
 * Get moving average trend signal
 */
export function getMASignal(currentPrice: number, sma50: number | null, sma200: number | null): {
  type: "bullish" | "bearish" | "neutral";
  message: string;
} {
  if (sma50 === null && sma200 === null) {
    return { type: "neutral", message: "Moving average data not available" };
  }

  const aboveSMA50 = sma50 !== null && currentPrice > sma50;
  const aboveSMA200 = sma200 !== null && currentPrice > sma200;

  if (aboveSMA50 && aboveSMA200) {
    return {
      type: "bullish",
      message: "Price above 50-day and 200-day MA (strong uptrend)",
    };
  } else if (sma50 !== null && aboveSMA50) {
    return {
      type: "bullish",
      message: "Price above 50-day MA (uptrend)",
    };
  } else if (sma200 !== null && !aboveSMA200) {
    return {
      type: "bearish",
      message: "Price below 200-day MA (downtrend)",
    };
  } else if (sma50 !== null && !aboveSMA50) {
    return {
      type: "bearish",
      message: "Price below 50-day MA (downtrend)",
    };
  }

  return { type: "neutral", message: "Price near moving averages" };
}
