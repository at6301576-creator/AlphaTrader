import {
  getQuotes,
  getStocksForScanning,
  searchStocks,
} from "@/lib/api/stock-data";
import { quickShariahCheck } from "./shariah-screener";
import type { ScannerFilters, ScanResult, ScanSignal, ScanType, Market } from "@/types/scanner";
import type { Stock } from "@/types/stock";
import { batchFetchChartData } from "@/lib/api/technical-data";
import {
  calculateTechnicalIndicators,
  detectVolumeSurge,
  getRSISignal,
  getMACDSignal,
  getMASignal
} from "@/lib/technical-calculator";

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

  // Filter and score stocks
  const results: ScanResult[] = [];
  const processingPromises = stocks.map(async (stockData) => {
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

  const processedResults = await Promise.all(processingPromises);
  results.push(...processedResults.filter((r): r is ScanResult => r !== null));

  // Sort by fundamental score (descending)
  results.sort((a, b) => b.score - a.score);

  console.log(`  📊 Fundamental filtering complete: ${results.length} candidates`);

  // ============================================================================
  // PHASE 2: Technical Analysis on Top Candidates
  // ============================================================================

  // Take top 100 candidates for technical analysis (or all if less than 100)
  const topCandidates = results.slice(0, 100);

  if (topCandidates.length > 0) {
    console.log(`  🔍 Fetching technical data for top ${topCandidates.length} candidates...`);

    // Extract symbols
    const symbols = topCandidates.map(r => r.stock.symbol);

    // Batch fetch chart data (parallel with controlled concurrency)
    const chartDataMap = await batchFetchChartData(symbols, 10);

    console.log(`  📈 Chart data fetched for ${chartDataMap.size}/${symbols.length} stocks`);

    // Calculate technical indicators and enhance scoring
    for (const result of topCandidates) {
      const chartData = chartDataMap.get(result.stock.symbol);

      if (chartData && chartData.length > 0) {
        // Calculate technical indicators
        const technicalData = calculateTechnicalIndicators(chartData);
        result.stock.technicalData = technicalData;

        // Add technical scoring and signals
        if (technicalData) {
          const technicalBonus = addTechnicalScoring(result.stock, result.signals, filters.scanType);
          result.score += technicalBonus;
        }
      }
    }

    console.log(`  ✅ Technical analysis complete`);
  }

  // Re-sort by final score (fundamental + technical)
  results.sort((a, b) => b.score - a.score);

  // Log Shariah compliance stats
  const compliantCount = results.filter(r => r.stock.isShariahCompliant).length;
  console.log(`  📋 Shariah compliance: ${compliantCount}/${results.length} stocks are compliant`);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`  ⚡ Scan completed in ${elapsedTime}s`);

  // Return top 50 results
  return results.slice(0, 50);
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

  // Low P/E ratio
  if (stock.peRatio && stock.peRatio > 0) {
    if (stock.peRatio < 10) {
      score += 30;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Very low P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: 30,
      });
    } else if (stock.peRatio < 15) {
      score += 20;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Low P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: 20,
      });
    } else if (stock.peRatio > 30) {
      score -= 10;
      signals.push({
        type: "negative",
        category: "valuation",
        message: `High P/E ratio of ${stock.peRatio.toFixed(1)}`,
        weight: -10,
      });
    }
  }

  // Low P/B ratio
  if (stock.pbRatio && stock.pbRatio > 0) {
    if (stock.pbRatio < 1) {
      score += 25;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Trading below book value (P/B: ${stock.pbRatio.toFixed(2)})`,
        weight: 25,
      });
    } else if (stock.pbRatio < 2) {
      score += 15;
      signals.push({
        type: "positive",
        category: "valuation",
        message: `Low P/B ratio of ${stock.pbRatio.toFixed(2)}`,
        weight: 15,
      });
    }
  }

  // Near 52-week low
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
    }
  }

  // Has dividend
  if (stock.dividendYield && stock.dividendYield > 2) {
    score += 10;
    signals.push({
      type: "positive",
      category: "valuation",
      message: `Dividend yield of ${stock.dividendYield.toFixed(1)}%`,
      weight: 10,
    });
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

  // Price is under $5 - base score (increased from 10 to 20)
  score += 20;
  signals.push({
    type: "positive",
    category: "valuation",
    message: `Penny stock at $${stock.currentPrice.toFixed(2)}`,
    weight: 20,
  });

  // High volume (indicates liquidity)
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
    } else if (volumeRatio > 0.5) {
      // Give some points even for moderate volume
      score += 5;
      signals.push({
        type: "positive",
        category: "momentum",
        message: `Active trading`,
        weight: 5,
      });
    }
  } else {
    // If no volume data, give small baseline points (penny stocks often lack data)
    score += 10;
    signals.push({
      type: "positive",
      category: "valuation",
      message: `Low-priced opportunity`,
      weight: 10,
    });
  }

  // Strong daily momentum
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
    score += 10;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Good momentum of ${changePercent.toFixed(1)}%`,
      weight: 10,
    });
  } else if (changePercent >= 0) {
    // Even positive or flat movement gets some points
    score += 5;
    signals.push({
      type: "positive",
      category: "momentum",
      message: `Stable or rising`,
      weight: 5,
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
    "digital asset", "miner", "btc", "eth", "coin", "fintech"
  ];

  const isCryptoRelated = cryptoKeywords.some(
    keyword => industry.includes(keyword) || sector.includes(keyword) || name.includes(keyword)
  );

  // Give base score for all stocks in crypto scan (since they're pre-filtered)
  // Higher score if keywords match
  if (isCryptoRelated) {
    score += 20;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Cryptocurrency/blockchain company",
      weight: 20,
    });
  } else {
    // Still give points since it's in our crypto list
    score += 10;
    signals.push({
      type: "positive",
      category: "quality",
      message: "Crypto-related stock",
      weight: 10,
    });
  }

  // Strong price momentum (crypto stocks are volatile)
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
  }

  // High volume
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
    }
  }

  // Profitability (check with P/E since profit margin unavailable)
  if (stock.peRatio && stock.peRatio > 0) {
    score += 20;
    signals.push({
      type: "positive",
      category: "quality",
      message: `Profitable (P/E: ${stock.peRatio.toFixed(1)})`,
      weight: 20,
    });
  } else if (!stock.peRatio || stock.peRatio < 0) {
    score -= 10;
    signals.push({
      type: "negative",
      category: "quality",
      message: "Currently unprofitable",
      weight: -10,
    });
  }

  // Market cap consideration
  if (stock.marketCap) {
    const capInBillions = stock.marketCap / 1_000_000_000;
    if (capInBillions > 1) {
      score += 10;
      signals.push({
        type: "positive",
        category: "quality",
        message: "Established market cap over $1B",
        weight: 10,
      });
    }
  }

  return { score, signals };
}

