const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== CHECKING ALL WATCHLISTS ===\n');

    const watchlists = await prisma.watchlist.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (watchlists.length === 0) {
      console.log('No watchlists found in database.');
    } else {
      watchlists.forEach((wl, idx) => {
        console.log(`--- Watchlist ${idx + 1} ---`);
        console.log(`ID: ${wl.id}`);
        console.log(`Name: ${wl.name}`);
        console.log(`Description: ${wl.description || '(none)'}`);
        console.log(`Symbols: ${JSON.stringify(wl.symbols)}`);
        console.log(`Created: ${wl.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
