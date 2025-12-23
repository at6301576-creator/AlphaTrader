/**
 * Centralized configuration for environment variables and application settings
 */

// Parse number from env with default fallback
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Parse boolean from env with default fallback
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

/**
 * Cache configuration
 */
export const cacheConfig = {
  // Stock data cache TTL in milliseconds (default: 5 minutes)
  stockCacheTTL: getEnvNumber("STOCK_CACHE_TTL_MS", 5 * 60 * 1000),

  // Quote cache TTL in milliseconds (default: 5 minutes)
  quoteCacheTTL: getEnvNumber("QUOTE_CACHE_TTL_MS", 5 * 60 * 1000),

  // API response cache TTL in milliseconds (default: 1 minute)
  apiCacheTTL: getEnvNumber("API_CACHE_TTL_MS", 60 * 1000),

  // Portfolio cache TTL in seconds (default: 60 seconds)
  portfolioCacheTTL: getEnvNumber("PORTFOLIO_CACHE_TTL_SEC", 60),

  // Portfolio stale-while-revalidate in seconds (default: 120 seconds)
  portfolioStaleWhileRevalidate: getEnvNumber(
    "PORTFOLIO_SWR_SEC",
    120
  ),

  // Generic cache TTL in milliseconds (default: 5 minutes)
  defaultCacheTTL: getEnvNumber("DEFAULT_CACHE_TTL_MS", 5 * 60 * 1000),

  // Enable/disable caching globally (default: true)
  enabled: getEnvBoolean("CACHE_ENABLED", true),
} as const;

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // Portfolio mutations per minute (default: 20)
  portfolioMutationsLimit: getEnvNumber("RATE_LIMIT_PORTFOLIO_MUTATIONS", 20),

  // Portfolio mutations window in seconds (default: 60)
  portfolioMutationsWindow: getEnvNumber(
    "RATE_LIMIT_PORTFOLIO_WINDOW_SEC",
    60
  ),

  // API requests per minute (default: 100)
  apiRequestsLimit: getEnvNumber("RATE_LIMIT_API_REQUESTS", 100),

  // API requests window in seconds (default: 60)
  apiRequestsWindow: getEnvNumber("RATE_LIMIT_API_WINDOW_SEC", 60),

  // Enable/disable rate limiting (default: true in production)
  enabled: getEnvBoolean(
    "RATE_LIMIT_ENABLED",
    process.env.NODE_ENV === "production"
  ),
} as const;

/**
 * API configuration
 */
export const apiConfig = {
  // Finnhub API key
  finnhubApiKey:
    process.env.FINNHUB_API_KEY ||
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY ||
    "",

  // OpenAI API key
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // Ollama base URL
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",

  // Resend API key for emails
  resendApiKey: process.env.RESEND_API_KEY || "",

  // Email from address
  emailFrom: process.env.EMAIL_FROM || "noreply@alphatrader.ai",

  // VAPID public key for push notifications
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",

  // NextAuth URL
  nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // Cron secret for scheduled jobs
  cronSecret: process.env.CRON_SECRET || "",
} as const;

/**
 * Database configuration
 */
export const databaseConfig = {
  // Database URL
  url: process.env.DATABASE_URL || "",

  // Enable query logging in development
  logQueries: getEnvBoolean(
    "DATABASE_LOG_QUERIES",
    process.env.NODE_ENV === "development"
  ),
} as const;

/**
 * Application configuration
 */
export const appConfig = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || "development",

  // Is production environment
  isProduction: process.env.NODE_ENV === "production",

  // Is development environment
  isDevelopment: process.env.NODE_ENV === "development",

  // Enable debug logging
  debug: getEnvBoolean("DEBUG", process.env.NODE_ENV === "development"),
} as const;

/**
 * Performance configuration
 */
export const performanceConfig = {
  // Enable source maps in production (default: false)
  productionSourceMaps: getEnvBoolean("PRODUCTION_SOURCE_MAPS", false),

  // Enable React strict mode (default: true)
  reactStrictMode: getEnvBoolean("REACT_STRICT_MODE", true),

  // Enable SWC minification (default: true)
  swcMinify: getEnvBoolean("SWC_MINIFY", true),

  // Enable compression (default: true)
  compress: getEnvBoolean("COMPRESS", true),
} as const;

/**
 * Export all configs as a single object
 */
export const config = {
  cache: cacheConfig,
  rateLimit: rateLimitConfig,
  api: apiConfig,
  database: databaseConfig,
  app: appConfig,
  performance: performanceConfig,
} as const;

export default config;
