export interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  symbol: string;
}

export interface PriceTarget {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberAnalysts: number;
  lastUpdated: string;
}

export interface UpgradeDowngrade {
  symbol: string;
  gradeTime: number;
  company: string;
  fromGrade: string | null;
  toGrade: string;
  action: string;
}

export interface AnalystData {
  recommendations: RecommendationTrend[];
  priceTarget: PriceTarget | null;
  recentChanges: UpgradeDowngrade[];
}

// Simple in-memory cache
const analystCache = new Map<string, { data: AnalystData; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour (analyst data doesn't change frequently)

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";

/**
 * Fetch recommendation trends (buy/hold/sell counts)
 */
async function getRecommendationTrends(symbol: string): Promise<RecommendationTrend[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(`Error fetching recommendation trends for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch price target consensus data
 */
async function getPriceTarget(symbol: string): Promise<PriceTarget | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.targetMean) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching price target for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch recent upgrade/downgrade events
 */
async function getUpgradeDowngrade(symbol: string): Promise<UpgradeDowngrade[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/upgrade-downgrade?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Return only the most recent 10 events
    return data.slice(0, 10);
  } catch (error) {
    console.error(`Error fetching upgrade/downgrade for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch all analyst data for a symbol with caching
 */
export async function getAnalystData(symbol: string): Promise<AnalystData> {
  try {
    // Check cache first
    const cached = analystCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[getAnalystData] Using cached data for ${symbol}`);
      return cached.data;
    }

    console.log(`[getAnalystData] Fetching fresh analyst data for ${symbol} from Finnhub`);

    // Fetch all data in parallel
    const [recommendations, priceTarget, recentChanges] = await Promise.all([
      getRecommendationTrends(symbol),
      getPriceTarget(symbol),
      getUpgradeDowngrade(symbol),
    ]);

    const data: AnalystData = {
      recommendations,
      priceTarget,
      recentChanges,
    };

    // Cache the result
    analystCache.set(symbol, { data, timestamp: Date.now() });
    console.log(`[getAnalystData] Cached analyst data for ${symbol}`);

    return data;
  } catch (error) {
    console.error(`[getAnalystData] Error fetching analyst data for ${symbol}:`, error);

    // Return cached data even if expired, rather than error
    const cached = analystCache.get(symbol);
    if (cached) {
      console.log(`[getAnalystData] Using stale cached data for ${symbol}`);
      return cached.data;
    }

    // Return empty data structure
    return {
      recommendations: [],
      priceTarget: null,
      recentChanges: [],
    };
  }
}

/**
 * Calculate consensus rating from recommendation trends
 */
export function getConsensusRating(trend: RecommendationTrend): {
  rating: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell" | "N/A";
  score: number;
} {
  const total = trend.strongBuy + trend.buy + trend.hold + trend.sell + trend.strongSell;

  if (total === 0) {
    return { rating: "N/A", score: 0 };
  }

  // Calculate weighted score (5 = Strong Buy, 1 = Strong Sell)
  const score = (
    trend.strongBuy * 5 +
    trend.buy * 4 +
    trend.hold * 3 +
    trend.sell * 2 +
    trend.strongSell * 1
  ) / total;

  // Map score to rating
  if (score >= 4.5) return { rating: "Strong Buy", score };
  if (score >= 3.5) return { rating: "Buy", score };
  if (score >= 2.5) return { rating: "Hold", score };
  if (score >= 1.5) return { rating: "Sell", score };
  return { rating: "Strong Sell", score };
}

/**
 * Calculate upside potential based on price target and current price
 */
export function calculateUpside(currentPrice: number, targetPrice: number): {
  upside: number;
  upsidePercent: number;
} {
  const upside = targetPrice - currentPrice;
  const upsidePercent = (upside / currentPrice) * 100;

  return { upside, upsidePercent };
}
