import { BaseService } from "./base.service";
import { getQuotes, type QuoteResult } from "@/lib/api/yahoo-finance";
import { ApiError, ErrorCode } from "@/lib/api-response";

export interface WatchlistSymbol {
  symbol: string;
  note?: string;
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  note?: string;
}

export interface WatchlistResponse {
  id: string;
  name: string;
  description: string | null;
  stocks: WatchlistStock[];
}

export interface CreateWatchlistInput {
  name: string;
  description?: string;
}

export interface UpdateWatchlistInput {
  name?: string;
  description?: string;
}

export class WatchlistService extends BaseService {
  /**
   * Get all watchlists for a user with stock data
   */
  async getWatchlists(userId: string): Promise<WatchlistResponse[]> {
    const watchlists = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      "Failed to fetch watchlists"
    );

    // Collect all unique symbols across all watchlists
    const allSymbols = new Set<string>();
    watchlists.forEach((wl) => {
      const symbolsData = this.parseJsonField<WatchlistSymbol[]>(
        wl.symbols,
        [],
        "symbols"
      );
      symbolsData.forEach((item) => {
        const symbol = typeof item === "string" ? item : item.symbol;
        allSymbols.add(symbol);
      });
    });

    // Fetch quotes for all symbols
    const quotes =
      allSymbols.size > 0
        ? await this.handleExternalApiCall(
            () => getQuotes(Array.from(allSymbols)),
            "Failed to fetch stock quotes"
          )
        : [];

