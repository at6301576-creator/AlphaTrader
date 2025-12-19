/**
 * Validation Schemas using Zod
 * Centralized validation for API requests
 */

import { z } from "zod";

// Portfolio schemas
export const createPortfolioSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or less")
    .regex(/^[A-Z]+$/, "Symbol must contain only uppercase letters"),
  shares: z.number().positive("Shares must be positive"),
  avgCost: z.number().positive("Average cost must be positive"),
  purchaseDate: z.string().datetime().optional().nullable(),
});

export const updatePortfolioSchema = z.object({
  shares: z.number().positive("Shares must be positive").optional(),
  avgCost: z.number().positive("Average cost must be positive").optional(),
  addShares: z.number().positive("Additional shares must be positive").optional(),
  addAvgCost: z.number().positive("Additional average cost must be positive").optional(),
});

export const soldPortfolioSchema = z.object({
  soldPrice: z.number().positive("Sold price must be positive"),
  soldDate: z.string().datetime(),
  soldShares: z.number().positive("Sold shares must be positive").optional(),
});

// Technical alert schemas
export const technicalAlertIndicatorTypes = [
  "sma",
  "ema",
  "rsi",
  "macd",
  "bollinger",
  "stochastic",
  "atr",
  "adx",
  "cci",
  "williams",
  "psar",
] as const;

export const technicalAlertSchema = z
  .object({
    symbol: z
      .string()
      .min(1, "Symbol is required")
      .max(10, "Symbol must be 10 characters or less")
      .regex(/^[A-Z]+$/, "Symbol must contain only uppercase letters"),
    indicatorType: z.enum(technicalAlertIndicatorTypes, {
      message: "Invalid indicator type",
    }),
    condition: z.enum(["above", "below", "crosses_above", "crosses_below"], {
      message: "Invalid condition",
    }),
    targetValue: z.number(),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().default({}),
    notificationEmail: z.string().email("Invalid email address").optional(),
  })
  .refine(
    (data) => {
      // Validate RSI-specific parameters
      if (data.indicatorType === "rsi") {
        const period = data.parameters?.period;
        if (!period || typeof period !== 'number' || period < 2 || period > 100) {
          return false;
        }
      }
      return true;
    },
    {
      message: "RSI requires a period between 2 and 100",
      path: ["parameters", "period"],
    }
  )
  .refine(
    (data) => {
      // Validate SMA/EMA-specific parameters
      if (data.indicatorType === "sma" || data.indicatorType === "ema") {
        const period = data.parameters?.period;
        if (!period || typeof period !== 'number' || period < 2 || period > 200) {
          return false;
        }
      }
      return true;
    },
    {
      message: "SMA/EMA requires a period between 2 and 200",
      path: ["parameters", "period"],
    }
  )
  .refine(
    (data) => {
      // Validate MACD-specific parameters
      if (data.indicatorType === "macd") {
        const { fastPeriod, slowPeriod, signalPeriod } = data.parameters || {};
        if (
          !fastPeriod ||
          !slowPeriod ||
          !signalPeriod ||
          typeof fastPeriod !== 'number' ||
          typeof slowPeriod !== 'number' ||
          fastPeriod >= slowPeriod
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "MACD requires fastPeriod, slowPeriod, and signalPeriod (fastPeriod < slowPeriod)",
      path: ["parameters"],
    }
  );

// Scanner schemas
export const scannerFiltersSchema = z.object({
  scanType: z.enum([
    "undervalued",
    "momentum",
    "dividend",
    "growth",
    "value",
    "quality",
    "turnaround",
    "breakout",
    "penny_stocks",
  ]),
  markets: z.array(z.string()).min(1, "At least one market is required"),
  sectors: z.array(z.string()).default([]),
  shariahCompliantOnly: z.boolean().default(false),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minMarketCap: z.number().positive().optional(),
  maxMarketCap: z.number().positive().optional(),
  minPERatio: z.number().optional(),
  maxPERatio: z.number().positive().optional(),
  maxPBRatio: z.number().positive().optional(),
  minDividendYield: z.number().min(0).optional(),
  maxDividendYield: z.number().positive().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

// Search schema
export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
  limit: z.number().int().positive().max(50).default(10),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * Validate request body against a schema
 * Throws ValidationError if validation fails
 */
export async function validateRequest<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          message: "Validation failed",
          issues: error.issues,
        })
      );
    }
    throw error;
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string | number | boolean> = Object.fromEntries(searchParams.entries());

  // Convert numeric strings to numbers
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (typeof value === 'string' && !isNaN(Number(value))) {
      params[key] = Number(value);
    }
    // Convert "true"/"false" strings to booleans
    if (value === "true") params[key] = true;
    if (value === "false") params[key] = false;
  });

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        JSON.stringify({
          message: "Invalid query parameters",
          issues: error.issues,
        })
      );
    }
    throw error;
  }
}
