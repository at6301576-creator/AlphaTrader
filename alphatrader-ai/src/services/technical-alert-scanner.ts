/**
 * Technical Alert Scanner Service
 * Scans active technical alerts and detects when conditions are met
 */

import { prisma } from "@/lib/db";
import yahooFinance from "yahoo-finance2";
import {
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  detectRSISignal,
  detectMACDCrossover,
  detectStochasticSignal,
  detectMACrossover,
} from "@/lib/technical-indicators";
import type { ChartDataPoint } from "@/types/stock";
import type { Time } from "lightweight-charts";
import type {
  AlertTriggerEvent,
  IndicatorType,
  RSIParameters,
  MACDParameters,
  StochasticParameters,
  MACrossoverParameters,
  BollingerBandsParameters,
} from "@/types/technical-alert";

interface ScanResult {
  alertId: string;
  triggered: boolean;
  currentValue?: number;
  message?: string;
}

/**
 * Fetch historical chart data for a symbol
 */
async function fetchChartData(symbol: string): Promise<ChartDataPoint[]> {
  try {
    // Fetch 1 year of daily data for indicator calculation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!result.quotes || result.quotes.length === 0) {
      return [];
    }

    // Transform to ChartDataPoint format
    const chartData: ChartDataPoint[] = result.quotes
      .filter(
        (quote) =>
          quote.open !== null &&
          quote.high !== null &&
          quote.low !== null &&
          quote.close !== null &&
          quote.volume !== null &&
          quote.date !== null
      )
      .map((quote) => ({
        time: (quote.date!.getTime() / 1000) as Time,
        open: quote.open!,
        high: quote.high!,
        low: quote.low!,
        close: quote.close!,
        volume: quote.volume!,
      }));

    return chartData;
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Check RSI alert condition
 */
function checkRSIAlert(
  alert: any,
  chartData: ChartDataPoint[]
): ScanResult {
  const params = JSON.parse(alert.parameters) as RSIParameters;
  const period = params.period || 14;
  const overboughtLevel = params.overboughtLevel || 70;
  const oversoldLevel = params.oversoldLevel || 30;

  // Calculate RSI
  const rsiData = calculateRSI(chartData, period);
  if (rsiData.length === 0) {
    return { alertId: alert.id, triggered: false };
  }

  const currentRSI = rsiData[rsiData.length - 1].value;
  const signal = detectRSISignal(currentRSI);

  let triggered = false;
  let message = "";

  if (alert.condition === "overbought" && signal.type === "overbought") {
    triggered = true;
    message = `RSI is overbought at ${currentRSI.toFixed(2)} (threshold: ${overboughtLevel})`;
  } else if (alert.condition === "oversold" && signal.type === "oversold") {
    triggered = true;
    message = `RSI is oversold at ${currentRSI.toFixed(2)} (threshold: ${oversoldLevel})`;
  }

  return {
    alertId: alert.id,
    triggered,
    currentValue: currentRSI,
    message: triggered ? message : undefined,
  };
}

/**
 * Check MACD alert condition
 */
function checkMACDAlert(
  alert: any,
  chartData: ChartDataPoint[]
): ScanResult {
  const params = JSON.parse(alert.parameters) as MACDParameters;
  const fastPeriod = params.fastPeriod || 12;
  const slowPeriod = params.slowPeriod || 26;
  const signalPeriod = params.signalPeriod || 9;

  // Calculate MACD
  const { macd, signal } = calculateMACD(
    chartData,
    fastPeriod,
    slowPeriod,
    signalPeriod
  );

  if (macd.length < 2 || signal.length < 2) {
    return { alertId: alert.id, triggered: false };
  }

  const currentMACD = macd[macd.length - 1].value;
  const currentSignal = signal[signal.length - 1].value;
  const prevMACD = macd[macd.length - 2].value;
  const prevSignal = signal[signal.length - 2].value;

  const crossover = detectMACDCrossover(
    currentMACD,
    currentSignal,
    prevMACD,
    prevSignal
  );

  let triggered = false;
  let message = "";

  if (
    alert.condition === "bullish_crossover" &&
    crossover.type === "bullish_crossover"
  ) {
    triggered = true;
    message = `MACD bullish crossover detected (MACD: ${currentMACD.toFixed(2)}, Signal: ${currentSignal.toFixed(2)})`;
  } else if (
    alert.condition === "bearish_crossover" &&
    crossover.type === "bearish_crossover"
  ) {
    triggered = true;
    message = `MACD bearish crossover detected (MACD: ${currentMACD.toFixed(2)}, Signal: ${currentSignal.toFixed(2)})`;
  }

  return {
    alertId: alert.id,
    triggered,
    currentValue: currentMACD,
    message: triggered ? message : undefined,
  };
}

/**
 * Check Stochastic alert condition
 */
function checkStochasticAlert(
  alert: any,
  chartData: ChartDataPoint[]
): ScanResult {
  const params = JSON.parse(alert.parameters) as StochasticParameters;
  const kPeriod = params.kPeriod || 14;
  const dPeriod = params.dPeriod || 3;
  const overboughtLevel = params.overboughtLevel || 80;
  const oversoldLevel = params.oversoldLevel || 20;

  // Calculate Stochastic
  const { k, d } = calculateStochastic(chartData, kPeriod, dPeriod);

  if (k.length < 2 || d.length < 2) {
    return { alertId: alert.id, triggered: false };
  }

  const currentK = k[k.length - 1].value;
  const currentD = d[d.length - 1].value;
  const prevK = k[k.length - 2].value;
  const prevD = d[d.length - 2].value;

  const signal = detectStochasticSignal(currentK, currentD, prevK, prevD);

  let triggered = false;
  let message = "";

  if (alert.condition === "overbought" && signal.type === "overbought") {
    triggered = true;
    message = `Stochastic is overbought (%K: ${currentK.toFixed(2)}, %D: ${currentD.toFixed(2)})`;
  } else if (alert.condition === "oversold" && signal.type === "oversold") {
    triggered = true;
    message = `Stochastic is oversold (%K: ${currentK.toFixed(2)}, %D: ${currentD.toFixed(2)})`;
  } else if (
    alert.condition === "bullish_crossover" &&
    signal.type === "bullish_crossover"
  ) {
    triggered = true;
    message = `Stochastic bullish crossover detected (%K crossed above %D)`;
  } else if (
    alert.condition === "bearish_crossover" &&
    signal.type === "bearish_crossover"
  ) {
    triggered = true;
    message = `Stochastic bearish crossover detected (%K crossed below %D)`;
  }

  return {
    alertId: alert.id,
    triggered,
    currentValue: currentK,
    message: triggered ? message : undefined,
  };
}

/**
 * Check Moving Average Crossover alert condition
 */
function checkMACrossoverAlert(
  alert: any,
  chartData: ChartDataPoint[]
): ScanResult {
  const params = JSON.parse(alert.parameters) as MACrossoverParameters;
  const fastPeriod = params.fastPeriod;
  const slowPeriod = params.slowPeriod;
  const type = params.type;

  // Calculate moving averages
  const fastMA =
    type === "sma"
      ? calculateSMA(chartData, fastPeriod)
      : calculateEMA(chartData, fastPeriod);
  const slowMA =
    type === "sma"
      ? calculateSMA(chartData, slowPeriod)
      : calculateEMA(chartData, slowPeriod);

  if (fastMA.length < 2 || slowMA.length < 2) {
    return { alertId: alert.id, triggered: false };
  }

  const currentFast = fastMA[fastMA.length - 1].value;
  const currentSlow = slowMA[slowMA.length - 1].value;
  const prevFast = fastMA[fastMA.length - 2].value;
  const prevSlow = slowMA[slowMA.length - 2].value;

  const crossover = detectMACrossover(
    currentFast,
    currentSlow,
    prevFast,
    prevSlow
  );

  let triggered = false;
  let message = "";

  if (
    alert.condition === "crosses_above" &&
    crossover.type === "golden_cross"
  ) {
    triggered = true;
    message = `Golden Cross: ${type.toUpperCase()}(${fastPeriod}) crossed above ${type.toUpperCase()}(${slowPeriod})`;
  } else if (
    alert.condition === "crosses_below" &&
    crossover.type === "death_cross"
  ) {
    triggered = true;
    message = `Death Cross: ${type.toUpperCase()}(${fastPeriod}) crossed below ${type.toUpperCase()}(${slowPeriod})`;
  }

  return {
    alertId: alert.id,
    triggered,
    currentValue: currentFast,
    message: triggered ? message : undefined,
  };
}

/**
 * Check Bollinger Bands alert condition
 */
function checkBollingerBandsAlert(
  alert: any,
  chartData: ChartDataPoint[]
): ScanResult {
  const params = JSON.parse(alert.parameters) as BollingerBandsParameters;
  const period = params.period || 20;
  const stdDev = params.stdDev || 2;

  // Calculate Bollinger Bands
  const { upper, middle, lower } = calculateBollingerBands(
    chartData,
    period,
    stdDev
  );

  if (upper.length === 0) {
    return { alertId: alert.id, triggered: false };
  }

  const currentPrice = chartData[chartData.length - 1].close;
  const currentUpper = upper[upper.length - 1].value;
  const currentLower = lower[lower.length - 1].value;
  const currentMiddle = middle[middle.length - 1].value;

  let triggered = false;
  let message = "";

  if (
    params.condition === "price_above_upper" &&
    currentPrice > currentUpper
  ) {
    triggered = true;
    message = `Price (${currentPrice.toFixed(2)}) is above upper Bollinger Band (${currentUpper.toFixed(2)})`;
  } else if (
    params.condition === "price_below_lower" &&
    currentPrice < currentLower
  ) {
    triggered = true;
    message = `Price (${currentPrice.toFixed(2)}) is below lower Bollinger Band (${currentLower.toFixed(2)})`;
  }

  return {
    alertId: alert.id,
    triggered,
    currentValue: currentPrice,
    message: triggered ? message : undefined,
  };
}

/**
 * Check if alert should be triggered based on cooldown
 */
function shouldTriggerAlert(alert: any): boolean {
  // If alert has never been triggered, trigger it
  if (!alert.triggeredAt) {
    return true;
  }

  // If repeat alerts are disabled and alert has been triggered, don't trigger again
  if (!alert.repeatAlert) {
    return false;
  }

  // Check cooldown period
  const now = new Date();
  const lastTriggered = new Date(alert.triggeredAt);
  const cooldownMs = alert.cooldownMinutes * 60 * 1000;
  const timeSinceLastTrigger = now.getTime() - lastTriggered.getTime();

  return timeSinceLastTrigger >= cooldownMs;
}

/**
 * Scan a single alert
 */
async function scanAlert(alert: any): Promise<ScanResult | null> {
  try {
    // Fetch chart data
    const chartData = await fetchChartData(alert.symbol);
    if (chartData.length === 0) {
      console.log(`No chart data available for ${alert.symbol}`);
      return null;
    }

    // Check alert condition based on indicator type
    let result: ScanResult;

    switch (alert.indicatorType as IndicatorType) {
      case "rsi":
        result = checkRSIAlert(alert, chartData);
        break;
      case "macd":
        result = checkMACDAlert(alert, chartData);
        break;
      case "stochastic":
        result = checkStochasticAlert(alert, chartData);
        break;
      case "ma_crossover":
        result = checkMACrossoverAlert(alert, chartData);
        break;
      case "bollinger_bands":
        result = checkBollingerBandsAlert(alert, chartData);
        break;
      default:
        console.log(`Unknown indicator type: ${alert.indicatorType}`);
        return null;
    }

    // Update lastChecked and lastValue
    await prisma.technicalAlert.update({
      where: { id: alert.id },
      data: {
        lastChecked: new Date(),
        lastValue: result.currentValue,
      },
    });

    return result;
  } catch (error) {
    console.error(`Error scanning alert ${alert.id}:`, error);
    return null;
  }
}

/**
 * Trigger an alert (update database and prepare for notification)
 */
async function triggerAlert(
  alert: any,
  result: ScanResult
): Promise<AlertTriggerEvent | null> {
  try {
    // Update alert in database
    await prisma.technicalAlert.update({
      where: { id: alert.id },
      data: {
        triggeredAt: new Date(),
        triggerCount: alert.triggerCount + 1,
      },
    });

    // Create trigger event
    const triggerEvent: AlertTriggerEvent = {
      alertId: alert.id,
      symbol: alert.symbol,
      indicatorType: alert.indicatorType,
      condition: alert.condition,
      currentValue: result.currentValue!,
      message: result.message || alert.message,
      triggeredAt: new Date(),
    };

    console.log(`Alert triggered:`, triggerEvent);

    return triggerEvent;
  } catch (error) {
    console.error(`Error triggering alert ${alert.id}:`, error);
    return null;
  }
}

/**
 * Main scanner function - scans all active alerts
 */
export async function scanTechnicalAlerts(): Promise<{
  scanned: number;
  triggered: number;
  events: AlertTriggerEvent[];
}> {
  console.log("[Technical Alert Scanner] Starting scan...");

  try {
    // Fetch all active alerts
    const activeAlerts = await prisma.technicalAlert.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    console.log(`[Technical Alert Scanner] Found ${activeAlerts.length} active alerts`);

    const triggeredEvents: AlertTriggerEvent[] = [];

    // Scan each alert
    for (const alert of activeAlerts) {
      try {
        const result = await scanAlert(alert);

        if (result && result.triggered) {
          // Check if alert should be triggered based on cooldown
          if (shouldTriggerAlert(alert)) {
            const event = await triggerAlert(alert, result);
            if (event) {
              triggeredEvents.push(event);
            }
          } else {
            console.log(
              `Alert ${alert.id} met condition but is in cooldown period`
            );
          }
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    console.log(
      `[Technical Alert Scanner] Scan complete. Triggered: ${triggeredEvents.length}/${activeAlerts.length}`
    );

    return {
      scanned: activeAlerts.length,
      triggered: triggeredEvents.length,
      events: triggeredEvents,
    };
  } catch (error) {
    console.error("[Technical Alert Scanner] Error during scan:", error);
    return {
      scanned: 0,
      triggered: 0,
      events: [],
    };
  }
}
