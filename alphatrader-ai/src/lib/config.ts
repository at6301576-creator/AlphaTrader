/**
 * Application Configuration
 * Centralized configuration management with type safety
 */

import { z } from "zod";

const configSchema = z.object({
  // App
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  appUrl: z.string().url().default("http://localhost:3000"),

  // Database
  databaseUrl: z.string().min(1),
  databasePoolSize: z.number().int().positive().default(20),
  databasePoolTimeout: z.number().int().positive().default(5000),

  // API Keys
  finnhubApiKey: z.string().min(1),
  yahooFinanceEnabled: z.boolean().default(true),

  // Cache
  stockCacheTtlMs: z.number().int().positive().default(300000), // 5 minutes
  quoteCacheTtlMs: z.number().int().positive().default(60000), // 1 minute
  newsCacheTtlMs: z.number().int().positive().default(1800000), // 30 minutes

  // Rate Limiting
  rateLimitEnabled: z.boolean().default(true),
  rateLimitWindowMs: z.number().int().positive().default(60000), // 1 minute
  rateLimitMaxRequests: z.number().int().positive().default(60),

  // Redis (optional)
  redisUrl: z.string().url().optional(),
  redisEnabled: z.boolean().default(false),

  // Logging
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  logPrismaQueries: z.boolean().default(false),

  // Feature Flags
  enableAiFeatures: z.boolean().default(true),
  enableTechnicalAlerts: z.boolean().default(true),
  enablePortfolioAnalytics: z.boolean().default(true),

  // Performance
  enableRequestDeduplication: z.boolean().default(true),
  enableResponseCompression: z.boolean().default(true),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const rawConfig = {
    // App
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,

    // Database
    databaseUrl: process.env.DATABASE_URL,
    databasePoolSize: process.env.DATABASE_POOL_SIZE
      ? parseInt(process.env.DATABASE_POOL_SIZE)
      : undefined,
    databasePoolTimeout: process.env.DATABASE_POOL_TIMEOUT
      ? parseInt(process.env.DATABASE_POOL_TIMEOUT)
      : undefined,

    // API Keys
    finnhubApiKey:
      process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY,
    yahooFinanceEnabled: process.env.YAHOO_FINANCE_ENABLED !== "false",

    // Cache
    stockCacheTtlMs: process.env.STOCK_CACHE_TTL_MS
      ? parseInt(process.env.STOCK_CACHE_TTL_MS)
      : undefined,
    quoteCacheTtlMs: process.env.QUOTE_CACHE_TTL_MS
      ? parseInt(process.env.QUOTE_CACHE_TTL_MS)
      : undefined,
    newsCacheTtlMs: process.env.NEWS_CACHE_TTL_MS
      ? parseInt(process.env.NEWS_CACHE_TTL_MS)
      : undefined,

    // Rate Limiting
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
      : undefined,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS
      ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
      : undefined,

    // Redis
    redisUrl: process.env.REDIS_URL,
    redisEnabled: !!process.env.REDIS_URL,

    // Logging
    logLevel: process.env.LOG_LEVEL,
    logPrismaQueries: process.env.LOG_PRISMA_QUERIES === "true",

    // Feature Flags
    enableAiFeatures: process.env.ENABLE_AI_FEATURES !== "false",
    enableTechnicalAlerts: process.env.ENABLE_TECHNICAL_ALERTS !== "false",
    enablePortfolioAnalytics: process.env.ENABLE_PORTFOLIO_ANALYTICS !== "false",

    // Performance
    enableRequestDeduplication:
      process.env.ENABLE_REQUEST_DEDUPLICATION !== "false",
    enableResponseCompression:
      process.env.ENABLE_RESPONSE_COMPRESSION !== "false",
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Configuration validation failed:");
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid configuration");
    }
    throw error;
  }
}

// Load and export configuration
export const config = loadConfig();

// Helper functions
export function isDevelopment(): boolean {
  return config.nodeEnv === "development";
}

export function isProduction(): boolean {
  return config.nodeEnv === "production";
}

export function isTest(): boolean {
  return config.nodeEnv === "test";
}

// Export for environment-specific behavior
export const IS_DEV = isDevelopment();
export const IS_PROD = isProduction();
export const IS_TEST = isTest();
