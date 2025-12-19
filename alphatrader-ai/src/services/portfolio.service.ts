/**
 * Portfolio Service Layer
 * Abstracts database operations and business logic from API routes
 */

import { prisma } from "@/lib/db";
import { getQuote } from "@/lib/api/yahoo-finance";
import { Prisma } from "@prisma/client";

export interface CreatePortfolioInput {
  userId: string;
  symbol: string;
  shares: number;
  avgCost: number;
  purchaseDate?: Date | null;
}

export interface UpdatePortfolioInput {
  shares?: number;
  avgCost?: number;
}

export interface AddSharesInput {
  addShares: number;
  addAvgCost: number;
}

export interface SoldPortfolioInput {
  soldPrice: number;
  soldDate: Date;
  soldShares?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  previousClose: number;
  value: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector?: string;
}

class PortfolioService {
  /**
   * Get all portfolio holdings for a user
   */
  async getPortfolio(userId: string): Promise<PortfolioSummary> {
    // Fetch holdings from database
    const holdings = await prisma.portfolio.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        shares: true,
        avgCost: true,
        companyName: true,
      },
    });

    if (holdings.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
      };
    }

    // Fetch current prices for all symbols (batched)
    const symbols = holdings.map((h) => h.symbol);
    const quotes = await this.fetchQuotesBatch(symbols);

    // Calculate holdings with current data
    const enrichedHoldings: PortfolioHolding[] = holdings.map((holding) => {
      const quote = quotes.get(holding.symbol);
      const currentPrice = quote?.regularMarketPrice || 0;
      const previousClose = quote?.regularMarketPreviousClose || currentPrice;

      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      const dayChange = holding.shares * (currentPrice - previousClose);
      const dayChangePercent =
        previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

      return {
        id: holding.id,
        symbol: holding.symbol,
        name: holding.companyName || holding.symbol,
        shares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        previousClose,
        value,
        costBasis,
        gain,
        gainPercent,
        dayChange,
        dayChangePercent,
        sector: quote?.sector,
      };
    });

    // Calculate portfolio totals
    const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChange = enrichedHoldings.reduce((sum, h) => sum + h.dayChange, 0);
    const dayChangePercent =
      totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      holdings: enrichedHoldings,
    };
  }

  /**
   * Create a new portfolio holding
   */
  async createHolding(input: CreatePortfolioInput): Promise<void> {
    // Fetch company name from API
    const quote = await getQuote(input.symbol);
    const companyName = quote?.longName || quote?.shortName || input.symbol;

    await prisma.portfolio.create({
      data: {
        userId: input.userId,
        symbol: input.symbol,
        companyName,
        shares: input.shares,
        avgCost: input.avgCost,
        purchaseDate: input.purchaseDate,
      },
    });
  }

  /**
   * Update an existing holding
   */
  async updateHolding(
    holdingId: string,
    userId: string,
    input: UpdatePortfolioInput
  ): Promise<void> {
    await prisma.portfolio.update({
      where: { id: holdingId, userId },
      data: input,
    });
  }

  /**
   * Add more shares to an existing holding (calculates new average cost)
   */
  async addShares(
    holdingId: string,
    userId: string,
    input: AddSharesInput
  ): Promise<void> {
    const holding = await prisma.portfolio.findUnique({
      where: { id: holdingId, userId },
      select: { shares: true, avgCost: true },
    });

    if (!holding) {
      throw new Error("Holding not found");
    }

    const totalShares = holding.shares + input.addShares;
    const totalCost = holding.shares * holding.avgCost + input.addShares * input.addAvgCost;
    const newAvgCost = totalCost / totalShares;

    await prisma.portfolio.update({
      where: { id: holdingId, userId },
      data: {
        shares: totalShares,
        avgCost: newAvgCost,
      },
    });
  }

  /**
   * Mark shares as sold (creates transaction record and updates holding)
   */
  async sellShares(
    holdingId: string,
    userId: string,
    input: SoldPortfolioInput
  ): Promise<void> {
    const holding = await prisma.portfolio.findUnique({
      where: { id: holdingId, userId },
      select: {
        symbol: true,
        companyName: true,
        shares: true,
        avgCost: true,
      },
    });

    if (!holding) {
      throw new Error("Holding not found");
    }

    const soldShares = input.soldShares || holding.shares;

    if (soldShares > holding.shares) {
      throw new Error("Cannot sell more shares than owned");
    }

    // Update or delete holding
    if (soldShares >= holding.shares) {
      // Sold all shares - mark as sold in portfolio record
      await prisma.portfolio.update({
        where: { id: holdingId, userId },
        data: {
          soldPrice: input.soldPrice,
          soldDate: input.soldDate,
        },
      });
    } else {
      // Sold partial - update holding
      await prisma.portfolio.update({
        where: { id: holdingId, userId },
        data: {
          shares: holding.shares - soldShares,
        },
      });
    }
  }

  /**
   * Delete a portfolio holding
   */
  async deleteHolding(holdingId: string, userId: string): Promise<void> {
    await prisma.portfolio.delete({
      where: { id: holdingId, userId },
    });
  }

  /**
   * Batch fetch quotes for multiple symbols
   * Optimized to reduce API calls
   */
  private async fetchQuotesBatch(symbols: string[]): Promise<Map<string, any>> {
    const quotes = new Map();

    // Fetch quotes in batches of 10 to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (symbol) => {
          try {
            const quote = await getQuote(symbol);
            if (quote) {
              quotes.set(symbol, quote);
            }
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            // Set fallback data
            quotes.set(symbol, {
              regularMarketPrice: 0,
              regularMarketPreviousClose: 0,
            });
          }
        })
      );

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return quotes;
  }
}

// Singleton instance
export const portfolioService = new PortfolioService();
