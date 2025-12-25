// Test if the API returns fresh data
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('\n=== Testing Watchlist API ===\n');

    // You'll need to replace this with your actual Vercel URL
    const baseURL = 'https://alphatrader-ai.vercel.app'; // Replace with your actual URL

    console.log('Making request to:', `${baseURL}/api/watchlist`);
    console.log('Note: This will fail without authentication. Check the browser instead.\n');

    const response = await fetch(`${baseURL}/api/watchlist`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());

    const data = await response.text();
    console.log('\nResponse:', data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
