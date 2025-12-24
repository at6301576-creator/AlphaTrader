import {
  getQuotes,
  getStocksForScanning,
  searchStocks,
} from "@/lib/api/stock-data";
import { quickShariahCheck } from "./shariah-screener";
import type { ScannerFilters, ScanResult, ScanSignal, ScanType, Market } from "@/types/scanner";
import type { Stock } from "@/types/stock";

// Market to index mapping
const MARKET_INDICES: Record<Market, string> = {
  US: "SP500",
  UK: "UK",
  DE: "DE",
  FR: "DE", // Use German stocks for now
  JP: "SP500", // Fallback
  CN: "SP500",
  HK: "SP500",
  IN: "SP500",
  AU: "SP500",
  CA: "SP500",
  SA: "SP500",
  AE: "SP500",
};

// Market to country code mapping
const MARKET_TO_COUNTRY: Record<Market, string[]> = {
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

function passesMarketFilter(stock: Stock, markets: Market[]): boolean {
  // If no country data available, allow it through (for backwards compatibility)
  if (!stock.country) return true;

  // Check if stock's country matches any selected market
  for (const market of markets) {
    const allowedCountries = MARKET_TO_COUNTRY[market];
    if (allowedCountries && allowedCountries.some(c =>
      stock.country?.toUpperCase().includes(c.toUpperCase()) ||
      c.toUpperCase().includes(stock.country?.toUpperCase() || '')
    )) {
      return true;
    }
  }

  return false;
}

// Helper to calculate daily % change (Finnhub doesn't provide this directly)
function calculateDailyChangePercent(stock: Stock): number {
  if (!stock.currentPrice || !stock.previousClose || stock.previousClose === 0) {
    return 0;
  }
  return ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;
}

export async function scanMarket(filters: ScannerFilters): Promise<ScanResult[]> {
  console.log("📊 Market scanner starting...");
  const startTime = Date.now();

  // Get stock symbols using Finnhub API (NO hardcoded lists!)
  // NOW with sector-aware filtering for consistent results!
  let symbols: string[];

  // Build options for stock fetching
  const fetchOptions: {
    markets: string[];
    sectors?: string[];
    cryptoMining?: boolean;
    pennyStocks?: boolean;
    shariahOnly?: boolean;
  } = {
    markets: filters.markets,
  };

  // Add sectors if specified - this enables sector-aware filtering
  if (filters.sectors && filters.sectors.length > 0) {
    fetchOptions.sectors = filters.sectors;
  }

  // Handle special scan types
  if (filters.scanType === "penny_stocks") {
    fetchOptions.pennyStocks = true;
    // Override filters for penny stocks
    filters = {
      ...filters,
      maxPrice: 5,
      minMarketCap: undefined,
    };
  } else if (filters.shariahCompliantOnly) {
    fetchOptions.shariahOnly = true;
  }

  // Fetch stocks with sector filtering applied at the API level
  symbols = await getStocksForScanning(fetchOptions);

  console.log(`  Total symbols to scan: ${symbols.length}`);

  // Fetch quotes from Finnhub (rate-limited, cached)
  console.log(`  Fetching stock data from Finnhub...`);
  const stocks = await getQuotes(symbols);

  console.log(`  Successfully fetched ${stocks.length} stocks from Finnhub`);

  // OPTIMIZED: Parallel batch processing with controlled concurrency
  const results: ScanResult[] = [];
  const BATCH_SIZE = 50; // Process 50 stocks at a time
  const MAX_CONCURRENT = 5; // Maximum concurrent batches

  // Process stocks in batches to avoid overwhelming the system
  for (let i = 0; i < stocks.length; i += BATCH_SIZE * MAX_CONCURRENT) {
    const batchPromises: Promise<ScanResult | null>[] = [];

    // Create up to MAX_CONCURRENT batches
    for (let j = 0; j < MAX_CONCURRENT; j++) {
      const batchStart = i + (j * BATCH_SIZE);
      if (batchStart >= stocks.length) break;

      const batch = stocks.slice(batchStart, batchStart + BATCH_SIZE);

      // Process each batch in parallel
      const batchResults = batch.map(async (stockData) => {
        try {
          // Skip if stock data is null/undefined or doesn't have required data
          if (!stockData || !stockData.symbol) return null;

          const stock = stockData as Stock;

          // Apply country/market filter
          if (!passesMarketFilter(stock, filters.markets)) return null;

          // Apply basic filters
          if (!passesBasicFilters(stock, filters)) return null;

          // Check Shariah compliance for all stocks
          const isShariahCompliant = quickShariahCheck(stock.sector || undefined, stock.industry || undefined);
          stock.isShariahCompliant = isShariahCompliant;

          // Apply Shariah filter if enabled
          if (filters.shariahCompliantOnly && !isShariahCompliant) {
            return null;
          }

          // Score based on scan type or sector (crypto mining)
          let scoreResult;
          if (filters.sectors.includes("Cryptocurrency Mining")) {
            scoreResult = scoreCryptoMining(stock, stockData, []);
          } else {
            scoreResult = scoreStock(stock, stockData, filters.scanType);
          }
          const { score, signals } = scoreResult;

          // Only include stocks with positive scores
          if (score > 0) {
            return {
              stock,
              score,
              signals,
              recommendation: getRecommendation(score),
              reasonSummary: generateReasonSummary(signals),
            };
          }
          return null;
        } catch (error) {
          console.error(`Error processing ${stockData.symbol}:`, error);
          return null;
        }
      });

      batchPromises.push(...batchResults);
    }

    // Wait for all batches in this group to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is ScanResult => r !== null));

    // Log progress
    const progress = Math.min(100, Math.round(((i + BATCH_SIZE * MAX_CONCURRENT) / stocks.length) * 100));
    console.log(`  ⚡ Progress: ${progress}% (${results.length} results found)`);
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  // Log Shariah compliance stats
  const compliantCount = results.filter(r => r.stock.isShariahCompliant).length;
  console.log(`  📋 Shariah compliance: ${compliantCount}/${results.length} stocks are compliant`);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`  ⚡ Scan completed in ${elapsedTime}s - Found ${results.length} results`);

  // Return ALL results (no limit)
  return results;
}

function passesBasicFilters(stock: Stock, filters: ScannerFilters): boolean {
  // Price filter
  if (filters.minPrice && (stock.currentPrice || 0) < filters.minPrice) return false;
  if (filters.maxPrice && (stock.currentPrice || 0) > filters.maxPrice) return false;

  // Market cap filter (in millions)
  const marketCapInMillions = (stock.marketCap || 0) / 1_000_000;
  if (filters.minMarketCap && marketCapInMillions < filters.minMarketCap) return false;
  if (filters.maxMarketCap && marketCapInMillions > filters.maxMarketCap) return false;

  // P/E filter
  if (filters.maxPERatio && stock.peRatio && stock.peRatio > filters.maxPERatio) return false;
  if (filters.minPERatio && stock.peRatio && stock.peRatio < filters.minPERatio) return false;

  // P/B filter
  if (filters.maxPBRatio && stock.pbRatio && stock.pbRatio > filters.maxPBRatio) return false;

  // Dividend yield filter
  if (filters.minDividendYield && (stock.dividendYield || 0) < filters.minDividendYield) return false;
  if (filters.maxDividendYield && (stock.dividendYield || 0) > filters.maxDividendYield) return false;

  // Sector filter
  if (filters.sectors.length > 0 && stock.sector) {
    if (!filters.sectors.includes(stock.sector)) return false;
  }

  return true;
}

function scoreStock(
  stock: Stock,
  quote: Partial<Stock>,
  scanType: ScanType
): { score: number; signals: ScanSignal[] } {
  const signals: ScanSignal[] = [];
  let score = 0;

  switch (scanType) {
    case "undervalued":
      return scoreUndervalued(stock, signals);
    case "momentum":
      return scoreMomentum(stock, quote, signals);
    case "dividend":
      return scoreDividend(stock, signals);
    case "growth":
      return scoreGrowth(stock, signals);
    case "value":
      return scoreValue(stock, signals);
    case "quality":
      return scoreQuality(stock, signals);
    case "turnaround":
      return scoreTurnaround(stock, quote, signals);
    case "breakout":
      return scoreBreakout(stock, quote, signals);
    case "penny_stocks":
      return scorePennyStock(stock, quote, signals);
    default:
      return { score, signals };
  }
}

function scoreUndervalued(stock: Stock, signals: ScanSignal[]): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Give base score for having valid price data
  if (stock.currentPrice && stock.currentPrice > 0) {
    score += 5; // Base score
  }

  // Low P/E ratio (more lenient thresholds)
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio < 15) {
      score += 30;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Low P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: 30,
      });
    } else if (stock.peRatio < 20) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Reasonable P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: 20,
      });
    } else if (stock.peRatio > 40) {
      score -= 5;
      signals.push({
        type: "negative",
        category: "valuation",
        message: `High P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: -5,
      });
    }
  }

  // Low P/B ratio (more lenient)
  if (stock.pbRatio && stock.pbRatio > 0) {
    if (stock.pbRatio < 1.5) {
      score += 25;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Low P/B ratio of ${stock.pbRatio.toFixed(2)}`,
        weight: 25,
      });
    } else if (stock.pbRatio < 3) {
      score += 15;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Reasonable P/B ratio of ${stock.pbRatio.toFixed(2)}`,
        weight: 15,
      });
    }
  }

  // Near 52-week low (more lenient)
  if (stock.currentPrice && stock.week52Low && stock.week52High) {
    const range = stock.week52High - stock.week52Low;
    if (range > 0) {
      const positionInRange = (stock.currentPrice - stock.week52Low) / range;

      if (positionInRange < 0.3) {
        score += 20;
        signals.push({
          type: "positive",
          category: "valuation",
          message: "Near 52-week low - value opportunity",
          weight: 20,
        });
      } else if (positionInRange < 0.5) {
        score += 10;
        signals.push({
          type: "positive",
          category: "valuation",
          message: "Below mid-range",
          weight: 10,
        });
      }
    }
  }

  // Has dividend
  if (stock.dividendYield && stock.dividendYield > 0) {
    if (stock.dividendYield > 3) {
      score += 15;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Strong dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 15,
      });
    } else if (stock.dividendYield > 1) {
      score += 10;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 10,
      });
    }
  }

  // Price decline (potential value)
  if (stock.currentPrice && stock.previousClose && stock.previousClose > 0) {
    const change = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;
    if (change < -3) {
      score += 15;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Recent decline of ${Math.abs(change).toFixed(1)}% - potential value`,
        weight: 15,
      });
    }
  }

  return { score, signals };
}

