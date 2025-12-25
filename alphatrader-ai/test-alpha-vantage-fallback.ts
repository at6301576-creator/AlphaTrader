/**
 * Test Alpha Vantage fallback when Yahoo Finance fails
 */

import dotenv from "dotenv";
dotenv.config();

import { fetchDailyTimeSeries } from "./src/lib/api/alpha-vantage";

async function testAlphaVantageDirect() {
  console.log("🧪 Testing Alpha Vantage API directly...\n");

  const testSymbol = "AAPL";

  console.log(`📊 Fetching daily data for ${testSymbol} from Alpha Vantage`);
  console.log("─".repeat(60));

  try {
    const startTime = Date.now();
    const data = await fetchDailyTimeSeries(testSymbol);
    const endTime = Date.now();

    if (data.length > 0) {
      console.log(`✅ SUCCESS: Fetched ${data.length} data points`);
      console.log(`⏱️  Time: ${endTime - startTime}ms`);
      console.log(`📅 Date range: ${new Date((data[0].time as number) * 1000).toLocaleDateString()} to ${new Date((data[data.length - 1].time as number) * 1000).toLocaleDateString()}`);
      console.log(`💰 Latest close: $${data[data.length - 1].close.toFixed(2)}`);
      console.log(`💰 Latest open: $${data[data.length - 1].open.toFixed(2)}`);
      console.log(`📊 Latest volume: ${data[data.length - 1].volume.toLocaleString()}`);
    } else {
      console.log(`❌ FAILED: No data returned from Alpha Vantage`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Alpha Vantage direct test completed!");
  console.log("\n⚠️  Note: Alpha Vantage free tier has rate limits:");
  console.log("   - 500 requests per day");
  console.log("   - 5 requests per minute (12 second delay between requests)");
}

testAlphaVantageDirect().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
