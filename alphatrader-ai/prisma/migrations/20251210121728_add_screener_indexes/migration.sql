-- CreateIndex
CREATE INDEX "StockCache_marketCap_idx" ON "StockCache"("marketCap");

-- CreateIndex
CREATE INDEX "StockCache_peRatio_idx" ON "StockCache"("peRatio");

-- CreateIndex
CREATE INDEX "StockCache_dividendYield_idx" ON "StockCache"("dividendYield");

-- CreateIndex
CREATE INDEX "StockCache_lastUpdated_idx" ON "StockCache"("lastUpdated");