// Specialized scan for crypto mining stocks
// Removed scanCryptoMining function - now uses Finnhub API search instead of hardcoded lists

/**
 * Add technical analysis scoring and signals to a stock
 * Returns the technical score bonus/penalty to add to fundamental score
 */
function addTechnicalScoring(
  stock: Stock,
  signals: ScanSignal[],
  scanType: ScanType
): number {
  let technicalScore = 0;

  const technical = stock.technicalData;
  if (!technical || !stock.currentPrice) return 0;

  // ============================================================================
  // RSI Analysis
  // ============================================================================
  if (technical.rsi !== null) {
    const rsiSignal = getRSISignal(technical.rsi);

    // RSI scoring varies by scan type
    if (scanType === "undervalued" || scanType === "value" || scanType === "turnaround") {
      // For value/undervalued scans, oversold RSI is positive
      if (rsiSignal.type === "oversold") {
        technicalScore += 15;
        signals.push({
          type: "positive",
          category: "technical",
          message: rsiSignal.message,
          weight: 15,
        });
      } else if (rsiSignal.type === "overbought") {
        technicalScore -= 5;
        signals.push({
          type: "negative",
          category: "technical",
          message: rsiSignal.message,
          weight: -5,
        });
      }
    } else if (scanType === "momentum" || scanType === "breakout" || scanType === "growth") {
      // For momentum scans, strong RSI (50-70) is positive
      if (technical.rsi >= 50 && technical.rsi <= 70) {
        technicalScore += 15;
        signals.push({
          type: "positive",
          category: "technical",
          message: `Strong momentum RSI at ${technical.rsi.toFixed(1)}`,
          weight: 15,
        });
      } else if (rsiSignal.type === "overbought") {
        technicalScore -= 10;
        signals.push({
          type: "negative",
          category: "technical",
          message: rsiSignal.message,
          weight: -10,
        });
      }
    }
  }

  // ============================================================================
  // MACD Analysis
  // ============================================================================
  if (technical.macd !== null) {
    const macdSignal = getMACDSignal(technical.macd);

    if (macdSignal.type === "bullish") {
      technicalScore += 10;
      signals.push({
        type: "positive",
        category: "technical",
        message: macdSignal.message,
        weight: 10,
      });
    } else if (macdSignal.type === "bearish") {
      technicalScore -= 10;
      signals.push({
        type: "negative",
        category: "technical",
        message: macdSignal.message,
        weight: -10,
      });
    }
  }

  // ============================================================================
  // Moving Average Analysis
  // ============================================================================
  const maSignal = getMASignal(stock.currentPrice, technical.sma50, technical.sma200);

  if (maSignal.type === "bullish") {
    technicalScore += 12;
    signals.push({
      type: "positive",
      category: "technical",
      message: maSignal.message,
      weight: 12,
    });
  } else if (maSignal.type === "bearish") {
    technicalScore -= 8;
    signals.push({
      type: "negative",
      category: "technical",
      message: maSignal.message,
      weight: -8,
    });
  }

  // ============================================================================
  // Volume Analysis
  // ============================================================================
  const volumeSurge = detectVolumeSurge(stock);
  if (volumeSurge) {
    if (scanType === "momentum" || scanType === "breakout") {
      // High volume is very positive for momentum/breakout scans
      technicalScore += 15;
      signals.push({
        type: "positive",
        category: "technical",
        message: "High volume surge detected - strong interest",
        weight: 15,
      });
    } else {
      // Moderate positive for other scan types
      technicalScore += 8;
      signals.push({
        type: "positive",
        category: "technical",
        message: "Above-average volume",
        weight: 8,
      });
    }
  }

  // ============================================================================
  // Bollinger Bands Analysis
  // ============================================================================
  if (technical.bollingerBands !== null && stock.currentPrice !== null) {
    const bb = technical.bollingerBands;
    const price = stock.currentPrice;

    if (scanType === "undervalued" || scanType === "value" || scanType === "turnaround") {
      // Price near/below lower band is positive for value scans
      if (price <= bb.lower * 1.02) {
        technicalScore += 10;
        signals.push({
          type: "positive",
          category: "technical",
          message: "Price at/below lower Bollinger Band - potential reversal",
          weight: 10,
        });
      }
    } else if (scanType === "momentum" || scanType === "breakout") {
      // Price near/above upper band is positive for momentum scans
      if (price >= bb.upper * 0.98) {
        technicalScore += 10;
        signals.push({
          type: "positive",
          category: "technical",
          message: "Price at/above upper Bollinger Band - strong momentum",
          weight: 10,
        });
      }
    }
  }

  // ============================================================================
  // Overall Trend Signal
  // ============================================================================
  if (technical.trendSignal === "bullish") {
    technicalScore += 8;
    signals.push({
      type: "positive",
      category: "technical",
      message: "Overall technical trend is bullish",
      weight: 8,
    });
  } else if (technical.trendSignal === "bearish") {
    technicalScore -= 8;
    signals.push({
      type: "negative",
      category: "technical",
      message: "Overall technical trend is bearish",
      weight: -8,
    });
  }

  return technicalScore;
}

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
