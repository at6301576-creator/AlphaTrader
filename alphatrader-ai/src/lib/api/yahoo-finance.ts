import YahooFinance from "yahoo-finance2";
import type { Stock, ChartDataPoint, TechnicalIndicators } from "@/types/stock";
import { getCuratedStocks as getStockTwitsStocks } from "./stocktwits";

// Initialize Yahoo Finance instance
const yahooFinance = new YahooFinance();

// Suppress yahoo-finance2 validation errors in development
try {
  // @ts-expect-error - suppressNotices may not be typed but exists
  yahooFinance.suppressNotices?.(["yahooSurvey"]);
} catch {
  // Ignore if not available
}

// ============= RATE LIMITING & CACHING =============

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Delay utility
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Request queue with rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 150; // 150ms between requests

async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
  return fn();
}

export interface QuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  beta?: number;
  exchange?: string;
  quoteType?: string;
  sector?: string;
  industry?: string;
}

export async function getQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    // Check cache first
    const cacheKey = `quote:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate-limited request
    const quote = await rateLimitedRequest(async () => {
      return await yahooFinance.quote(symbol);
    });

    const result = quote as QuoteResult;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteResult[]> {
  try {
    console.log(`  📥 Fetching quotes for ${symbols.length} symbols...`);
    const quotes: QuoteResult[] = [];
    let cacheHits = 0;

    // Process symbols with rate limiting (NOT in parallel to avoid rate limits)
    for (const symbol of symbols) {
      try {
        // Check cache first
        const cacheKey = `quote:${symbol}`;
        const cached = getCached(cacheKey);
        if (cached) {
          quotes.push(cached);
          cacheHits++;
          continue;
        }

        // Rate-limited API request
        const result = await rateLimitedRequest(async () => {
          return await yahooFinance.quote(symbol);
        });

        if (result) {
          const quote = result as QuoteResult;
          quotes.push(quote);
          setCache(cacheKey, quote);
        }
      } catch (error) {
        // Silently skip failed quotes to avoid cluttering logs
        if (error instanceof Error && error.message.includes("Too Many Requests")) {
          console.log(`  ⏳ Rate limited on ${symbol}, adding delay...`);
          await delay(1000); // Wait 1 second if rate limited
        }
      }
    }

    console.log(`  ✅ Successfully fetched ${quotes.length}/${symbols.length} quotes (${cacheHits} from cache)`);
    return quotes;
  } catch (error) {
    console.error("❌ Fatal error fetching quotes:", error);
    return [];
  }
}

export async function searchStocks(query: string, limit = 10) {
  try {
    const results = await yahooFinance.search(query, {
      quotesCount: limit,
      newsCount: 0,
    }) as { quotes?: unknown[] };
    return results.quotes || [];
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
}

export async function getHistoricalData(
  symbol: string,
  period: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max" = "1y",
  interval: "1d" | "1wk" | "1mo" = "1d"
): Promise<ChartDataPoint[]> {
  try {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "1d":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "5d":
        startDate.setDate(endDate.getDate() - 5);
        break;
      case "1mo":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3mo":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6mo":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(endDate.getFullYear() - 2);
        break;
      case "5y":
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case "max":
        startDate = new Date("1970-01-01");
        break;
    }

    const history = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval,
    }) as { quotes?: Array<{ date: Date; open?: number; high?: number; low?: number; close?: number; volume?: number }> };

    if (!history.quotes) return [];

    return history.quotes.map((q) => ({
      time: new Date(q.date).toISOString().split("T")[0],
      open: q.open || 0,
      high: q.high || 0,
      low: q.low || 0,
      close: q.close || 0,
      volume: q.volume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

interface SummaryResult {
  summaryProfile?: unknown;
  summaryDetail?: unknown;
  financialData?: unknown;
  defaultKeyStatistics?: unknown;
  calendarEvents?: unknown;
  incomeStatementHistory?: { incomeStatementHistory?: unknown[] };
  balanceSheetHistory?: { balanceSheetStatements?: unknown[] };
  cashflowStatementHistory?: { cashflowStatements?: unknown[] };
}

export async function getStockSummary(symbol: string) {
  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: [
          "summaryProfile",
          "summaryDetail",
          "financialData",
          "defaultKeyStatistics",
          "calendarEvents",
        ],
      }) as Promise<SummaryResult>,
    ]);

    return {
      quote,
      profile: summary.summaryProfile,
      details: summary.summaryDetail,
      financials: summary.financialData,
      keyStats: summary.defaultKeyStatistics,
      calendar: summary.calendarEvents,
    };
  } catch (error) {
    console.error(`Error fetching summary for ${symbol}:`, error);
    return null;
  }
}

export async function getFinancialData(symbol: string) {
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        "incomeStatementHistory",
        "balanceSheetHistory",
        "cashflowStatementHistory",
        "financialData",
      ],
    }) as SummaryResult;

    return {
      incomeStatement: summary.incomeStatementHistory?.incomeStatementHistory || [],
      balanceSheet: summary.balanceSheetHistory?.balanceSheetStatements || [],
      cashFlow: summary.cashflowStatementHistory?.cashflowStatements || [],
      financialData: summary.financialData,
    };
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return null;
  }
}

export function mapQuoteToStock(quote: QuoteResult): Partial<Stock> {
  return {
    symbol: quote.symbol,
    name: quote.longName || quote.shortName || null,
    exchange: quote.exchange || null,
    sector: quote.sector || null,
    industry: quote.industry || null,
    currency: "USD",
    currentPrice: quote.regularMarketPrice || null,
    previousClose: quote.regularMarketPreviousClose || null,
    open: quote.regularMarketOpen || null,
    dayHigh: quote.regularMarketDayHigh || null,
    dayLow: quote.regularMarketDayLow || null,
    volume: quote.regularMarketVolume || null,
    avgVolume: quote.averageVolume || null,
    marketCap: quote.marketCap || null,
    peRatio: quote.trailingPE || null,
    forwardPE: quote.forwardPE || null,
    pbRatio: quote.priceToBook || null,
    dividendYield: quote.dividendYield ? quote.dividendYield * 100 : null,
    beta: quote.beta || null,
    week52High: quote.fiftyTwoWeekHigh || null,
    week52Low: quote.fiftyTwoWeekLow || null,
  };
}

// Curated list of likely Shariah-compliant stocks (major companies)
// Note: This is a preliminary list based on business activities.
// Full compliance requires financial ratio screening (debt, interest income, etc.)
// Some stocks like defense contractors are debatable - different scholars have different opinions
const SHARIAH_COMPLIANT_STOCKS = [
  // Technology (Hardware & Software - generally compliant)
  "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMD", "INTC", "QCOM", "AVGO", "TXN",
  "ADBE", "CRM", "ORCL", "CSCO", "IBM", "NOW", "INTU", "PANW", "CRWD", "NET",

  // E-Commerce & Consumer Tech
  "AMZN", "SHOP", "EBAY", "ETSY", "MELI", "SE", "BKNG", "ABNB", "DASH", "UBER",

  // Healthcare & Biotech (generally compliant)
  "JNJ", "UNH", "LLY", "ABBV", "TMO", "ABT", "DHR", "AMGN", "GILD", "VRTX",
  "REGN", "ISRG", "BIIB", "MRNA", "ILMN", "ZTS", "CVS", "HUM", "CI", "MCK",

  // Consumer Goods (non-alcohol/tobacco)
  "PG", "NKE", "COST", "TGT", "LOW", "HD", "SBUX", "MCD", "YUM", "CMG",

  // Industrials & Manufacturing
  "CAT", "DE", "HON", "MMM", "GE", "EMR", "ETN", "ITW", "PH", "IR",

  // Aerospace & Defense (debatable - some scholars permit, others don't)
  "BA", "RTX", "LMT", "NOC", "GD",

  // Utilities & Energy (non-interest based operations)
  "NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "XEL", "ES", "ED",

  // Transportation
  "UPS", "FDX", "DAL", "UAL", "LUV", "AAL",

  // Telecom & Media (streaming, communication)
  "T", "VZ", "TMUS", "CMCSA", "CHTR", "DIS", "NFLX",

  // Real Estate (REITs - majority view allows if debt ratios are acceptable)
  "PLD", "AMT", "CCI", "EQIX", "PSA", "DLR", "WELL", "AVB", "EQR", "SPG",

  // Retail
  "WMT", "TJX", "ROST", "DG", "DLTR", "ORLY", "AZO",

  // Electric Vehicles & Clean Energy
  "TSLA", "RIVN", "LCID", "NIO", "XPEV", "LI", "ENPH", "SEDG", "RUN",
];

// Use Yahoo Finance screener to get market stocks dynamically
export async function getIndexComponents(index: string, shariahOnly: boolean = false): Promise<string[]> {
  try {
    console.log(`  🔍 Fetching stocks for ${index} market...`);

    // If Shariah-only mode, use different screeners focused on compliant sectors
    let screenerTypes: string[];
    if (shariahOnly) {
      console.log(`  ☪️ Shariah-compliant mode enabled`);
      screenerTypes = [
        "growth_technology_stocks",  // Tech is generally compliant
        "undervalued_growth_stocks", // Growth stocks in various sectors
      ];
    } else {
      // Regular screeners for general market scanning
      screenerTypes = [
        "aggressive_small_caps",    // 36% penny stocks!
        "small_cap_gainers",         // 36% penny stocks!
        "most_actives",              // 16% penny stocks
      ];
    }

    const allSymbols = new Set<string>();

    // Add curated Shariah-compliant stocks if enabled
    if (shariahOnly) {
      SHARIAH_COMPLIANT_STOCKS.forEach(symbol => allSymbols.add(symbol));
      console.log(`    ✓ Added ${SHARIAH_COMPLIANT_STOCKS.length} curated Shariah-compliant stocks`);
    }

    // Fetch screeners SEQUENTIALLY with delays to avoid rate limiting
    for (const scrId of screenerTypes) {
      try {
        // Check cache first
        const cacheKey = `screener:${scrId}`;
        const cached = getCached(cacheKey);
        if (cached) {
          console.log(`    💾 ${scrId}: ${cached.length} stocks (cached)`);
          cached.forEach((symbol: string) => allSymbols.add(symbol));
          continue;
        }

        // Rate-limited screener request
        const results = await rateLimitedRequest(async () => {
          return await yahooFinance.screener({
            scrIds: scrId as any,
            count: 100, // Get up to 100 from each screener
          });
        });

        const symbols = results.quotes
          .filter((q: any) => q.symbol && q.regularMarketPrice)
          .map((q: any) => q.symbol);

        console.log(`    ✓ ${scrId}: ${symbols.length} stocks`);
        setCache(cacheKey, symbols);
        symbols.forEach((symbol: string) => allSymbols.add(symbol));

        // Add delay between screener requests
        await delay(200);
      } catch (error) {
        console.log(`    ✗ ${scrId}: failed`);
      }
    }

    // Add StockTwits stocks only if NOT in Shariah mode (they're mostly penny stocks)
    if (!shariahOnly) {
      try {
        const stockTwitsSymbols = await getStockTwitsStocks();
        stockTwitsSymbols.forEach(symbol => allSymbols.add(symbol));
        console.log(`    ✓ StockTwits: ${stockTwitsSymbols.length} popular stocks`);
      } catch (error) {
        console.log(`    ⚠️ StockTwits fetch failed, continuing with Yahoo data only`);
      }
    }

    if (allSymbols.size > 0) {
      const symbols = Array.from(allSymbols);
      console.log(`  ✅ Found ${symbols.length} total tradeable stocks`);
      return symbols;
    }

    // If all screeners failed, fall back to static list
    console.log(`  ⚠️ All screeners failed, using fallback list`);
    throw new Error("All screeners failed");
  } catch (error) {
    console.log(`  📋 Using fallback stock list`);

    // Fallback to comprehensive static list
    const stockLists = {
      "SP500": [
        // Tech Giants (20)
        "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "NFLX", "ADBE", "CRM",
        "ORCL", "AMD", "INTC", "QCOM", "TXN", "INTU", "IBM", "AVGO", "CSCO", "NOW",

        // Financial Services (25)
        "BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "C", "AXP",
        "SPGI", "BLK", "SCHW", "CB", "MMC", "PGR", "ALL", "TRV", "AFL", "MET",
        "PRU", "AIG", "HIG", "USB", "PNC",

        // Healthcare (25)
        "UNH", "JNJ", "LLY", "MRK", "ABBV", "TMO", "ABT", "DHR", "PFE", "BMY",
        "AMGN", "GILD", "CVS", "CI", "HUM", "ISRG", "VRTX", "REGN", "ZTS", "BIIB",
        "ILMN", "MRNA", "MCK", "CAH", "COR",

        // Consumer (30)
        "WMT", "PG", "KO", "PEP", "COST", "MCD", "NKE", "SBUX", "TGT", "LOW",
        "HD", "DIS", "CMCSA", "VZ", "T", "CHTR", "TMUS", "PM", "MO", "CL",
        "KMB", "GIS", "K", "HSY", "MDLZ", "KHC", "STZ", "TAP", "BUD", "DEO",

        // Energy (20)
        "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HES",
        "KMI", "WMB", "HAL", "BKR", "DVN", "FANG", "MRO", "APA", "CTRA", "OVV",

        // Industrial (20)
        "CAT", "BA", "HON", "UPS", "RTX", "LMT", "GE", "MMM", "DE", "EMR",
        "FDX", "CSX", "NSC", "UNP", "WM", "RSG", "IR", "ETN", "ITW", "PH",

        // Tech/Growth (30)
        "PLTR", "RBLX", "SNOW", "SOFI", "ZM", "UBER", "LYFT", "ABNB", "COIN", "SQ",
        "SHOP", "MELI", "SE", "ROKU", "DKNG", "CRWD", "NET", "DDOG", "MDB", "ESTC",
        "PANW", "ZS", "OKTA", "TWLO", "DOCN", "PATH", "U", "BILL", "S", "AI",

        // Auto/Transport (15)
        "F", "GM", "RIVN", "NIO", "LCID", "VWAGY", "TM", "HMC", "RACE", "STLA",
        "TSLA", "DAL", "UAL", "AAL", "LUV",

        // Retail/E-commerce (15)
        "ETSY", "EBAY", "PINS", "SNAP", "DASH", "HOOD", "WEBR", "W", "CHWY", "RVLV",
        "FTCH", "REAL", "CVNA", "CARG", "CARS",

        // Penny Stocks (under $5) - 40 stocks
        "SNDL", "GNUS", "BBBY", "AMC", "APE", "MULN", "ENVX", "PLUG", "NKLA", "WKHS",
        "RIDE", "GOEV", "FFIE", "BLNK", "CHPT", "FSR", "ATER", "BIOR", "CREX", "FCEL",
        "GEVO", "HYZN", "HYLN", "KPTI", "MMAT", "NTLA", "OPEN", "PTON", "QS", "RIG",
        "RIOT", "ROOT", "SKLZ", "SOFI", "SPCE", "TLRY", "UPST", "VZIO", "WORX", "ZEV",

        // Crypto Mining Stocks - 20 stocks
        "MARA", "RIOT", "CLSK", "BTBT", "HUT", "BITF", "IREN", "CIFR", "CORZ", "WULF",
        "HIVE", "BTDR", "SDIG", "MSTR", "COIN", "HOOD", "SQ", "NVDA", "AMD", "GREE",
      ],
      "NASDAQ": [
        "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "GOOG", "META", "TSLA", "AVGO", "COST",
        "NFLX", "AMD", "ADBE", "QCOM", "INTC", "CSCO", "CMCSA", "TXN", "INTU", "AMGN",
        "HON", "AMAT", "SBUX", "ISRG", "GILD", "VRTX", "ADI", "ADP", "REGN", "BKNG",
      ],
      "UK": [
        "SHEL.L", "AZN.L", "HSBA.L", "ULVR.L", "GSK.L", "BP.L", "DGE.L", "RIO.L", "BATS.L", "VOD.L",
        "LSEG.L", "GLEN.L", "NG.L", "REL.L", "BARC.L", "LLOY.L", "IAG.L", "BA.L", "PRU.L", "AAL.L"
      ],
      "DE": [
        "SAP.DE", "SIE.DE", "DTE.DE", "ALV.DE", "BAS.DE", "BAYN.DE", "BMW.DE", "MBG.DE", "MUV2.DE", "DBK.DE",
        "VOW3.DE", "ADS.DE", "RWE.DE", "DAI.DE", "HEN3.DE", "IFX.DE", "ENR.DE", "FRE.DE", "HEI.DE", "BEI.DE"
      ],
    };

    const stocks = stockLists[index as keyof typeof stockLists] || stockLists["SP500"];
    console.log(`    Using ${stocks.length} stocks from fallback list`);
    return stocks;
  }
}

// Calculate basic technical indicators from historical data
export function calculateTechnicalIndicators(data: ChartDataPoint[]): TechnicalIndicators {
  if (data.length < 200) {
    return getEmptyIndicators();
  }

  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);

  // Calculate SMAs
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  // Calculate EMAs
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  // Calculate RSI
  const rsi = calculateRSI(closes, 14);

  // Calculate MACD
  const macd = calculateMACD(closes);

  // Calculate Bollinger Bands
  const bollingerBands = calculateBollingerBands(closes, 20);

  // Determine overall signal
  const currentPrice = closes[closes.length - 1];
  let signalScore = 0;

  if (sma20 !== null && currentPrice > sma20) signalScore += 1;
  if (sma50 !== null && currentPrice > sma50) signalScore += 1;
  if (sma200 !== null && currentPrice > sma200) signalScore += 2;
  if (rsi !== null && rsi < 30) signalScore += 1; // Oversold
  if (rsi !== null && rsi > 70) signalScore -= 1; // Overbought
  if (macd !== null && macd.value > macd.signal) signalScore += 1;

  let overallSignal: TechnicalIndicators["overallSignal"];
  if (signalScore >= 4) overallSignal = "strong_buy";
  else if (signalScore >= 2) overallSignal = "buy";
  else if (signalScore <= -2) overallSignal = "strong_sell";
  else if (signalScore <= 0) overallSignal = "sell";
  else overallSignal = "hold";

  return {
    sma20,
    sma50,
    sma200,
    ema20,
    ema50,
    ema200,
    rsi,
    rsi14: rsi,
    macd,
    stochastic: null,
    williamsR: null,
    atr: null,
    bollingerBands,
    keltnerChannels: null,
    obv: calculateOBV(closes, volumes),
    vwap: null,
    volumeProfile: null,
    adx: null,
    parabolicSar: null,
    ichimoku: null,
    supportLevels: calculateSupportResistance(data).support,
    resistanceLevels: calculateSupportResistance(data).resistance,
    overallSignal,
    trendSignal: sma50 !== null ? (currentPrice > sma50 ? "bullish" : currentPrice < sma50 ? "bearish" : "neutral") : "neutral",
  };
}

function getEmptyIndicators(): TechnicalIndicators {
  return {
    sma20: null,
    sma50: null,
    sma200: null,
    ema20: null,
    ema50: null,
    ema200: null,
    rsi: null,
    rsi14: null,
    macd: null,
    stochastic: null,
    williamsR: null,
    atr: null,
    bollingerBands: null,
    keltnerChannels: null,
    obv: null,
    vwap: null,
    volumeProfile: null,
    adx: null,
    parabolicSar: null,
    ichimoku: null,
    supportLevels: [],
    resistanceLevels: [],
    overallSignal: "hold",
    trendSignal: "neutral",
  };
}

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateRSI(data: number[], period: number = 14): number | null {
  if (data.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[data.length - period - 1 + i] - data[data.length - period - 1 + i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMACD(data: number[]): { value: number; signal: number; histogram: number } | null {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  if (ema12 === null || ema26 === null) return null;

  const macdLine = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdHistory: number[] = [];
  for (let i = 26; i < data.length; i++) {
    const e12 = calculateEMA(data.slice(0, i + 1), 12);
    const e26 = calculateEMA(data.slice(0, i + 1), 26);
    if (e12 !== null && e26 !== null) {
      macdHistory.push(e12 - e26);
    }
  }

  const signalLine = calculateEMA(macdHistory, 9) || 0;

  return {
    value: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number; width: number } | null {
  const sma = calculateSMA(data, period);
  if (sma === null) return null;

  const slice = data.slice(-period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const std = Math.sqrt(variance);

  const upper = sma + stdDev * std;
  const lower = sma - stdDev * std;

  return {
    upper,
    middle: sma,
    lower,
    width: (upper - lower) / sma,
  };
}

function calculateOBV(closes: number[], volumes: number[]): number | null {
  if (closes.length < 2) return null;

  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv += volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      obv -= volumes[i];
    }
  }

  return obv;
}

function calculateSupportResistance(data: ChartDataPoint[]): { support: number[]; resistance: number[] } {
  if (data.length < 20) return { support: [], resistance: [] };

  const prices = data.map((d) => ({ high: d.high, low: d.low, close: d.close }));
  const support: number[] = [];
  const resistance: number[] = [];

  // Find local minima and maxima
  for (let i = 10; i < prices.length - 10; i++) {
    const windowLow = prices.slice(i - 10, i + 11).map((p) => p.low);
    const windowHigh = prices.slice(i - 10, i + 11).map((p) => p.high);

    if (prices[i].low === Math.min(...windowLow)) {
      support.push(prices[i].low);
    }
    if (prices[i].high === Math.max(...windowHigh)) {
      resistance.push(prices[i].high);
    }
  }

  // Return unique, sorted levels (top 5 each)
  return {
    support: [...new Set(support)].sort((a, b) => b - a).slice(0, 5),
    resistance: [...new Set(resistance)].sort((a, b) => a - b).slice(0, 5),
  };
}