function scoreMomentum(
  stock: Stock,
  quote: Partial<Stock>,
  signals: ScanSignal[]
): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Positive price change (calculate from current/previous close)
  const changePercent = calculateDailyChangePercent(stock);
  if (changePercent > 3) {
    score += 20;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Strong daily gain of ${changePercent.toFixed(1)}%`,
      weight: 20,
    });
  } else if (changePercent > 1) {
    score += 10;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Positive daily movement of ${changePercent.toFixed(1)}%`,
      weight: 10,
    });
  }

  // High volume
  if (stock.volume && stock.avgVolume) {
    const volumeRatio = stock.volume / stock.avgVolume;
    if (volumeRatio > 2) {
      score += 15;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Volume ${volumeRatio.toFixed(1)}x above average`,
        weight: 15,
      });
    }
  }

  // Near 52-week high (momentum continuation)
  if (stock.currentPrice && stock.week52High) {
    const percentFromHigh = ((stock.week52High - stock.currentPrice) / stock.week52High) * 100;
    if (percentFromHigh < 5) {
      score += 20;
      signals.push({
        type: "positive",
        category: "momentum",
        message: "Near 52-week high - strong momentum",
        weight: 20,
      });
    }
  }

  return { score, signals };
}

function scoreDividend(stock: Stock, signals: ScanSignal[]): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // High dividend yield
  if (stock.dividendYield) {
    if (stock.dividendYield > 5) {
      score += 30;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `High dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 30,
      });
    } else if (stock.dividendYield > 3) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Good dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 20,
      });
    } else if (stock.dividendYield > 2) {
      score += 10;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 10,
      });
    }
  }

  // Sustainable payout (low P/E suggests sustainable)
  if (stock.peRatio && stock.peRatio > 0 && stock.peRatio < 20) {
    score += 15;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Reasonable P/E suggests sustainable dividend",
      weight: 15,
    });
  }

  // Large cap stability
  if (stock.marketCap && stock.marketCap > 10_000_000_000) {
    score += 10;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Large cap company - dividend stability",
      weight: 10,
    });
  }

  return { score, signals };
}

