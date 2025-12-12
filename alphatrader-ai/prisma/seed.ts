import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@alphatrader.ai" },
    update: {},
    create: {
      email: "demo@alphatrader.ai",
      name: "Demo User",
      password: hashedPassword,
      riskProfile: "moderate",
      tradingExp: "intermediate",
      shariahMode: false,
    },
  });

  console.log("Created demo user:", demoUser.email);

  // Create default watchlist
  const defaultWatchlist = await prisma.watchlist.upsert({
    where: { id: "default-watchlist" },
    update: {},
    create: {
      id: "default-watchlist",
      userId: demoUser.id,
      name: "My Watchlist",
      description: "Default watchlist for tracking stocks",
      symbols: JSON.stringify(["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]),
    },
  });

  console.log("Created default watchlist:", defaultWatchlist.name);

  // Create some sample portfolio positions
  const samplePositions = [
    { symbol: "AAPL", companyName: "Apple Inc.", shares: 10, avgCost: 175.50 },
    { symbol: "MSFT", companyName: "Microsoft Corporation", shares: 5, avgCost: 380.25 },
    { symbol: "GOOGL", companyName: "Alphabet Inc.", shares: 3, avgCost: 140.00 },
  ];

  for (const position of samplePositions) {
    await prisma.portfolio.upsert({
      where: { id: `${demoUser.id}-${position.symbol}` },
      update: {},
      create: {
        id: `${demoUser.id}-${position.symbol}`,
        userId: demoUser.id,
        symbol: position.symbol,
        companyName: position.companyName,
        shares: position.shares,
        avgCost: position.avgCost,
        currency: "USD",
        purchaseDate: new Date("2024-01-15"),
      },
    });
  }

  console.log("Created sample portfolio positions");

  // Cache some popular stock data
  const popularStocks = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Software",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Internet Services",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      exchange: "NASDAQ",
      sector: "Consumer Cyclical",
      industry: "E-Commerce",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      exchange: "NASDAQ",
      sector: "Consumer Cyclical",
      industry: "Auto Manufacturers",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Semiconductors",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Internet Services",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      exchange: "NYSE",
      sector: "Financial Services",
      industry: "Banking",
      country: "US",
      currency: "USD",
      isShariahCompliant: false,
    },
    {
      symbol: "V",
      name: "Visa Inc.",
      exchange: "NYSE",
      sector: "Financial Services",
      industry: "Payment Processing",
      country: "US",
      currency: "USD",
    },
    {
      symbol: "JNJ",
      name: "Johnson & Johnson",
      exchange: "NYSE",
      sector: "Healthcare",
      industry: "Pharmaceuticals",
      country: "US",
      currency: "USD",
    },
  ];

  for (const stock of popularStocks) {
    await prisma.stockCache.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: stock,
    });
  }

  console.log("Cached popular stocks");

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
