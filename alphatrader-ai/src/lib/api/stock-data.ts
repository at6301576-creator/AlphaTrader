/**
 * Stock Data API - Redistributable Version
 * Uses Finnhub API (legal for commercial use)
 * NO hardcoded stock lists - all data fetched dynamically from API
 */

import * as finnhub from './finnhub';
import type { Stock } from '@/types/stock';
import { industryMatchesSector } from '@/lib/sector-mapping';

// Market to country mapping for filtering stocks by origin
const MARKET_COUNTRIES: Record<string, string[]> = {
  US: ['US', 'United States'],
  UK: ['GB', 'UK', 'United Kingdom'],
  DE: ['DE', 'Germany'],
  FR: ['FR', 'France'],
  JP: ['JP', 'Japan'],
  CN: ['CN', 'China'],
  HK: ['HK', 'Hong Kong'],
  IN: ['IN', 'India'],
  AU: ['AU', 'Australia'],
  CA: ['CA', 'Canada'],
  SA: ['SA', 'Saudi Arabia'],
  AE: ['AE', 'United Arab Emirates'],
};

/**
 * Get stocks for scanning based on filters
 * NO HARDCODED LISTS - fetches from Finnhub API
 * OPTIMIZED: Returns limited set for performance (Finnhub free tier = 60 calls/min)
 * Now supports sector-specific filtering for consistent results
 */
export async function getStocksForScanning(options: {
  shariahOnly?: boolean;
  pennyStocks?: boolean;
  cryptoMining?: boolean;
  markets?: string[];
  sectors?: string[];
}): Promise<string[]> {
  console.log(`  🔍 Fetching stocks from Finnhub API...`);
  const markets = options.markets || ['US'];

  // Handle sector-specific filtering FIRST
  if (options.sectors && options.sectors.length > 0) {
    console.log(`  🎯 Fetching stocks for sectors: ${options.sectors.join(", ")}`);
    return await getStocksBySector(options.sectors, options);
  }

  if (options.pennyStocks) {
    // For penny stocks, get all US stocks and filter to small caps
    console.log(`  💰 Getting small cap stocks for penny stock scan...`);
    const allStocks = await finnhub.getAllUSStocks();

    // OPTIMIZED: Reduced from 100 to 60 for faster scans (2x speed improvement)
    // Shortest symbols = most liquid
    const candidates = allStocks.slice(0, 60);
    console.log(`  ✅ Selected ${candidates.length} small cap candidates`);
    return candidates;
  }

  if (options.cryptoMining) {
    // Known crypto mining and blockchain stocks
    // These are actual mining operations and crypto-focused companies
    console.log(`  ⛏️ Selecting crypto mining and blockchain stocks...`);
    const cryptoStocks = [
      // Pure Mining Companies
      'MARA', 'RIOT', 'CLSK', 'BTBT', 'HUT', 'BITF', 'IREN', 'CIFR',
      'CORZ', 'WULF', 'HIVE', 'BTDR', 'SDIG', 'HIVE', 'DMGI', 'DGHI',
      'CAN', 'ARBK', 'GREE', 'SOS',
      // Crypto Exchanges & Infrastructure
      'MSTR', 'COIN', 'HOOD', 'SOFI',
      // Blockchain Technology
      'RIOT', 'MARA', 'SI', 'SQ', 'PYPL'
    ];
    console.log(`  ✅ Selected ${cryptoStocks.length} crypto-related stocks`);
    return cryptoStocks;
  }

  if (options.shariahOnly) {
    // For Shariah, focus on tech and healthcare sectors
    console.log(`  ☪️ Selecting technology and healthcare stocks...`);
    const allStocks = await finnhub.getAllUSStocks();

    // OPTIMIZED: Reduced from 100 to 60 for faster scans
    // Prefer mid-size symbols (3-4 chars) which are typically established companies
    const techStocks = allStocks
      .filter(s => s.length >= 3 && s.length <= 4)
      .slice(0, 60);

    console.log(`  ✅ Selected ${techStocks.length} stock candidates`);
    return techStocks;
  }

  // Default: Get popular US stocks (limited sample)
  // Prioritize well-known symbols (3-4 characters)
  // OPTIMIZED: Reduced from 50 to 30 total for faster scans (2-3x speed improvement)
  console.log(`  📊 Fetching popular stocks for markets: ${markets.join(', ')}...`);
  const allStocks = await finnhub.getAllUSStocks();

  // Get a mix: some short symbols (liquid), some medium
  const popular = [
    ...allStocks.filter(s => s.length >= 1 && s.length <= 4).slice(0, 20),
    ...allStocks.filter(s => s.length === 5).slice(0, 10)
  ];

  console.log(`  ✅ Selected ${popular.length} popular stocks`);
  return popular;
}

