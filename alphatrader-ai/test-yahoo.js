// Quick test of Yahoo Finance API
const { YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

async function testYahoo() {
  try {
    console.log('Testing Yahoo Finance API...\n');

    // Test 1: Single quote
    console.log('1. Fetching quote for AAPL...');
    const quote = await yahooFinance.quote('AAPL');
    console.log('✅ Success! Price:', quote.regularMarketPrice);
    console.log('   Name:', quote.longName);
    console.log('   Market Cap:', quote.marketCap);
    console.log('   P/E Ratio:', quote.trailingPE);

    // Test 2: Multiple quotes
    console.log('\n2. Fetching multiple quotes...');
    const symbols = ['MSFT', 'GOOGL', 'AMZN'];
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return await yahooFinance.quote(symbol);
        } catch (err) {
          console.log(`   ❌ Failed to fetch ${symbol}:`, err.message);
          return null;
        }
      })
    );

    const successfulQuotes = quotes.filter(q => q !== null);
    console.log(`✅ Fetched ${successfulQuotes.length}/${symbols.length} quotes successfully`);

    successfulQuotes.forEach(q => {
      console.log(`   - ${q.symbol}: $${q.regularMarketPrice}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testYahoo();
