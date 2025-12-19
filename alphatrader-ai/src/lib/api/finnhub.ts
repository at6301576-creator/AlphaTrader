/**
 * Finnhub API Integration
 * Legal for commercial redistribution
 * Free tier: 60 API calls/minute
 * Docs: https://finnhub.io/docs/api
 */

import type { Stock, ChartDataPoint, NewsItem } from "@/types/stock";
import { mapIndustryToSector } from "@/lib/sector-mapping";
import { requestDeduplicator, generateRequestKey } from "@/lib/request-deduplication";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

// ============= RATE LIMITING & CACHING =============

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (optimized for scanner performance)

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limiting - 60 calls per minute for free tier
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000; // 1 minute
let requestCount = 0;
let windowStart = Date.now();

async function rateLimitedFetch<T>(url: string): Promise<T> {
  // Deduplicate the request first
  const dedupKey = generateRequestKey(url);

  return requestDeduplicator.deduplicate(
    dedupKey,
    async () => {
      // Reset window if needed
      const now = Date.now();
      if (now - windowStart >= RATE_WINDOW) {
        requestCount = 0;
        windowStart = now;
      }

      // Wait if at limit
      if (requestCount >= RATE_LIMIT) {
        const waitTime = RATE_WINDOW - (now - windowStart);
        console.warn(`[Finnhub] Rate limit reached (${requestCount}/${RATE_LIMIT}). Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        requestCount = 0;
        windowStart = Date.now();
      }

      requestCount++;

      try {
        const response = await fetch(url);

        // Handle rate limit response (HTTP 429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RATE_WINDOW;
          console.warn(`[Finnhub] Rate limit exceeded (429). Retrying after ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          requestCount = 0;
          windowStart = Date.now();
          // Retry the request
          return rateLimitedFetch<T>(url);
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Finnhub] API error ${response.status}: ${errorText}`);
          throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error('[Finnhub] Fetch error:', error);
        throw error;
      }
    },
    { timeout: 30000 } // 30 second timeout
  );
}

// ============= TYPE DEFINITIONS =============

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface FinnhubMetric {
  metric: {
    "52WeekHigh": number;
    "52WeekLow": number;
    beta: number;
    dividendYieldIndicatedAnnual: number;
    epsInclExtraItemsAnnual: number;
    marketCapitalization: number;
    peExclExtraTTM: number;
    priceSalesTTM: number;
    priceBookTTM: number;
    revenuePerShareAnnual: number;
  };
}

interface FinnhubSymbolLookup {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// ============= API FUNCTIONS =============

/**
 * Get real-time quote data for a symbol
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const cacheKey = `quote:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Finnhub] Quote cache hit for ${symbol}`);
      return cached;
    }

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching quote for ${symbol}`);
    const quote = await rateLimitedFetch<FinnhubQuote>(url);

    // Only cache if we got valid data
    if (quote.c && quote.c > 0) {
      setCache(cacheKey, quote);
      console.log(`[Finnhub] Quote cached for ${symbol}: $${quote.c}`);
      return quote;
    }

    console.warn(`[Finnhub] Invalid quote data for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`[Finnhub] Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get company profile/info
 */
export async function getProfile(symbol: string): Promise<FinnhubProfile | null> {
  try {
    const cacheKey = `profile:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Finnhub] Profile cache hit for ${symbol}`);
      return cached;
    }

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching profile for ${symbol}`);
    const profile = await rateLimitedFetch<FinnhubProfile>(url);

    // Only cache if we got valid data
    if (profile && profile.ticker) {
      setCache(cacheKey, profile);
      console.log(`[Finnhub] Profile cached for ${symbol}: ${profile.name}`);
      return profile;
    }

    console.warn(`[Finnhub] Invalid profile data for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`[Finnhub] Error fetching profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get basic financials and metrics
 */
export async function getMetrics(symbol: string): Promise<FinnhubMetric | null> {
  try {
    const cacheKey = `metrics:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Finnhub] Metrics cache hit for ${symbol}`);
      return cached;
    }

    const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching metrics for ${symbol}`);
    const metrics = await rateLimitedFetch<FinnhubMetric>(url);

    setCache(cacheKey, metrics);
    console.log(`[Finnhub] Metrics cached for ${symbol}`);
    return metrics;
  } catch (error) {
    console.error(`[Finnhub] Error fetching metrics for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get company news
 * @param symbol - Stock symbol
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getCompanyNews(
  symbol: string,
  from?: string,
  to?: string
): Promise<NewsItem[]> {
  try {
    // Default to last 7 days if dates not provided
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const cacheKey = `news:${symbol}:${fromDate}:${toDate}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Finnhub] News cache hit for ${symbol} (${cached.length} items)`);
      return cached;
    }

    const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
    console.log(`[Finnhub] Fetching news for ${symbol} from ${fromDate} to ${toDate}`);
    const news = await rateLimitedFetch<FinnhubNews[]>(url);

    // Map to our NewsItem type
    const newsItems: NewsItem[] = news.slice(0, 20).map((item) => ({
      id: item.id.toString(),
      symbol: symbol,
      title: item.headline,
      summary: item.summary || null,
      source: item.source || null,
      url: item.url || null,
      imageUrl: item.image || null,
      sentiment: null, // Finnhub free tier doesn't include sentiment
      sentimentScore: null,
      publishedAt: new Date(item.datetime * 1000),
    }));

    setCache(cacheKey, newsItems);
    console.log(`[Finnhub] News cached for ${symbol}: ${newsItems.length} items`);
    return newsItems;
  } catch (error) {
    console.error(`[Finnhub] Error fetching news for ${symbol}:`, error);
    return [];
  }
}

/**
 * Search for stocks by query
 */
export async function searchStocks(query: string): Promise<FinnhubSymbolLookup | null> {
  try {
    console.log(`[Finnhub] Searching stocks for query: "${query}"`);
    const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
    const result = await rateLimitedFetch<FinnhubSymbolLookup>(url);
    console.log(`[Finnhub] Search returned ${result?.count || 0} results`);
    return result;
  } catch (error) {
    console.error(`[Finnhub] Error searching stocks:`, error);
    return null;
  }
}

/**
 * Get all US stock symbols
 * This replaces hardcoded lists with dynamic API data
 * Filters to only US exchanges (NYSE, NASDAQ) to exclude foreign stocks
 */
export async function getAllUSStocks(): Promise<string[]> {
  try {
    console.log('  📡 Fetching US stock symbols from Finnhub...');

    const cacheKey = 'all-us-stocks';
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`  💾 Using ${cached.length} cached US stocks`);
      return cached;
    }

    const url = `${FINNHUB_BASE_URL}/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`;
    const symbols = await rateLimitedFetch<Array<{
      symbol: string;
      description: string;
      type: string;
      currency?: string;
      displaySymbol?: string;
    }>>(url);

    // Filter to only US stocks:
    // 1. Must be Common Stock
    // 2. Exclude symbols with dots (foreign stocks like 300750.SZ)
    // 3. Exclude symbols longer than 5 chars (warrants, preferreds)
    // 4. Must be USD currency if available
    const usStocks = symbols
      .filter(s => {
        // Must be common stock
        if (s.type !== 'Common Stock' && s.type !== 'Stock') return false;

        // Exclude symbols with dots (foreign exchanges)
        if (s.symbol.includes('.')) return false;

        // Exclude very long symbols (warrants, preferreds)
        if (s.symbol.length > 5) return false;

        // Prefer USD currency
        if (s.currency && s.currency !== 'USD') return false;

        return true;
      })
      .map(s => s.symbol)
      // Sort by length (shorter symbols are typically more liquid)
      .sort((a, b) => a.length - b.length);

    console.log(`  ✅ Fetched ${usStocks.length} US stock symbols from Finnhub`);
    setCache(cacheKey, usStocks);
    return usStocks;
  } catch (error) {
    console.error('Error fetching US stocks:', error);
    return [];
  }
}

/**
 * Map Finnhub data to our Stock type
 */
export async function mapFinnhubToStock(symbol: string): Promise<Partial<Stock> | null> {
  try {
    const [quote, profile, metrics] = await Promise.all([
      getQuote(symbol),
      getProfile(symbol),
      getMetrics(symbol),
    ]);

    if (!quote || !quote.c || quote.c <= 0) {
      return null;
    }

    const stock: Partial<Stock> = {
      symbol: symbol.toUpperCase(),
      name: profile?.name || null,
      exchange: profile?.exchange || null,
      sector: mapIndustryToSector(profile?.finnhubIndustry) || null,
      industry: profile?.finnhubIndustry || null,
      country: profile?.country || null,
      currency: profile?.currency || "USD",
      currentPrice: quote.c,
      previousClose: quote.pc,
      open: quote.o,
      dayHigh: quote.h,
      dayLow: quote.l,
      volume: null,
      avgVolume: null,
      marketCap: metrics?.metric?.marketCapitalization || profile?.marketCapitalization || null,
      peRatio: metrics?.metric?.peExclExtraTTM || null,
      forwardPE: null,
      pbRatio: metrics?.metric?.priceBookTTM || null,
      psRatio: metrics?.metric?.priceSalesTTM || null,
      pegRatio: null,
      dividendYield: metrics?.metric?.dividendYieldIndicatedAnnual || null,
      dividendRate: null,
      payoutRatio: null,
      beta: metrics?.metric?.beta || null,
      week52High: metrics?.metric?.["52WeekHigh"] || null,
      week52Low: metrics?.metric?.["52WeekLow"] || null,
      eps: metrics?.metric?.epsInclExtraItemsAnnual || null,
      revenueGrowth: null,
      earningsGrowth: null,
      profitMargin: null,
      operatingMargin: null,
      roe: null,
      roa: null,
      debtToEquity: null,
      currentRatio: null,
      quickRatio: null,
      freeCashFlow: null,
      isShariahCompliant: null,
      shariahDetails: null,
      technicalData: null,
      fundamentalData: null,
      chartData: null,
      lastUpdated: new Date(),
    };

    return stock;
  } catch (error) {
    console.error(`Error mapping Finnhub data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get quotes for multiple symbols (batch)
 * Optimized with caching and rate limiting
 */
export async function getQuotes(symbols: string[]): Promise<Array<Partial<Stock>>> {
  console.log(`\n📊 Fetching ${symbols.length} stock quotes from Finnhub...`);

  const BATCH_SIZE = 10; // Fetch 10 at a time to avoid rate limits
  const BATCH_DELAY = 200; // 200ms delay between batches

  const stocks: Array<Partial<Stock>> = [];
  let cacheHits = 0;
  let skipped = 0;
  let errors = 0;

  // Check cache first
  const uncachedSymbols: string[] = [];
  for (const symbol of symbols) {
    const cached = getCached(`stock:${symbol}`);
    if (cached) {
      stocks.push(cached);
      cacheHits++;
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  console.log(`  💾 Cache: ${cacheHits}/${symbols.length} hits`);

  if (uncachedSymbols.length === 0) {
    return stocks;
  }

  console.log(`  📡 Fetching ${uncachedSymbols.length} uncached stocks...`);

  // Process in batches
  for (let batchIndex = 0; batchIndex < Math.ceil(uncachedSymbols.length / BATCH_SIZE); batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, uncachedSymbols.length);
    const batch = uncachedSymbols.slice(batchStart, batchEnd);

    // Add delay between batches (except first)
    if (batchIndex > 0) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }

    const batchPromises = batch.map(async (symbol) => {
      try {
        const stock = await mapFinnhubToStock(symbol);
        if (stock) {
          setCache(`stock:${symbol}`, stock);
          return { success: true, stock };
        } else {
          return { success: false, skipped: true };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Don't count 403 as errors (expected for some stocks)
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          return { success: false, skipped: true };
        }
        return { success: false, error: errorMsg };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result.success && 'stock' in result && result.stock) {
        stocks.push(result.stock);
      } else if ('skipped' in result) {
        skipped++;
      } else if ('error' in result) {
        errors++;
        if (errors <= 3) {
          console.error(`  ❌ Failed to fetch stock: ${result.error}`);
        }
      }
    }

    // Log progress
    const processed = (batchIndex + 1) * BATCH_SIZE;
    console.log(`  📊 Progress: ${Math.min(processed, uncachedSymbols.length)}/${uncachedSymbols.length} (${stocks.length - cacheHits} new)`);
  }

  console.log(
    `  ✅ Successfully fetched ${stocks.length}/${symbols.length} stocks ` +
    `(${cacheHits} from cache, ${skipped} skipped, ${errors} errors)`
  );
  return stocks;
}