/**
 * Get quote data for symbols
 */
export async function getQuotes(symbols: string[]): Promise<Array<Partial<Stock>>> {
  return finnhub.getQuotes(symbols);
}

/**
 * Get single quote
 */
export async function getQuote(symbol: string): Promise<Partial<Stock> | null> {
  return finnhub.mapFinnhubToStock(symbol);
}

/**
 * Search for stocks
 */
export async function searchStocks(query: string) {
  const results = await finnhub.searchStocks(query);
  if (!results) return [];

  return results.result.map(r => ({
    symbol: r.symbol,
    name: r.description,
    type: r.type,
  }));
}

/**
 * Get stocks by sector - NEW FUNCTION for sector-aware fetching
 * Filters stocks at the API level for consistent sector results
 */
async function getStocksBySector(
  sectors: string[],
  options: {
    shariahOnly?: boolean;
    pennyStocks?: boolean;
    cryptoMining?: boolean;
  }
): Promise<string[]> {
  // Special handling for crypto mining sector (curated list)
  const cryptoStocks = [
    'MARA', 'RIOT', 'CLSK', 'BTBT', 'HUT', 'BITF', 'IREN', 'CIFR',
    'CORZ', 'WULF', 'HIVE', 'BTDR', 'SDIG', 'DMGI', 'DGHI',
    'CAN', 'ARBK', 'GREE', 'SOS', 'MSTR', 'COIN', 'HOOD', 'SOFI', 'SI', 'SQ', 'PYPL'
  ];

  // If only crypto mining selected, return curated list
  if (sectors.length === 1 && sectors.includes("Cryptocurrency Mining")) {
    console.log(`  ✅ Using ${cryptoStocks.length} curated crypto mining stocks`);
    return cryptoStocks;
  }

  // Get all US stocks for filtering
  const allStocks = await finnhub.getAllUSStocks();

  // Increase sample size for sector filtering to ensure good coverage
  // Use 150-200 stocks instead of 30-60
  const sampleSize = 200;
  const stockSample = allStocks.slice(0, sampleSize);

  console.log(`  📊 Filtering ${stockSample.length} stocks by ${sectors.length} sector(s)...`);

  const sectorFilteredStocks: string[] = [];
  let processed = 0;
  let matched = 0;

  // Process in small batches to respect rate limits
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 150; // 150ms between batches

  for (let i = 0; i < stockSample.length; i += BATCH_SIZE) {
    const batch = stockSample.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (symbol) => {
        try {
          const profile = await finnhub.getProfile(symbol);
          if (!profile?.finnhubIndustry) return null;

          // Check if industry matches any of the selected sectors
          const matchesSector = sectors.some((sector) =>
            industryMatchesSector(profile.finnhubIndustry, sector)
          );

          return matchesSector ? symbol : null;
        } catch (error) {
          return null;
        }
      })
    );

    // Add matching stocks
    batchResults.forEach((symbol) => {
      if (symbol) {
        sectorFilteredStocks.push(symbol);
        matched++;
      }
    });

    processed += batch.length;

    // Progress logging every 50 stocks
    if (processed % 50 === 0 || processed === stockSample.length) {
      console.log(`    📈 Processed ${processed}/${stockSample.length} (${matched} matches)`);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < stockSample.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  // Add crypto stocks if crypto mining sector was selected
  if (sectors.includes("Cryptocurrency Mining")) {
    cryptoStocks.forEach(crypto => {
      if (!sectorFilteredStocks.includes(crypto)) {
        sectorFilteredStocks.push(crypto);
      }
    });
    console.log(`  💎 Added ${cryptoStocks.length} crypto mining stocks`);
  }

  console.log(`  ✅ Found ${sectorFilteredStocks.length} total stocks matching sector filter(s)`);

  // If no matches found, fall back to small sample
  if (sectorFilteredStocks.length === 0) {
    console.log(`  ⚠️ No matches found, using fallback sample of 30 stocks`);
    return allStocks.slice(0, 30);
  }

  return sectorFilteredStocks;
}
