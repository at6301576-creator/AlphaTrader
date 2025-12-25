/**
 * Test script for Alpha Vantage fallback mechanism
 */

import dotenv from "dotenv";
import { fetchChartDataForTechnicalAnalysis } from "./src/lib/api/technical-data";

// Load environment variables
dotenv.config();

async function testAlphaVantageFallback() {
  console.log("🧪 Testing Alpha Vantage fallback mechanism...\n");

  const testSymbols = [
    { symbol: "AAPL", description: "Valid symbol (should use Yahoo Finance)" },
    { symbol: "MSFT", description: "Valid symbol (should use Yahoo Finance)" },
    { symbol: "TSLA", description: "Valid symbol (should use Yahoo Finance)" },
  ];

  for (const { symbol, description } of testSymbols) {
    console.log(`\n📊 Testing ${symbol} - ${description}`);
    console.log("─".repeat(60));

    try {
      const startTime = Date.now();
      const data = await fetchChartDataForTechnicalAnalysis(symbol);
      const endTime = Date.now();

      if (data.length > 0) {
        console.log(`✅ SUCCESS: Fetched ${data.length} data points`);
        console.log(`⏱️  Time: ${endTime - startTime}ms`);
        console.log(`📅 Date range: ${new Date((data[0].time as number) * 1000).toLocaleDateString()} to ${new Date((data[data.length - 1].time as number) * 1000).toLocaleDateString()}`);
        console.log(`💰 Latest close: $${data[data.length - 1].close.toFixed(2)}`);
      } else {
        console.log(`❌ FAILED: No data returned`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Test completed!");
}

testAlphaVantageFallback().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
