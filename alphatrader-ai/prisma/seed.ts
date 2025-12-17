import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data for clean seed
  console.log("🗑️  Clearing existing data...");
  await prisma.portfolioSnapshot.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.technicalAlert.deleteMany();
  await prisma.scanHistory.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.newsCache.deleteMany();
  await prisma.screenerPreset.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  console.log("👤 Creating demo user...");
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const demoUser = await prisma.user.create({
    data: {
      id: "demo-user-001",
      email: "demo@alphatrader.ai",
      name: "Demo User",
      password: hashedPassword,
      riskProfile: "moderate",
      tradingExp: "intermediate",
      shariahMode: false,
    },
  });

  console.log("✅ Created demo user:", demoUser.email);

  // Create watchlists
  console.log("👁️  Creating watchlists...");
  await prisma.watchlist.createMany({
    data: [
      {
        userId: demoUser.id,
        name: "Tech Giants",
        description: "FAANG and mega-cap tech stocks",
        symbols: JSON.stringify(["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA"]),
      },
      {
        userId: demoUser.id,
        name: "High Growth",
        description: "High growth potential stocks",
        symbols: JSON.stringify(["TSLA", "NVDA", "AMD", "SHOP", "SQ", "ROKU"]),
      },
      {
        userId: demoUser.id,
        name: "Dividend Stocks",
        description: "Reliable dividend payers",
        symbols: JSON.stringify(["KO", "PG", "JNJ", "T", "VZ", "PFE"]),
      },
    ],
  });
  console.log("✅ Created 3 watchlists");

  // Create portfolio positions with realistic data
  console.log("💼 Creating portfolio holdings...");
  const portfolioData = [
    {
      symbol: "AAPL",
      companyName: "Apple Inc.",
      shares: 50,
      avgCost: 150.25,
      purchaseDate: new Date("2024-01-15"),
    },
    {
      symbol: "MSFT",
      companyName: "Microsoft Corporation",
      shares: 30,
      avgCost: 320.50,
      purchaseDate: new Date("2024-02-10"),
    },
    {
      symbol: "GOOGL",
      companyName: "Alphabet Inc.",
      shares: 25,
      avgCost: 135.75,
      purchaseDate: new Date("2024-03-05"),
    },
    {
      symbol: "NVDA",
      companyName: "NVIDIA Corporation",
      shares: 40,
      avgCost: 450.00,
      purchaseDate: new Date("2024-01-20"),
    },
    {
      symbol: "TSLA",
      companyName: "Tesla Inc.",
      shares: 20,
      avgCost: 245.80,
      purchaseDate: new Date("2024-02-25"),
    },
    {
      symbol: "AMZN",
      companyName: "Amazon.com Inc.",
      shares: 35,
      avgCost: 165.30,
      purchaseDate: new Date("2024-03-15"),
    },
  ];

  for (const holding of portfolioData) {
    await prisma.portfolio.create({
      data: {
        userId: demoUser.id,
        ...holding,
      },
    });
  }
  console.log(`✅ Created ${portfolioData.length} portfolio holdings`);

  // Create portfolio snapshots for performance chart (30 days of data)
  console.log("📊 Creating portfolio snapshots...");
  const today = new Date();
  const snapshots = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate portfolio value growth with some volatility
    const baseValue = 50000;
    const growth = (30 - i) * 500; // ~$500/day growth trend
    const volatility = Math.sin(i * 0.5) * 1000; // Random-ish volatility
    const totalValue = baseValue + growth + volatility;
    const totalCost = 48500;
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPerc = (totalGainLoss / totalCost) * 100;

    snapshots.push({
      userId: demoUser.id,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalCost,
      totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
      totalGainLossPerc: parseFloat(totalGainLossPerc.toFixed(2)),
      dayChange: parseFloat((Math.random() * 1000 - 500).toFixed(2)),
      dayChangePerc: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      holdings: JSON.stringify([
        { symbol: "AAPL", value: totalValue * 0.25, gainLoss: 5.2 },
        { symbol: "MSFT", value: totalValue * 0.20, gainLoss: 3.8 },
        { symbol: "GOOGL", value: totalValue * 0.15, gainLoss: 2.1 },
        { symbol: "NVDA", value: totalValue * 0.18, gainLoss: 8.5 },
        { symbol: "TSLA", value: totalValue * 0.12, gainLoss: -1.2 },
        { symbol: "AMZN", value: totalValue * 0.10, gainLoss: 4.3 },
      ]),
      sectorAllocation: JSON.stringify({
        Technology: 65,
        "Consumer Cyclical": 20,
        "Communication Services": 15,
      }),
      assetAllocation: JSON.stringify({
        "Large Cap": 80,
        "Mid Cap": 15,
        "Small Cap": 5,
      }),
      topPerformers: JSON.stringify([
        { symbol: "NVDA", gainLossPerc: 8.5 },
        { symbol: "AAPL", gainLossPerc: 5.2 },
        { symbol: "AMZN", gainLossPerc: 4.3 },
      ]),
      topLosers: JSON.stringify([{ symbol: "TSLA", gainLossPerc: -1.2 }]),
      createdAt: date,
    });
  }

  await prisma.portfolioSnapshot.createMany({ data: snapshots });
  console.log(`✅ Created ${snapshots.length} portfolio snapshots`);

  // Create alerts
  console.log("🔔 Creating alerts...");
  await prisma.alert.createMany({
    data: [
      {
        userId: demoUser.id,
        symbol: "AAPL",
        companyName: "Apple Inc.",
        alertType: "price_above",
        condition: "above",
        threshold: 200.0,
        message: "AAPL reached $200",
        notifyEmail: true,
        notifyInApp: true,
        isActive: true,
      },
      {
        userId: demoUser.id,
        symbol: "TSLA",
        companyName: "Tesla Inc.",
        alertType: "price_below",
        condition: "below",
        threshold: 200.0,
        message: "TSLA dropped below $200",
        notifyEmail: false,
        notifyInApp: true,
        isActive: true,
      },
      {
        userId: demoUser.id,
        symbol: "NVDA",
        companyName: "NVIDIA Corporation",
        alertType: "percent_change",
        condition: "percent_up",
        percentValue: 5.0,
        message: "NVDA up 5% today",
        notifyEmail: true,
        notifyInApp: true,
        isActive: true,
      },
    ],
  });
  console.log("✅ Created 3 alerts");

  // Create technical alerts
  console.log("📈 Creating technical alerts...");
  await prisma.technicalAlert.createMany({
    data: [
      {
        userId: demoUser.id,
        symbol: "AAPL",
        companyName: "Apple Inc.",
        indicatorType: "rsi",
        condition: "oversold",
        parameters: JSON.stringify({ period: 14, oversoldLevel: 30 }),
        threshold: 30,
        message: "AAPL RSI oversold",
        notifyEmail: false,
        notifyPush: true,
        notifyInApp: true,
        isActive: true,
      },
      {
        userId: demoUser.id,
        symbol: "MSFT",
        companyName: "Microsoft Corporation",
        indicatorType: "macd",
        condition: "bullish_crossover",
        parameters: JSON.stringify({
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        }),
        message: "MSFT MACD bullish crossover",
        notifyEmail: true,
        notifyPush: true,
        notifyInApp: true,
        isActive: true,
      },
    ],
  });
  console.log("✅ Created 2 technical alerts");

  // Create news cache
  console.log("📰 Creating news cache...");
  const newsDate = new Date();
  await prisma.newsCache.createMany({
    data: [
      {
        symbol: "AAPL",
        title: "Apple Announces New iPhone 16 with Revolutionary AI Features",
        summary:
          "Apple unveils its latest flagship with groundbreaking AI capabilities.",
        source: "Reuters",
        url: "https://example.com/news/1",
        sentiment: "positive",
        sentimentScore: 0.85,
        publishedAt: new Date(newsDate.getTime() - 3600000 * 2),
      },
      {
        symbol: "MSFT",
        title: "Microsoft Cloud Revenue Exceeds Expectations",
        summary: "Azure and cloud services drive strong quarterly performance.",
        source: "Bloomberg",
        url: "https://example.com/news/2",
        sentiment: "positive",
        sentimentScore: 0.78,
        publishedAt: new Date(newsDate.getTime() - 3600000 * 5),
      },
      {
        symbol: "TSLA",
        title: "Tesla Faces Production Challenges in Q4",
        summary: "Supply chain issues impact vehicle delivery targets.",
        source: "CNBC",
        url: "https://example.com/news/3",
        sentiment: "negative",
        sentimentScore: -0.45,
        publishedAt: new Date(newsDate.getTime() - 3600000 * 8),
      },
    ],
  });
  console.log("✅ Created news cache entries");

  // Create screener presets
  console.log("🔍 Creating screener presets...");
  await prisma.screenerPreset.createMany({
    data: [
      {
        userId: demoUser.id,
        name: "Value Stocks",
        description: "Undervalued stocks with strong fundamentals",
        filters: JSON.stringify({
          peRatio: { max: 20 },
          pbRatio: { max: 3 },
          dividendYield: { min: 2 },
          debtToEquity: { max: 0.5 },
        }),
        isPublic: false,
      },
      {
        userId: demoUser.id,
        name: "High Growth Tech",
        description: "Fast-growing technology companies",
        filters: JSON.stringify({
          sector: "Technology",
          revenueGrowth: { min: 20 },
          marketCap: { min: 10000000000 },
        }),
        isPublic: false,
      },
    ],
  });
  console.log("✅ Created screener presets");

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

  console.log("✅ Cached popular stocks");

  console.log("");
  console.log("🎉 Database seeded successfully!");
  console.log("");
  console.log("Demo Account Credentials:");
  console.log("📧 Email: demo@alphatrader.ai");
  console.log("🔑 Password: demo123");
  console.log("");
  console.log("Summary:");
  console.log(`- 1 user created`);
  console.log(`- ${portfolioData.length} portfolio holdings`);
  console.log(`- ${snapshots.length} portfolio snapshots (30 days of performance data)`);
  console.log(`- 3 watchlists`);
  console.log(`- 3 price alerts`);
  console.log(`- 2 technical alerts`);
  console.log(`- 3 news items`);
  console.log(`- 2 screener presets`);
  console.log(`- ${popularStocks.length} stock cache entries`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
