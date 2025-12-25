const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const watchlists = await prisma.watchlist.findMany();
    console.log('=== ALL WATCHLISTS ===');
    watchlists.forEach((wl, idx) => {
      console.log(`\n--- Watchlist ${idx + 1} ---`);
      console.log(`ID: ${wl.id}`);
      console.log(`Name: ${wl.name}`);
      console.log(`Symbols: ${wl.symbols}`);
      console.log(`Created: ${wl.createdAt}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