function scoreGrowth(stock: Stock, signals: ScanSignal[]): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Note: Finnhub free tier doesn't provide revenue/earnings growth data
  // Using alternative growth indicators based on available metrics

  // High P/E ratio (growth stocks typically have higher P/E)
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio > 30) {
      score += 25;
      signals.push({
        type: "positive",
        category: "growth",
        message: `High growth P/E of ${stock.peRatio.toFixed(1)} (market expects strong growth)`,
        weight: 25,
      });
    } else if (stock.peRatio > 20) {
      score += 15;
      signals.push({
        type: "positive",
        category: "growth",
        message: `Growth-oriented P/E of ${stock.peRatio.toFixed(1)}`,
        weight: 15,
      });
    } else if (stock.peRatio < 10) {
      // Very low P/E is not a growth indicator
      score -= 5;
      signals.push({
        type: "negative",
        category: "growth",
        message: `Low P/E ${stock.peRatio.toFixed(1)} suggests value, not growth`,
        weight: -5,
      });
    }
  }

  // Growth sectors (Technology, Healthcare, Consumer Cyclical)
  const sector = (stock.sector || "").toLowerCase();
  const industry = (stock.industry || "").toLowerCase();
  const growthSectors = ["technology", "healthcare", "biotechnology", "software", "internet", "e-commerce", "cloud"];
  const isGrowthSector = growthSectors.some(s => sector.includes(s) || industry.includes(s));

  if (isGrowthSector) {
    score += 20;
    signals.push({
      type: "positive",
      category: "growth",
      message: `Growth sector: ${stock.sector || stock.industry}`,
      weight: 20,
    });
  }

  // Market cap sweet spot for growth (mid-to-large cap, but not mega-cap)
  if (stock.marketCap) {
    const capInBillions = stock.marketCap / 1_000_000_000;
    if (capInBillions > 2 && capInBillions < 50) {
      score += 15;
      signals.push({
        type: "positive",
        category: "growth",
        message: `Mid-cap growth opportunity ($${capInBillions.toFixed(1)}B)`,
        weight: 15,
      });
    } else if (capInBillions >= 50 && capInBillions < 200) {
      score += 10;
      signals.push({
        type: "positive",
        category: "growth",
        message: `Large-cap with growth potential`,
        weight: 10,
      });
    }
  }

  // Strong year-over-year price performance (proxy for growth)
  if (stock.currentPrice && stock.week52Low && stock.week52High) {
    const range = stock.week52High - stock.week52Low;
    const positionInRange = (stock.currentPrice - stock.week52Low) / range;

    if (positionInRange > 0.7) {
      score += 20;
      signals.push({
        type: "positive",
        category: "growth",
        message: `Strong price momentum - near 52-week high`,
        weight: 20,
      });
    } else if (positionInRange > 0.5) {
      score += 10;
      signals.push({
        type: "positive",
        category: "growth",
        message: `Positive price trend`,
        weight: 10,
      });
    }
  }

  // Low or no dividend (growth companies reinvest profits)
  if (!stock.dividendYield || stock.dividendYield < 1) {
    score += 10;
    signals.push({
      type: "positive",
      category: "growth",
      message: `Reinvesting profits for growth (low/no dividend)`,
      weight: 10,
    });
  } else if (stock.dividendYield > 3) {
    // High dividend suggests mature, not growth
    score -= 5;
    signals.push({
      type: "negative",
      category: "growth",
      message: `High dividend suggests mature company, not growth`,
      weight: -5,
    });
  }

  return { score, signals };
}