    const quoteMap = new Map<string, QuoteResult>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    // Build response with stock data
    return watchlists.map((wl) => {
      const symbolsData = this.parseJsonField<(string | WatchlistSymbol)[]>(
        wl.symbols,
        [],
        "symbols"
      );

      const stocks: WatchlistStock[] = symbolsData.map((item) => {
        const symbol = typeof item === "string" ? item : item.symbol;
        const note = typeof item === "string" ? undefined : item.note;
        const quote = quoteMap.get(symbol);

        return {
          symbol,
          name: quote?.longName || quote?.shortName || symbol,
          currentPrice: quote?.regularMarketPrice || 0,
          change: quote?.regularMarketChange || 0,
          changePercent: quote?.regularMarketChangePercent || 0,
          volume: quote?.regularMarketVolume || 0,
          marketCap: quote?.marketCap || 0,
          note,
        };
      });

      return {
        id: wl.id,
        name: wl.name,
        description: wl.description,
        stocks,
      };
    });
  }

  /**
   * Get a single watchlist by ID
   */
  async getWatchlist(
    userId: string,
    watchlistId: string
  ): Promise<WatchlistResponse> {
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    // Fetch stock data
    const symbolsData = this.parseJsonField<(string | WatchlistSymbol)[]>(
      watchlist.symbols,
      [],
      "symbols"
    );

    const symbols = symbolsData.map((item) =>
      typeof item === "string" ? item : item.symbol
    );

    const quotes =
      symbols.length > 0
        ? await this.handleExternalApiCall(
            () => getQuotes(symbols),
            "Failed to fetch stock quotes"
          )
        : [];

    const quoteMap = new Map<string, QuoteResult>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    const stocks: WatchlistStock[] = symbolsData.map((item) => {
      const symbol = typeof item === "string" ? item : item.symbol;
      const note = typeof item === "string" ? undefined : item.note;
      const quote = quoteMap.get(symbol);

      return {
        symbol,
        name: quote?.longName || quote?.shortName || symbol,
        currentPrice: quote?.regularMarketPrice || 0,
        change: quote?.regularMarketChange || 0,
        changePercent: quote?.regularMarketChangePercent || 0,
        volume: quote?.regularMarketVolume || 0,
        marketCap: quote?.marketCap || 0,
        note,
      };
    });

    return {
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description,
      stocks,
    };
  }

  /**
   * Create a new watchlist
   */
  async createWatchlist(
    userId: string,
    data: CreateWatchlistInput
  ): Promise<{ id: string; name: string; description: string | null }> {
    this.validateRequired(data.name, "name");

    if (data.name.trim().length < 1) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Watchlist name cannot be empty",
        422
      );
    }

    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.create({
          data: {
            userId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            symbols: "[]",
          },
        }),
      "Failed to create watchlist"
    );

    return {
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description,
    };
  }

  /**
   * Update a watchlist
   */
  async updateWatchlist(
    userId: string,
    watchlistId: string,
    updates: UpdateWatchlistInput
  ): Promise<void> {
    // Verify ownership
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    // Validate name if provided
    if (updates.name !== undefined) {
      this.validateRequired(updates.name, "name");
      if (updates.name.trim().length < 1) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Watchlist name cannot be empty",
          422
        );
      }
    }

    await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.update({
          where: { id: watchlistId },
          data: {
            ...(updates.name !== undefined && { name: updates.name.trim() }),
            ...(updates.description !== undefined && {
              description: updates.description.trim() || null,
            }),
          },
        }),
      "Failed to update watchlist"
    );
  }

  /**
   * Delete a watchlist
   */
  async deleteWatchlist(userId: string, watchlistId: string): Promise<void> {
    // Verify ownership
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.delete({
          where: { id: watchlistId },
        }),
      "Failed to delete watchlist"
    );
  }

  /**
   * Add symbols to a watchlist
   */
  async addSymbols(
    userId: string,
    watchlistId: string,
    symbolsToAdd: string[]
  ): Promise<void> {
    // Verify ownership
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    // Parse current symbols
    const currentSymbols = this.parseJsonField<(string | WatchlistSymbol)[]>(
      watchlist.symbols,
      [],
      "symbols"
    );

    // Get current symbol strings
    const currentSymbolStrings = currentSymbols.map((item) =>
      typeof item === "string" ? item.toUpperCase() : item.symbol.toUpperCase()
    );

    // Add new symbols (avoid duplicates)
    const newSymbols = symbolsToAdd
      .map((s) => s.toUpperCase())
      .filter((s) => !currentSymbolStrings.includes(s))
      .map((s) => ({ symbol: s }));

    const updatedSymbols = [...currentSymbols, ...newSymbols];

    await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.update({
          where: { id: watchlistId },
          data: {
            symbols: this.prepareJsonField(updatedSymbols),
          },
        }),
      "Failed to add symbols to watchlist"
    );
  }

  /**
   * Remove a symbol from a watchlist
   */
  async removeSymbol(
    userId: string,
    watchlistId: string,
    symbolToRemove: string
  ): Promise<void> {
    // Verify ownership
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    // Parse current symbols
    const currentSymbols = this.parseJsonField<(string | WatchlistSymbol)[]>(
      watchlist.symbols,
      [],
      "symbols"
    );

    // Remove the symbol
    const symbolUpperCase = symbolToRemove.toUpperCase();
    const updatedSymbols = currentSymbols.filter((item) => {
      const symbol = typeof item === "string" ? item : item.symbol;
      return symbol.toUpperCase() !== symbolUpperCase;
    });

    await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.update({
          where: { id: watchlistId },
          data: {
            symbols: this.prepareJsonField(updatedSymbols),
          },
        }),
      "Failed to remove symbol from watchlist"
    );
  }

  /**
   * Update note for a symbol in a watchlist
   */
  async updateSymbolNote(
    userId: string,
    watchlistId: string,
    symbol: string,
    note: string
  ): Promise<void> {
    // Verify ownership
    const watchlist = await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.findUnique({
          where: { id: watchlistId },
        }),
      "Failed to fetch watchlist"
    );

    this.assertExists(watchlist, "Watchlist not found");
    this.assertOwnership(watchlist.userId, userId);

    // Parse current symbols
    const currentSymbols = this.parseJsonField<(string | WatchlistSymbol)[]>(
      watchlist.symbols,
      [],
      "symbols"
    );

    // Update the symbol's note
    const symbolUpperCase = symbol.toUpperCase();
    const updatedSymbols = currentSymbols.map((item) => {
      const itemSymbol = typeof item === "string" ? item : item.symbol;
      if (itemSymbol.toUpperCase() === symbolUpperCase) {
        return { symbol: itemSymbol, note: note.trim() || undefined };
      }
      return item;
    });

    await this.handleDatabaseOperation(
      () =>
        this.prisma.watchlist.update({
          where: { id: watchlistId },
          data: {
            symbols: this.prepareJsonField(updatedSymbols),
          },
        }),
      "Failed to update symbol note"
    );
  }
}

// Export singleton instance
export const watchlistService = new WatchlistService();
