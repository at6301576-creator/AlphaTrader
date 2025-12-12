/*
  Warnings:

  - Added the required column `updatedAt` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT,
    "alertType" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" REAL,
    "percentValue" REAL,
    "message" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" DATETIME,
    "lastChecked" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "repeatAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("alertType", "companyName", "condition", "createdAt", "id", "isActive", "message", "symbol", "threshold", "triggeredAt", "userId") SELECT "alertType", "companyName", "condition", "createdAt", "id", "isActive", "message", "symbol", "threshold", "triggeredAt", "userId" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");
CREATE INDEX "Alert_symbol_idx" ON "Alert"("symbol");
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