function scoreValue(stock: Stock, signals: ScanSignal[]): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Low P/E (core value metric)
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio < 10) {
      score += 30;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Deep value P/E of ${stock.peRatio.toFixed(1)}`,
        weight: 30,
      });
    } else if (stock.peRatio < 15) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Value P/E of ${stock.peRatio.toFixed(1)}`,
        weight: 20,
      });
    } else if (stock.peRatio > 30) {
      score -= 10;
      signals.push({
        type: "negative",
        category: "valuation",
        message: `High P/E ${stock.peRatio.toFixed(1)} - not a value stock`,
        weight: -10,
      });
    }
  }

  // Low P/B (book value metric)
  if (stock.pbRatio && stock.pbRatio > 0) {
    if (stock.pbRatio < 1) {
      score += 25;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Trading below book value (P/B: ${stock.pbRatio.toFixed(2)})`,
        weight: 25,
      });
    } else if (stock.pbRatio < 1.5) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Low P/B of ${stock.pbRatio.toFixed(2)}`,
        weight: 20,
      });
    } else if (stock.pbRatio < 2.5) {
      score += 10;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Reasonable P/B of ${stock.pbRatio.toFixed(2)}`,
        weight: 10,
      });
    }
  }

  // Dividend (value stocks often pay dividends)
  if (stock.dividendYield && stock.dividendYield > 0) {
    if (stock.dividendYield > 3) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `High dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 20,
      });
    } else if (stock.dividendYield > 1) {
      score += 10;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Dividend yield of ${stock.dividendYield.toFixed(1)}%`,
        weight: 10,
      });
    }
  }

  // Near 52-week low (value opportunity)
  if (stock.currentPrice && stock.week52Low && stock.week52High) {
    const range = stock.week52High - stock.week52Low;
    const positionInRange = (stock.currentPrice - stock.week52Low) / range;

    if (positionInRange < 0.2) {
      score += 15;
      signals.push({
        type: "positive",
        category: "valuation",
        message: "Near 52-week low - potential value opportunity",
        weight: 15,
      });
    } else if (positionInRange < 0.4) {
      score += 10;
      signals.push({
        type: "positive",
        category: "valuation",
        message: "Below mid-range - value territory",
        weight: 10,
      });
    }
  }

  return { score, signals };
}

function scoreQuality(stock: Stock, signals: ScanSignal[]): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Note: Finnhub free tier doesn't provide ROE, profit margin, debt-to-equity
  // Using alternative quality indicators based on available metrics

  // Large market cap (quality companies are typically well-established)
  if (stock.marketCap) {
    const capInBillions = stock.marketCap / 1_000_000_000;
    if (capInBillions > 100) {
      score += 30;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Mega-cap leader ($${capInBillions.toFixed(1)}B) - exceptional quality`,
        weight: 30,
      });
    } else if (capInBillions > 50) {
      score += 25;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Large-cap stability ($${capInBillions.toFixed(1)}B)`,
        weight: 25,
      });
    } else if (capInBillions > 10) {
      score += 15;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Established mid-cap company`,
        weight: 15,
      });
    }
  }

  // Pays dividend (quality companies return value to shareholders)
  if (stock.dividendYield && stock.dividendYield > 0) {
    if (stock.dividendYield > 2 && stock.dividendYield < 6) {
      score += 25;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Healthy dividend yield of ${stock.dividendYield.toFixed(1)}% - sustainable returns`,
        weight: 25,
      });
    } else if (stock.dividendYield > 0 && stock.dividendYield <= 2) {
      score += 15;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Pays dividend - shareholder-friendly`,
        weight: 15,
      });
    } else if (stock.dividendYield >= 6) {
      // Very high dividend may be unsustainable or distressed
      score += 5;
      signals.push({
        type: "neutral",
        category: "quality",
        message: `High dividend ${stock.dividendYield.toFixed(1)}% - verify sustainability`,
        weight: 5,
      });
    }
  }

  // Profitable with reasonable P/E (quality companies are profitable)
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio > 5 && stock.peRatio < 25) {
      score += 20;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Profitable with reasonable P/E of ${stock.peRatio.toFixed(1)}`,
        weight: 20,
      });
    } else if (stock.peRatio >= 25 && stock.peRatio < 40) {
      score += 10;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Profitable - market values quality`,
        weight: 10,
      });
    }
  } else if (!stock.peRatio || stock.peRatio < 0) {
    // No P/E or negative = unprofitable
    score -= 15;
    signals.push({
      type: "negative",
      category: "quality",
      message: `Not currently profitable`,
      weight: -15,
    });
  }

  // Low volatility (beta) indicates stability
  if (stock.beta !== null && stock.beta !== undefined) {
    if (stock.beta >= 0 && stock.beta < 0.8) {
      score += 15;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Low volatility (beta ${stock.beta.toFixed(2)}) - defensive quality`,
        weight: 15,
      });
    } else if (stock.beta >= 0.8 && stock.beta <= 1.2) {
      score += 10;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Market-level volatility - stable`,
        weight: 10,
      });
    }
  }

  // Low P/B ratio (trading below book value can indicate quality at discount)
  if (stock.pbRatio && stock.pbRatio > 0) {
    if (stock.pbRatio > 1 && stock.pbRatio < 3) {
      score += 10;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Reasonable P/B of ${stock.pbRatio.toFixed(2)} - solid book value`,
        weight: 10,
      });
    }
  }

  return { score, signals };
}

function scoreTurnaround(
  stock: Stock,
  quote: Partial<Stock>,
  signals: ScanSignal[]
): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Price recovery from 52-week low
  if (stock.currentPrice && stock.week52Low && stock.week52High) {
    const range = stock.week52High - stock.week52Low;
    const recoveryPercent = ((stock.currentPrice - stock.week52Low) / range) * 100;

    if (recoveryPercent > 20 && recoveryPercent < 50) {
      score += 25;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Recovering from lows - ${recoveryPercent.toFixed(0)}% off bottom`,
        weight: 25,
      });
    }
  }

  // Recent positive momentum
  const changePercent = calculateDailyChangePercent(stock);
  if (changePercent > 3) {
    score += 20;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Strong daily gain of ${changePercent.toFixed(1)}%`,
      weight: 20,
    });
  } else if (changePercent > 0) {
    score += 10;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Positive momentum`,
      weight: 10,
    });
  }

  // Improving profitability (check if profitable with positive P/E)
  if (stock.peRatio && stock.peRatio > 0) {
    score += 20;
    signals.push({
      type: "positive",
      category: "quality",
      message: `Now profitable (P/E: ${stock.peRatio.toFixed(1)})`,
      weight: 20,
    });
  }

  // High volume (interest in turnaround)
  if (stock.volume && stock.avgVolume) {
    const volumeRatio = stock.volume / stock.avgVolume;
    if (volumeRatio > 1.5) {
      score += 15;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Increased trading interest`,
        weight: 15,
      });
    }
  }

  // Low valuation (room for recovery)
  if (stock.peRatio && stock.peRatio > 0 && stock.peRatio < 15) {
    score += 10;
    signals.push({
      type: "positive",
      category: "valuation",
      message: `Attractive valuation P/E ${stock.peRatio.toFixed(1)}`,
      weight: 10,
    });
  }

  return { score, signals };
}

function scoreBreakout(
  stock: Stock,
  quote: Partial<Stock>,
  signals: ScanSignal[]
): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Near or at 52-week high (breakout)
  if (stock.currentPrice && stock.week52High) {
    const percentFromHigh = ((stock.week52High - stock.currentPrice) / stock.week52High) * 100;

    if (percentFromHigh < 2) {
      score += 30;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `At 52-week high - strong breakout`,
        weight: 30,
      });
    } else if (percentFromHigh < 5) {
      score += 20;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Near 52-week high - potential breakout`,
        weight: 20,
      });
    }
  }

  // Strong daily momentum
  const changePercent = calculateDailyChangePercent(stock);
  if (changePercent > 5) {
    score += 25;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Explosive move: ${changePercent.toFixed(1)}%`,
      weight: 25,
    });
  } else if (changePercent > 2) {
    score += 15;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Strong momentum: ${changePercent.toFixed(1)}%`,
      weight: 15,
    });
  }

  // Volume confirmation (critical for breakouts)
  if (stock.volume && stock.avgVolume) {
    const volumeRatio = stock.volume / stock.avgVolume;
    if (volumeRatio > 2.5) {
      score += 30;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Massive volume: ${volumeRatio.toFixed(1)}x average`,
        weight: 30,
      });
    } else if (volumeRatio > 1.5) {
      score += 20;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `High volume confirmation`,
        weight: 20,
      });
    }
  }

  return { score, signals };
}

function scorePennyStock(
  stock: Stock,
  quote: Partial<Stock>,
  signals: ScanSignal[]
): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Must be under $5
  if (!stock.currentPrice || stock.currentPrice >= 5) {
    return { score: 0, signals };
  }

  // IMPROVED: Give substantial base score to all penny stocks (30 points)
  // This ensures more stocks pass the threshold (threshold is typically 10-30)
  score += 30;
  signals.push({
    type: "positive",
    category: "valuation",
    message: `Penny stock at $${stock.currentPrice.toFixed(2)}`,
    weight: 30,
  });

  // Volume scoring - MORE LENIENT
  if (stock.volume && stock.avgVolume) {
    const volumeRatio = stock.volume / stock.avgVolume;
    if (volumeRatio > 2) {
      score += 25;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `High volume ${volumeRatio.toFixed(1)}x above average`,
        weight: 25,
      });
    } else if (volumeRatio > 1.5) {
      score += 15;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Above average volume`,
        weight: 15,
      });
    } else if (volumeRatio > 0.3) {
      // IMPROVED: Lower threshold from 0.5 to 0.3
      score += 10;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Active trading`,
        weight: 10,
      });
    }
  } else {
    // IMPROVED: Give more points when no volume data (15 instead of 10)
    score += 15;
    signals.push({
      type: "positive",
      category: "valuation",
      message: `Low-priced opportunity`,
      weight: 15,
    });
  }

  // Price momentum - MORE LENIENT
  const changePercent = calculateDailyChangePercent(stock);
  if (changePercent > 10) {
    score += 30;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Massive gain of ${changePercent.toFixed(1)}%`,
      weight: 30,
    });
  } else if (changePercent > 5) {
    score += 20;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Strong gain of ${changePercent.toFixed(1)}%`,
      weight: 20,
    });
  } else if (changePercent > 2) {
    score += 15;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Good momentum of ${changePercent.toFixed(1)}%`,
      weight: 15,
    });
  } else if (changePercent > 0) {
    score += 10;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Positive momentum`,
      weight: 10,
    });
  } else if (changePercent >= -2) {
    // IMPROVED: Even slightly negative movement gets points (stability)
    score += 5;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Stable price action`,
      weight: 5,
    });
  }

  // IMPROVED: Add bonus points for having market cap data (sign of legitimate company)
  if (stock.marketCap && stock.marketCap > 0) {
    score += 10;
    const capInMillions = stock.marketCap / 1_000_000;
    signals.push({
      type: "positive",
      category: "quality",
      message: `Market cap: $${capInMillions.toFixed(1)}M`,
      weight: 10,
    });
  }

  return { score, signals };
}

