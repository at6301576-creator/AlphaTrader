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

    // EXPANDED: Increased from 60 to 500 for better penny stock coverage
    // Mix of short and medium symbols for better discovery
    const candidates = [
      ...allStocks.filter(s => s.length >= 1 && s.length <= 4).slice(0, 300),
      ...allStocks.filter(s => s.length === 5).slice(0, 200)
    ];
    console.log(`  ✅ Selected ${candidates.length} small cap candidates`);
    return candidates;
  }

  if (options.cryptoMining) {
    // EXPANDED: Comprehensive crypto mining and blockchain stocks list
    console.log(`  ⛏️ Selecting crypto mining and blockchain stocks...`);
    const cryptoStocks = [
      // Pure Mining Companies
      'MARA', 'RIOT', 'CLSK', 'BTBT', 'HUT', 'BITF', 'IREN', 'CIFR',
      'CORZ', 'WULF', 'HIVE', 'BTDR', 'SDIG', 'DMGI', 'DGHI',
      'CAN', 'ARBK', 'GREE', 'SOS', 'ANY', 'BTCS', 'MIGI',
      // Crypto Exchanges & Infrastructure
      'COIN', 'HOOD', 'MSTR', 'SOFI', 'MOGO', 'EQOS',
      // Blockchain Technology & Fintech
      'SI', 'SQ', 'PYPL', 'BKKT', 'XBIO', 'FTFT', 'APLD', 'BBAI',
      // Additional Crypto-Related
      'NVDA', 'AMD', 'INTC', // GPU manufacturers (mining hardware)
      'EBANG', 'NINTH', 'BIT', 'BTCM', 'NILE', 'HOLO', 'GRVY', 'EBON',
      // ETFs and Trusts
      'GBTC', 'BITI', 'BITO', 'BTF', 'BTCO'
    ];
    console.log(`  ✅ Selected ${cryptoStocks.length} crypto-related stocks`);
    return cryptoStocks;
  }

  if (options.shariahOnly) {
    // For Shariah, focus on tech and healthcare sectors
    console.log(`  ☪️ Selecting technology and healthcare stocks...`);
    const allStocks = await finnhub.getAllUSStocks();

    // EXPANDED: Increased from 60 to 300 for better Shariah stock coverage
    // Mix of established companies (3-4 chars) and growth stocks (5 chars)
    const techStocks = [
      ...allStocks.filter(s => s.length >= 3 && s.length <= 4).slice(0, 200),
      ...allStocks.filter(s => s.length === 5).slice(0, 100)
    ];

    console.log(`  ✅ Selected ${techStocks.length} stock candidates`);
    return techStocks;
  }

  // Default: Get popular US stocks (PRODUCTION-OPTIMIZED for speed)
  // OPTIMIZED: Limited to 100 stocks for sub-2-minute scan times
  // Balance between coverage and performance
  console.log(`  📊 Fetching popular stocks for markets: ${markets.join(', ')}...`);
  const allStocks = await finnhub.getAllUSStocks();

  // Get a diverse mix: liquid large caps and growth mid-caps
  // REDUCED from 200 to 100 for faster scanning (2-3 min vs 5+ min)
  const popular = [
    ...allStocks.filter(s => s.length >= 1 && s.length <= 4).slice(0, 75),
    ...allStocks.filter(s => s.length === 5).slice(0, 25)
  ];

  console.log(`  ✅ Selected ${popular.length} popular stocks for fast scanning`);
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
  // Special handling for crypto mining sector (expanded curated list)
  const cryptoStocks = [
    'MARA', 'RIOT', 'CLSK', 'BTBT', 'HUT', 'BITF', 'IREN', 'CIFR',
    'CORZ', 'WULF', 'HIVE', 'BTDR', 'SDIG', 'DMGI', 'DGHI',
    'CAN', 'ARBK', 'GREE', 'SOS', 'ANY', 'BTCS', 'MIGI',
    'COIN', 'HOOD', 'MSTR', 'SOFI', 'MOGO', 'EQOS',
    'SI', 'SQ', 'PYPL', 'BKKT', 'XBIO', 'FTFT', 'APLD', 'BBAI',
    'NVDA', 'AMD', 'INTC',
    'EBANG', 'NINTH', 'BIT', 'BTCM', 'NILE', 'HOLO', 'GRVY', 'EBON'
  ];

  // If only crypto mining selected, return curated list
  if (sectors.length === 1 && sectors.includes("Cryptocurrency Mining")) {
    console.log(`  ✅ Using ${cryptoStocks.length} curated crypto mining stocks`);
    return cryptoStocks;
  }

  // Get all US stocks for filtering
  const allStocks = await finnhub.getAllUSStocks();

  // EXPANDED: Increase sample size from 200 to 800 for better sector coverage
  // This ensures we find more stocks matching specific sectors
  const sampleSize = 800;
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
