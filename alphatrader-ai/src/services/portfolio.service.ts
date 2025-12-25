import { BaseService } from "./base.service";
import { getQuotes, type QuoteResult } from "@/lib/api/yahoo-finance";
import { ApiError, ErrorCode } from "@/lib/api-response";

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
  sector: string;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  positionsCount: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
  sectorAllocations: SectorAllocation[];
}

export interface AddHoldingInput {
  symbol: string;
  shares: number;
  avgCost: number;
  purchaseDate?: string;
  companyName?: string;
}

export class PortfolioService extends BaseService {
  /**
   * Get complete portfolio summary for a user
   */
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    // Fetch portfolio holdings
    const portfolioItems = await this.handleDatabaseOperation(
      () =>
        this.prisma.portfolio.findMany({
          where: { userId },
          orderBy: { symbol: "asc" },
          select: {
            id: true,
            symbol: true,
            companyName: true,
            shares: true,
            avgCost: true,
            purchaseDate: true,
            soldDate: true,
          },
        }),
      "Failed to fetch portfolio holdings"
    );

    // Return empty portfolio if no holdings
    if (!portfolioItems || (Array.isArray(portfolioItems) && portfolioItems.length === 0)) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
        sectorAllocations: [],
      };
    }

    // Fetch current market data
    const symbols = (portfolioItems as any[]).map((h) => h.symbol);
    const quotes = await this.handleExternalApiCall(
      () => getQuotes(symbols),
      "Failed to fetch current market prices"
    );

    // Create quote lookup map
    const quoteMap = new Map<string, QuoteResult>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    // Fetch sector information
    const stockCacheData = await this.handleDatabaseOperation(
      () =>
        this.prisma.stockCache.findMany({
          where: { symbol: { in: symbols } },
          select: { symbol: true, sector: true },
        }),
      "Failed to fetch sector information"
    );

    const sectorMap = new Map<string, string | null>();
    (stockCacheData as any[]).forEach((s) => sectorMap.set(s.symbol, s.sector));

    // Calculate portfolio metrics
    return this.calculatePortfolioMetrics(portfolioItems as any[], quoteMap, sectorMap);
  }

  /**
   * Add a new holding or update existing holding
   */
  async addHolding(userId: string, input: AddHoldingInput): Promise<void> {
    this.validatePositive(input.shares, "shares");
    this.validatePositive(input.avgCost, "avgCost");

    const symbolUpper = input.symbol.toUpperCase();

    // Check if holding already exists
    const existing = await this.handleDatabaseOperation(
      () =>
        this.prisma.portfolio.findFirst({
          where: { userId, symbol: symbolUpper },
        }),
      "Failed to check existing holding"
    );

    if (existing) {
      // Update existing holding - average the cost
      const existingTyped = existing as any;
      const totalShares = existingTyped.shares + input.shares;
      const totalCostBasis =
        existingTyped.shares * existingTyped.avgCost + input.shares * input.avgCost;
      const newAvgCost = totalCostBasis / totalShares;

      await this.handleDatabaseOperation(
        () =>
          this.prisma.portfolio.update({
            where: { id: existingTyped.id },
            data: {
              shares: totalShares,
              avgCost: newAvgCost,
            },
          }),
        "Failed to update existing holding"
      );
    } else {
      // Create new holding
      await this.handleDatabaseOperation(
        () =>
          this.prisma.portfolio.create({
            data: {
              userId,
              symbol: symbolUpper,
              companyName: input.companyName,
              shares: input.shares,
              avgCost: input.avgCost,
              purchaseDate: input.purchaseDate
                ? new Date(input.purchaseDate)
                : null,
            },
          }),
        "Failed to create new holding"
      );
    }
  }

  /**
   * Update an existing holding
   */
  async updateHolding(
    userId: string,
    holdingId: string,
    updates: Partial<AddHoldingInput>
  ): Promise<void> {
    // Verify ownership
    const holding = await this.handleDatabaseOperation(
      () => this.prisma.portfolio.findUnique({ where: { id: holdingId } }),
      "Failed to fetch holding"
    ) as any;

    this.assertExists(holding, "Holding not found");
    this.assertOwnership(holding?.userId, userId);

    // Validate updates
    if (updates.shares !== undefined) {
      this.validatePositive(updates.shares, "shares");
    }
    if (updates.avgCost !== undefined) {
      this.validatePositive(updates.avgCost, "avgCost");
    }

    // Apply updates
    await this.handleDatabaseOperation(
      () =>
        this.prisma.portfolio.update({
          where: { id: holdingId },
          data: {
            ...(updates.shares !== undefined && { shares: updates.shares }),
            ...(updates.avgCost !== undefined && { avgCost: updates.avgCost }),
            ...(updates.companyName !== undefined && {
              companyName: updates.companyName,
            }),
            ...(updates.purchaseDate !== undefined && {
              purchaseDate: new Date(updates.purchaseDate),
            }),
          },
        }),
      "Failed to update holding"
    );
  }

  /**
   * Delete a holding
   */
  async deleteHolding(userId: string, holdingId: string): Promise<void> {
    // Verify ownership
    const holding = await this.handleDatabaseOperation(
      () => this.prisma.portfolio.findUnique({ where: { id: holdingId } }),
      "Failed to fetch holding"
    ) as any;

    this.assertExists(holding, "Holding not found");
    this.assertOwnership(holding?.userId, userId);

    // Delete holding
    await this.handleDatabaseOperation(
      () => this.prisma.portfolio.delete({ where: { id: holdingId } }),
      "Failed to delete holding"
    );
  }

  /**
   * Get a single holding by ID
   */
  async getHolding(userId: string, holdingId: string) {
    const holding = await this.handleDatabaseOperation(
      () => this.prisma.portfolio.findUnique({ where: { id: holdingId } }),
      "Failed to fetch holding"
    );

    this.assertExists(holding, "Holding not found");
    this.assertOwnership(holding.userId, userId);

    return holding;
  }

  /**
   * Calculate portfolio metrics from raw data
   */
  private calculatePortfolioMetrics(
    portfolioItems: Array<{
      id: string;
      symbol: string;
      companyName: string | null;
      shares: number;
      avgCost: number;
      purchaseDate: Date | null;
      soldDate: Date | null;
    }>,
    quoteMap: Map<string, QuoteResult>,
    sectorMap: Map<string, string | null>
  ): PortfolioSummary {
    let totalValue = 0;
    let totalCost = 0;
    let totalDayChange = 0;
    const sectorAllocations = new Map<
      string,
      { value: number; count: number }
    >();

    const holdings: PortfolioHolding[] = portfolioItems.map((holding) => {
      const quote = quoteMap.get(holding.symbol);
      const currentPrice = quote?.regularMarketPrice || holding.avgCost;
      const previousClose = quote?.regularMarketPreviousClose || currentPrice;

      const value = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avgCost;
      const gain = value - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
      const dayChange = holding.shares * (currentPrice - previousClose);
      const dayChangePercent =
        previousClose > 0
          ? ((currentPrice - previousClose) / previousClose) * 100
          : 0;

      totalValue += value;
      totalCost += costBasis;
      totalDayChange += dayChange;

      // Track sector allocation
      const sector = sectorMap.get(holding.symbol) || "Unknown";
      const current = sectorAllocations.get(sector) || { value: 0, count: 0 };
      sectorAllocations.set(sector, {
        value: current.value + value,
        count: current.count + 1,
      });

      return {
        id: holding.id,
        symbol: holding.symbol,
        name:
          quote?.longName ||
          quote?.shortName ||
          holding.companyName ||
          holding.symbol,
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
        sector,
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChangePercent =
      totalValue - totalDayChange > 0
        ? (totalDayChange / (totalValue - totalDayChange)) * 100
        : 0;

    // Calculate sector allocation percentages
    const sectors = Array.from(sectorAllocations.entries()).map(
      ([sector, data]) => ({
        sector,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        positionsCount: data.count,
      })
    );

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange: totalDayChange,
      dayChangePercent,
      holdings,
      sectorAllocations: sectors,
    };
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();
