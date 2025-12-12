-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "riskProfile" TEXT NOT NULL DEFAULT 'moderate',
    "tradingExp" TEXT NOT NULL DEFAULT 'beginner',
    "shariahMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT,
    "shares" REAL NOT NULL,
    "avgCost" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "purchaseDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "symbols" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT,
    "alertType" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" REAL,
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "markets" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "topResults" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "exchange" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentPrice" REAL,
    "previousClose" REAL,
    "open" REAL,
    "dayHigh" REAL,
    "dayLow" REAL,
    "volume" REAL,
    "avgVolume" REAL,
    "marketCap" REAL,
    "peRatio" REAL,
    "forwardPE" REAL,
    "pbRatio" REAL,
    "psRatio" REAL,
    "pegRatio" REAL,
    "dividendYield" REAL,
    "dividendRate" REAL,
    "payoutRatio" REAL,
    "beta" REAL,
    "week52High" REAL,
    "week52Low" REAL,
    "eps" REAL,
    "revenueGrowth" REAL,
    "earningsGrowth" REAL,
    "profitMargin" REAL,
    "operatingMargin" REAL,
    "roe" REAL,
    "roa" REAL,
    "debtToEquity" REAL,
    "currentRatio" REAL,
    "quickRatio" REAL,
    "freeCashFlow" REAL,
    "isShariahCompliant" BOOLEAN,
    "shariahDetails" TEXT,
    "technicalData" TEXT,
    "fundamentalData" TEXT,
    "chartData" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "sentiment" TEXT,
    "sentimentScore" REAL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Portfolio_symbol_idx" ON "Portfolio"("symbol");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_symbol_idx" ON "Alert"("symbol");

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- CreateIndex
CREATE INDEX "ScanHistory_userId_idx" ON "ScanHistory"("userId");

-- CreateIndex
CREATE INDEX "ScanHistory_createdAt_idx" ON "ScanHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockCache_symbol_key" ON "StockCache"("symbol");

-- CreateIndex
CREATE INDEX "StockCache_symbol_idx" ON "StockCache"("symbol");

-- CreateIndex
CREATE INDEX "StockCache_exchange_idx" ON "StockCache"("exchange");

-- CreateIndex
CREATE INDEX "StockCache_sector_idx" ON "StockCache"("sector");

-- CreateIndex
CREATE INDEX "StockCache_isShariahCompliant_idx" ON "StockCache"("isShariahCompliant");

-- CreateIndex
CREATE INDEX "NewsCache_symbol_idx" ON "NewsCache"("symbol");

-- CreateIndex
CREATE INDEX "NewsCache_publishedAt_idx" ON "NewsCache"("publishedAt");
