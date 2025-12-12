-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalValue" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "totalGainLoss" REAL NOT NULL,
    "totalGainLossPerc" REAL NOT NULL,
    "dayChange" REAL,
    "dayChangePerc" REAL,
    "holdings" TEXT NOT NULL,
    "sectorAllocation" TEXT,
    "assetAllocation" TEXT,
    "topPerformers" TEXT,
    "topLosers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScreenerPreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_userId_idx" ON "PortfolioSnapshot"("userId");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_createdAt_idx" ON "PortfolioSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "ScreenerPreset_userId_idx" ON "ScreenerPreset"("userId");

-- CreateIndex
CREATE INDEX "ScreenerPreset_isPublic_idx" ON "ScreenerPreset"("isPublic");
