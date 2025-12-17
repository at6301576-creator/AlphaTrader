import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { screenerRequestSchema, safeValidate } from "@/lib/validation";

interface ScreenerFilters {
  // Price & Market Cap
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;

  // Valuation
  minPE?: number;
  maxPE?: number;
  minPB?: number;
  maxPB?: number;
  minPS?: number;
  maxPS?: number;

  // Dividends
  minDividendYield?: number;
  maxDividendYield?: number;

  // Growth
  minRevenueGrowth?: number;
  minEarningsGrowth?: number;

  // Profitability
  minProfitMargin?: number;
  minROE?: number;
  minROA?: number;

  // Financial Health
  maxDebtToEquity?: number;
  minCurrentRatio?: number;

  // Technical
  minBeta?: number;
  maxBeta?: number;
  near52WeekHigh?: boolean; // Within 10% of 52-week high
  near52WeekLow?: boolean; // Within 10% of 52-week low

  // Filters
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  shariahCompliant?: boolean;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting (10 screener requests per minute - it's expensive)
  const rateLimitResponse = await withRateLimit(
    request,
    { id: "screener", limit: 10, window: 60 },
    session.user.id
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = safeValidate(screenerRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "error" in validation ? validation.error : "Invalid input" },
        { status: 400 }
      );
    }

    const { filters, limit, sortBy, sortOrder } = validation.data;

    // Build Prisma where clause
    const where: any = {
      currentPrice: { not: null },
    };

    // Price filters
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      where.currentPrice = { ...where.currentPrice, gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      where.currentPrice = { ...where.currentPrice, lte: filters.maxPrice };
    }

    // Market cap filters
    if (filters.minMarketCap !== undefined && filters.minMarketCap !== null) {
      where.marketCap = { gte: filters.minMarketCap };
    }
    if (filters.maxMarketCap !== undefined && filters.maxMarketCap !== null) {
      where.marketCap = { ...where.marketCap, lte: filters.maxMarketCap };
    }

    // PE ratio filters
    const hasPE = (filters.minPE !== undefined && filters.minPE !== null) || (filters.maxPE !== undefined && filters.maxPE !== null);
    if (hasPE) {
      where.peRatio = {};
      if (filters.minPE !== undefined && filters.minPE !== null) where.peRatio.gte = filters.minPE;
      if (filters.maxPE !== undefined && filters.maxPE !== null) where.peRatio.lte = filters.maxPE;
    }

    // PB ratio filters
    const hasPB = (filters.minPB !== undefined && filters.minPB !== null) || (filters.maxPB !== undefined && filters.maxPB !== null);
    if (hasPB) {
      where.pbRatio = {};
      if (filters.minPB !== undefined && filters.minPB !== null) where.pbRatio.gte = filters.minPB;
      if (filters.maxPB !== undefined && filters.maxPB !== null) where.pbRatio.lte = filters.maxPB;
    }

    // PS ratio filters
    const hasPS = (filters.minPS !== undefined && filters.minPS !== null) || (filters.maxPS !== undefined && filters.maxPS !== null);
    if (hasPS) {
      where.psRatio = {};
      if (filters.minPS !== undefined && filters.minPS !== null) where.psRatio.gte = filters.minPS;
      if (filters.maxPS !== undefined && filters.maxPS !== null) where.psRatio.lte = filters.maxPS;
    }

    // Dividend yield filters
    const hasDividend = (filters.minDividendYield !== undefined && filters.minDividendYield !== null) || (filters.maxDividendYield !== undefined && filters.maxDividendYield !== null);
    if (hasDividend) {
      where.dividendYield = {};
      if (filters.minDividendYield !== undefined && filters.minDividendYield !== null) where.dividendYield.gte = filters.minDividendYield;
      if (filters.maxDividendYield !== undefined && filters.maxDividendYield !== null) where.dividendYield.lte = filters.maxDividendYield;
    }

    // Growth filters
    if (filters.minRevenueGrowth !== undefined && filters.minRevenueGrowth !== null) {
      where.revenueGrowth = { gte: filters.minRevenueGrowth };
    }
    if (filters.minEarningsGrowth !== undefined && filters.minEarningsGrowth !== null) {
      where.earningsGrowth = { gte: filters.minEarningsGrowth };
    }

    // Profitability filters
    if (filters.minProfitMargin !== undefined && filters.minProfitMargin !== null) {
      where.profitMargin = { gte: filters.minProfitMargin };
    }
    if (filters.minROE !== undefined && filters.minROE !== null) {
      where.roe = { gte: filters.minROE };
    }
    if (filters.minROA !== undefined && filters.minROA !== null) {
      where.roa = { gte: filters.minROA };
    }

