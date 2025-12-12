/**
 * StockTwits API Integration
 * Provides trending stocks and social sentiment data
 * API Docs: https://api.stocktwits.com/developers/docs/api
 */

export interface StockTwitsStream {
  symbol: string;
  title: string;
}

export interface StockTwitsTrendingResponse {
  symbols: StockTwitsStream[];
}

export interface StockTwitsMessage {
  id: number;
  body: string;
  created_at: string;
  user: {
    username: string;
    identity: string;
  };
  symbols?: Array<{
    symbol: string;
    title: string;
  }>;
  entities?: {
    sentiment?: {
      basic: 'Bullish' | 'Bearish';
    };
  };
}

export interface StockTwitsSymbolResponse {
  symbol: {
    symbol: string;
    title: string;
  };
  messages: StockTwitsMessage[];
}

const STOCKTWITS_API_BASE = 'https://api.stocktwits.com/api/2';

// Common headers to avoid Cloudflare blocking
const getHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://stocktwits.com/',
  'Origin': 'https://stocktwits.com',
});

/**
 * Fetch trending stocks from StockTwits
 * NOTE: This API is frequently blocked by Cloudflare
 * Returns empty array - use Finnhub API instead for stock data
 */
export async function getTrendingStocks(): Promise<string[]> {
  console.log('  📱 StockTwits API no longer used (Cloudflare blocks)');
  return []; // Return empty - use Finnhub for all stock data
}

/**
 * Get watchlist stocks - returns empty since we use curated list
 */
export async function getWatchlistStocks(listId: string = 'penny-stocks'): Promise<string[]> {
  // Return empty - we're using the curated list instead
  return [];
}

/**
 * Fetch stocks from multiple curated sources
 * Great for penny stocks and trending small caps
 */
export async function getCuratedStocks(): Promise<string[]> {
  const trending = await getTrendingStocks();
  return trending;
}

/**
 * Get sentiment data for a specific symbol
 * Useful for enriching scan results
 */
export async function getSymbolSentiment(symbol: string): Promise<{
  bullishCount: number;
  bearishCount: number;
  totalMessages: number;
  sentimentRatio: number; // bullish / (bullish + bearish)
} | null> {
  try {
    const response = await fetch(`${STOCKTWITS_API_BASE}/streams/symbol/${symbol}.json`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data: StockTwitsSymbolResponse = await response.json();

    let bullishCount = 0;
    let bearishCount = 0;

    data.messages.forEach(msg => {
      const sentiment = msg.entities?.sentiment?.basic;
      if (sentiment === 'Bullish') bullishCount++;
      else if (sentiment === 'Bearish') bearishCount++;
    });

    const totalMessages = data.messages.length;
    const sentimentRatio = (bullishCount + bearishCount) > 0
      ? bullishCount / (bullishCount + bearishCount)
      : 0.5;

    return {
      bullishCount,
      bearishCount,
      totalMessages,
      sentimentRatio,
    };
  } catch (error) {
    return null;
  }
}
