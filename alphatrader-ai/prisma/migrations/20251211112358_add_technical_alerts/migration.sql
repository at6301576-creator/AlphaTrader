-- CreateTable
CREATE TABLE "TechnicalAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT,
    "indicatorType" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "threshold" REAL,
    "lastValue" REAL,
    "message" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" DATETIME,
    "lastChecked" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "repeatAlert" BOOLEAN NOT NULL DEFAULT false,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TechnicalAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TechnicalAlert_userId_idx" ON "TechnicalAlert"("userId");

-- CreateIndex
CREATE INDEX "TechnicalAlert_symbol_idx" ON "TechnicalAlert"("symbol");

-- CreateIndex
CREATE INDEX "TechnicalAlert_isActive_idx" ON "TechnicalAlert"("isActive");

-- CreateIndex
CREATE INDEX "TechnicalAlert_indicatorType_idx" ON "TechnicalAlert"("indicatorType");

-- CreateIndex
CREATE INDEX "TechnicalAlert_lastChecked_idx" ON "TechnicalAlert"("lastChecked");