    // Financial health filters
    if (filters.maxDebtToEquity !== undefined && filters.maxDebtToEquity !== null) {
      where.debtToEquity = { lte: filters.maxDebtToEquity };
    }
    if (filters.minCurrentRatio !== undefined && filters.minCurrentRatio !== null) {
      where.currentRatio = { gte: filters.minCurrentRatio };
    }

    // Beta filters
    const hasBeta = (filters.minBeta !== undefined && filters.minBeta !== null) || (filters.maxBeta !== undefined && filters.maxBeta !== null);
    if (hasBeta) {
      where.beta = {};
      if (filters.minBeta !== undefined && filters.minBeta !== null) where.beta.gte = filters.minBeta;
      if (filters.maxBeta !== undefined && filters.maxBeta !== null) where.beta.lte = filters.maxBeta;
    }

    // Categorical filters
    if (filters.sector) where.sector = filters.sector;
    if (filters.industry) where.industry = filters.industry;
    if (filters.country) where.country = filters.country;
    if (filters.exchange) where.exchange = filters.exchange;
    if (filters.shariahCompliant !== undefined) {
      where.isShariahCompliant = filters.shariahCompliant;
    }

    // Query stocks
    let stocks = await prisma.stockCache.findMany({
      where,
      take: limit * 2, // Get more than needed for post-processing filters
      orderBy: sortBy === "symbol" ? { symbol: sortOrder } : { [sortBy]: sortOrder },
    });

    // Post-process filters that require calculations
    if (filters.near52WeekHigh) {
      stocks = stocks.filter((stock) => {
        if (!stock.currentPrice || !stock.week52High) return false;
        const percentFromHigh = ((stock.week52High - stock.currentPrice) / stock.week52High) * 100;
        return percentFromHigh <= 10;
      });
    }

    if (filters.near52WeekLow) {
      stocks = stocks.filter((stock) => {
        if (!stock.currentPrice || !stock.week52Low) return false;
        const percentFromLow = ((stock.currentPrice - stock.week52Low) / stock.week52Low) * 100;
        return percentFromLow <= 10;
      });
    }

    // Limit results
    stocks = stocks.slice(0, limit);

    // Format results
    const results = stocks.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      industry: stock.industry,
      country: stock.country,
      currentPrice: stock.currentPrice,
      change: stock.currentPrice && stock.previousClose
        ? stock.currentPrice - stock.previousClose
        : null,
      changePercent: stock.currentPrice && stock.previousClose
        ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
        : null,
      marketCap: stock.marketCap,
      peRatio: stock.peRatio,
      pbRatio: stock.pbRatio,
      psRatio: stock.psRatio,
      dividendYield: stock.dividendYield,
      revenueGrowth: stock.revenueGrowth,
      earningsGrowth: stock.earningsGrowth,
      profitMargin: stock.profitMargin,
      roe: stock.roe,
      roa: stock.roa,
      debtToEquity: stock.debtToEquity,
      currentRatio: stock.currentRatio,
      beta: stock.beta,
      week52High: stock.week52High,
      week52Low: stock.week52Low,
      volume: stock.volume,
      avgVolume: stock.avgVolume,
      isShariahCompliant: stock.isShariahCompliant,
    }));

    // Get unique values for filter options
    const allStocks = await prisma.stockCache.findMany({
      select: {
        sector: true,
        industry: true,
        country: true,
        exchange: true,
      },
    });

    const uniqueSectors = [...new Set(allStocks.map((s) => s.sector).filter(Boolean))];
    const uniqueIndustries = [...new Set(allStocks.map((s) => s.industry).filter(Boolean))];
    const uniqueCountries = [...new Set(allStocks.map((s) => s.country).filter(Boolean))];
    const uniqueExchanges = [...new Set(allStocks.map((s) => s.exchange).filter(Boolean))];

    return NextResponse.json({
      results,
      totalCount: results.length,
      filterOptions: {
        sectors: uniqueSectors.sort(),
        industries: uniqueIndustries.sort(),
        countries: uniqueCountries.sort(),
        exchanges: uniqueExchanges.sort(),
      },
    });
  } catch (error) {
    console.error("Error running screener:", error);
    return NextResponse.json(
      { error: "Failed to run screener" },
      { status: 500 }
    );
  }
}
