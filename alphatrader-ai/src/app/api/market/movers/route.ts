import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuote } from '@/lib/api/finnhub';

// All available popular US stocks
const ALL_POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
  'JPM', 'V', 'WMT', 'JNJ', 'PG', 'MA', 'HD', 'CVX', 'LLY', 'ABBV',
  'MRK', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'NFLX', 'ADBE',
  'CSCO', 'ACN', 'TXN', 'AMD', 'INTC', 'QCOM', 'HON', 'UPS', 'SBUX'
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate parameters
    if (offset < 0 || limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Invalid offset or limit. Limit must be between 1-20.' },
        { status: 400 }
      );
    }

    // Get the requested batch of symbols
    const symbols = ALL_POPULAR_SYMBOLS.slice(offset, offset + limit);

    if (symbols.length === 0) {
      return NextResponse.json({
        stocks: [],
        hasMore: false,
        total: ALL_POPULAR_SYMBOLS.length,
        offset,
        limit
      });
    }

    console.log(`📊 Fetching ${symbols.length} stock quotes (offset: ${offset})...`);

    // Fetch quotes for all symbols
    const stockPromises = symbols.map(async (symbol) => {
      try {
        const quote = await getQuote(symbol);
        return {
          symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          high: quote.h,
          low: quote.l,
          open: quote.o,
          previousClose: quote.pc,
        };
      } catch (error) {
        console.error(`❌ Error fetching ${symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(stockPromises);
    const stocks = results.filter((stock) => stock !== null);

    console.log(`✅ Successfully fetched ${stocks.length}/${symbols.length} stocks`);

    return NextResponse.json({
      stocks,
      hasMore: offset + limit < ALL_POPULAR_SYMBOLS.length,
      total: ALL_POPULAR_SYMBOLS.length,
      offset,
      limit
    });
  } catch (error) {
    console.error('Error in market movers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market movers' },
      { status: 500 }
    );
  }
}
