import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/api/stock-data";
import * as finnhub from "@/lib/api/finnhub";

/**
 * Cache Warming Cron Job
 * Runs every 5 minutes to keep popular stocks cached in Redis
 * This makes scanner results instant for all users!
 */

// Top 100 most popular stocks for scanning
const POPULAR_STOCKS = [
  // FAANG + Tech Giants
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'NFLX',
  // Financial
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BRK.B', 'V', 'MA', 'AXP',
  // Healthcare
  'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'MRK', 'LLY', 'AMGN', 'GILD',
  // Consumer
  'WMT', 'HD', 'NKE', 'MCD', 'SBUX', 'TGT', 'COST', 'LOW', 'DIS', 'CMCSA',
  // Industrial
  'BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'LMT', 'RTX', 'DE', 'UNP',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
  // Crypto/Blockchain
  'COIN', 'MARA', 'RIOT', 'CLSK', 'MSTR', 'SQ', 'PYPL', 'HOOD',
  // EV & Clean Energy
  'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'F', 'GM', 'ENPH', 'SEDG',
  // Growth Stocks
  'SHOP', 'SNOW', 'DDOG', 'NET', 'CRWD', 'ZS', 'OKTA', 'PLTR', 'RBLX', 'U',
  // Semiconductors
  'TSM', 'ASML', 'QCOM', 'AVGO', 'MU', 'AMAT', 'LRCX', 'KLAC', 'MRVL',
  // Emerging
  'SOFI', 'UPST', 'AFRM', 'OPEN', 'PTON', 'BYND', 'SPCE'
];

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔥 [Cache Warmer] Starting cache warming job...');
    const startTime = Date.now();

    // Fetch quotes for popular stocks - this will populate Redis cache
    await getQuotes(POPULAR_STOCKS);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Cache Warmer] Cache warmed with ${POPULAR_STOCKS.length} stocks in ${duration}s`);

    return NextResponse.json({
      success: true,
      stocksWarmed: POPULAR_STOCKS.length,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cache Warmer] Error:', error);
    return NextResponse.json(
      { error: 'Cache warming failed' },
      { status: 500 }
    );
  }
}