function scoreCryptoMining(
  stock: Stock,
  quote: Partial<Stock>,
  signals: ScanSignal[]
): { score: number; signals: ScanSignal[] } {
  let score = 0;

  // Check if related to crypto mining
  const industry = (stock.industry || "").toLowerCase();
  const sector = (stock.sector || "").toLowerCase();
  const name = (stock.name || "").toLowerCase();

  const cryptoKeywords = [
    "mining", "bitcoin", "crypto", "blockchain", "ethereum",
    "digital asset", "miner", "btc", "eth", "coin", "fintech", "web3", "defi"
  ];

  const isCryptoRelated = cryptoKeywords.some(
    keyword => industry.includes(keyword) || sector.includes(keyword) || name.includes(keyword)
  );

  // IMPROVED: Give substantial base score for all stocks (30 points)
  // Since these are pre-filtered crypto stocks, all should pass threshold
  if (isCryptoRelated) {
    score += 35;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Cryptocurrency/blockchain company",
      weight: 35,
    });
  } else {
    // IMPROVED: Higher base score even without keyword match (25 points)
    score += 25;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Crypto-related stock",
      weight: 25,
    });
  }

  // Price momentum - MORE LENIENT scoring
  const changePercent = calculateDailyChangePercent(stock);
  if (changePercent > 5) {
    score += 25;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Strong momentum of ${changePercent.toFixed(1)}%`,
      weight: 25,
    });
  } else if (changePercent > 2) {
    score += 15;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Positive momentum of ${changePercent.toFixed(1)}%`,
      weight: 15,
    });
  } else if (changePercent >= 0) {
    // IMPROVED: Give points for any positive movement
    score += 10;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Stable or rising`,
      weight: 10,
    });
  } else if (changePercent >= -3) {
    // IMPROVED: Small negative movement still gets points (volatility is normal)
    score += 5;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Normal volatility`,
      weight: 5,
    });
  }

  // Volume - MORE LENIENT
  if (stock.volume && stock.avgVolume) {
    const volumeRatio = stock.volume / stock.avgVolume;
    if (volumeRatio > 1.5) {
      score += 20;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `High trading volume`,
        weight: 20,
      });
    } else if (volumeRatio > 0.8) {
      // IMPROVED: Lower threshold
      score += 10;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Active trading`,
        weight: 10,
      });
    }
  }

  // Profitability - LESS PUNISHING for unprofitable stocks
  if (stock.peRatio && stock.peRatio > 0) {
    score += 20;
    signals.push({
      type: "positive",
      category: "quality",
      message: `Profitable (P/E: ${stock.peRatio.toFixed(1)})`,
      weight: 20,
    });
  } else if (!stock.peRatio || stock.peRatio < 0) {
    // IMPROVED: Don't penalize as heavily (many crypto stocks are growth-focused)
    score += 0;  // Neutral instead of -10
    signals.push({
      type: "neutral",
      category: "quality",
      message: "Growth-focused (currently unprofitable)",
      weight: 0,
    });
  }

  // Market cap - MORE INCLUSIVE
  if (stock.marketCap) {
    const capInBillions = stock.marketCap / 1_000_000_000;
    const capInMillions = stock.marketCap / 1_000_000;

    if (capInBillions > 1) {
      score += 15;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Established company ($${capInBillions.toFixed(1)}B)`,
        weight: 15,
      });
    } else if (capInMillions > 100) {
      // IMPROVED: Give points for mid-caps too
      score += 10;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Growing company ($${capInMillions.toFixed(0)}M)`,
        weight: 10,
      });
    } else if (capInMillions > 10) {
      // IMPROVED: Even small caps get points
      score += 5;
      signals.push({
        type: "positive",
        category: "quality",
        message: `Emerging company ($${capInMillions.toFixed(0)}M)`,
        weight: 5,
      });
    }
  }

  return { score, signals };
}

// Specialized scan for crypto mining stocks
// Removed scanCryptoMining function - now uses Finnhub API search instead of hardcoded lists

function getRecommendation(score: number): ScanResult["recommendation"] {
  if (score >= 70) return "strong_buy";
  if (score >= 50) return "buy";
  if (score >= 30) return "hold";
  if (score >= 10) return "sell";
  return "strong_sell";
}

function generateReasonSummary(signals: ScanSignal[]): string {
  const positives = signals.filter((s) => s.type === "positive");
  if (positives.length === 0) return "No significant positive signals detected.";

  const topSignals = positives
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((s) => s.message);

  return topSignals.join(". ") + ".";
}

// Quick scan for popular stocks
export async function quickScan(): Promise<ScanResult[]> {
  const defaultFilters: ScannerFilters = {
    scanType: "undervalued",
    markets: ["US"],
    sectors: [],
    shariahCompliantOnly: false,
    minMarketCap: 1000, // $1B minimum
    maxPERatio: 25,
  };

  return scanMarket(defaultFilters);
}
