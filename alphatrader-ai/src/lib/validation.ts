/**
 * Zod validation schemas for API endpoints
 * Provides type-safe input validation and sanitization
 */

import { z } from "zod";

// ============= Authentication =============

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ============= Portfolio =============

export const addPortfolioSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9.-]+$/, "Invalid symbol format")
    .transform((val) => val.toUpperCase()),
  shares: z
    .number()
    .positive("Shares must be positive")
    .max(1000000000, "Shares value too large"),
  avgCost: z
    .number()
    .positive("Average cost must be positive")
    .max(1000000, "Price too high"),
  purchaseDate: z.string().datetime().optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updatePortfolioSchema = z.object({
  shares: z.number().positive("Shares must be positive").optional(),
  avgCost: z.number().positive("Average cost must be positive").optional(),
  soldDate: z.string().datetime().optional().nullable(),
  soldPrice: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ============= Alerts =============

export const createAlertSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9.-]+$/, "Invalid symbol format")
    .transform((val) => val.toUpperCase()),
  companyName: z.string().max(200).optional().nullable(),
  alertType: z.enum([
    "price_above",
    "price_below",
    "percent_change",
    "rsi_oversold",
    "rsi_overbought",
    "macd_cross",
    "volume_spike",
    "news",
  ]),
  condition: z.enum([
    "above",
    "below",
    "crosses_above",
    "crosses_below",
    "equals",
    "percent_up",
    "percent_down",
  ]),
  threshold: z.number().min(0).max(1000000).optional().nullable(),
  percentValue: z.number().min(-100).max(1000).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  notifyEmail: z.boolean().default(false),
  notifyInApp: z.boolean().default(true),
  repeatAlert: z.boolean().default(false),
});

export const updateAlertSchema = z.object({
  threshold: z.number().min(0).max(1000000).optional(),
  percentValue: z.number().min(-100).max(1000).optional(),
  message: z.string().max(500).optional().nullable(),
  notifyEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
  isActive: z.boolean().optional(),
  repeatAlert: z.boolean().optional(),
});

// ============= Technical Alerts =============

export const createTechnicalAlertSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9.-]+$/, "Invalid symbol format")
    .transform((val) => val.toUpperCase()),
  companyName: z.string().max(200).optional().nullable(),
  indicatorType: z.enum([
    "rsi",
    "macd",
    "stochastic",
    "ma_crossover",
    "bollinger_bands",
  ]),
  condition: z.enum([
    "overbought",
    "oversold",
    "bullish_crossover",
    "bearish_crossover",
    "crosses_above",
    "crosses_below",
  ]),
  parameters: z.string().max(500), // JSON string
  threshold: z.number().min(0).max(100).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  notifyEmail: z.boolean().default(false),
  notifyPush: z.boolean().default(true),
  notifyInApp: z.boolean().default(true),
  repeatAlert: z.boolean().default(false),
  cooldownMinutes: z.number().int().min(0).max(1440).default(60),
});

// ============= Watchlist =============

export const createWatchlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).optional().nullable(),
  symbols: z
    .array(
      z
        .string()
        .min(1)
        .max(10)
        .regex(/^[A-Z0-9.-]+$/)
    )
    .max(100, "Too many symbols"),
});

export const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  symbols: z
    .array(
      z
        .string()
        .min(1)
        .max(10)
        .regex(/^[A-Z0-9.-]+$/)
    )
    .max(100)
    .optional(),
});

export const addSymbolToWatchlistSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9.-]+$/, "Invalid symbol format")
    .transform((val) => val.toUpperCase()),
});

// ============= Screener =============

export const screenerFiltersSchema = z.object({
  // Price & Market Cap
  minPrice: z.number().min(0).max(1000000).optional().nullable(),
  maxPrice: z.number().min(0).max(1000000).optional().nullable(),
  minMarketCap: z.number().min(0).optional().nullable(),
  maxMarketCap: z.number().min(0).optional().nullable(),

  // Valuation
  minPE: z.number().min(-1000).max(10000).optional().nullable(),
  maxPE: z.number().min(-1000).max(10000).optional().nullable(),
  minPB: z.number().min(0).max(1000).optional().nullable(),
  maxPB: z.number().min(0).max(1000).optional().nullable(),
  minPS: z.number().min(0).max(1000).optional().nullable(),
  maxPS: z.number().min(0).max(1000).optional().nullable(),

  // Dividends
  minDividendYield: z.number().min(0).max(100).optional().nullable(),
  maxDividendYield: z.number().min(0).max(100).optional().nullable(),

  // Growth
  minRevenueGrowth: z.number().min(-100).max(10000).optional().nullable(),
  minEarningsGrowth: z.number().min(-100).max(10000).optional().nullable(),

  // Profitability
  minProfitMargin: z.number().min(-100).max(100).optional().nullable(),
  minROE: z.number().min(-100).max(1000).optional().nullable(),
  minROA: z.number().min(-100).max(100).optional().nullable(),

  // Financial Health
  maxDebtToEquity: z.number().min(0).max(1000).optional().nullable(),
  minCurrentRatio: z.number().min(0).max(100).optional().nullable(),

  // Technical
  minBeta: z.number().min(0).max(10).optional().nullable(),
  maxBeta: z.number().min(0).max(10).optional().nullable(),
  near52WeekHigh: z.boolean().optional(),
  near52WeekLow: z.boolean().optional(),

  // Filters
  sector: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  exchange: z.string().max(100).optional().nullable(),
  shariahCompliant: z.boolean().optional().nullable(),
});

export const screenerRequestSchema = z.object({
  filters: screenerFiltersSchema,
  limit: z.number().int().min(1).max(500).default(100),
  sortBy: z
    .enum([
      "symbol",
      "marketCap",
      "currentPrice",
      "peRatio",
      "dividendYield",
      "volume",
    ])
    .default("marketCap"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============= Scanner =============

export const scannerFiltersSchema = z.object({
  scanType: z.enum([
    "undervalued",
    "momentum",
    "dividend",
    "growth",
    "shariah",
  ]),
  markets: z.array(z.enum(["SP500", "NASDAQ", "UK", "DE"])).min(1),
  minScore: z.number().min(0).max(100).optional().default(60),
});

// ============= User Settings =============

export const updateUserSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
  tradingExp: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  shariahMode: z.boolean().optional(),
});

// ============= AI =============

export const aiChatSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  context: z.string().max(5000).optional(),
});

export const aiStockAnalysisSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9.-]+$/, "Invalid symbol format")
    .transform((val) => val.toUpperCase()),
});

// ============= Helper Functions =============

/**
 * Validate request body against a schema
 * Returns validated data or throws with user-friendly error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(firstError.message);
    }
    throw new Error("Invalid request data");
  }
}

/**
 * Validate request body and return result object
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: "Invalid request data" };
  }
}
