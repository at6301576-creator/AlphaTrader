# AlphaTrader AI - Implementation Plan

## Configuration Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| **Authentication** | User accounts with login (single-user for dev) |
| **Data APIs** | Free tier: Alpha Vantage + Yahoo Finance + Finnhub |
| **Hosting** | Local dev first, then Vercel deployment |
| **AI Provider** | Both OpenAI + Ollama (local LLM option) |
| **Real-time** | Polling for dev, WebSocket for production |

---

## Implementation Plan

### Phase 1: Foundation (Building Now)

1. **Project Setup**
   - Next.js 14 with App Router + TypeScript
   - Tailwind CSS + shadcn/ui components
   - ESLint + Prettier configuration

2. **Database Setup**
   - SQLite for local dev (easy setup, no Docker needed)
   - Prisma ORM with full schema
   - Seed data for testing

3. **Authentication**
   - NextAuth.js with credentials provider
   - Demo user for development
   - Session management

4. **Core API Integrations**
   - Yahoo Finance (via yahoo-finance2) - primary for quotes
   - Alpha Vantage - fundamentals + technicals
   - Finnhub - news + sentiment

5. **Market Scanner**
   - Scan controls UI
   - Multiple scan types (undervalued, momentum, dividend, growth)
   - Market selection (US, UK, global)
   - Shariah filter option
   - Results display with stock cards

6. **Stock Analysis Page**
   - Price chart with TradingView Lightweight Charts
   - Basic technical indicators (MA, RSI, MACD)
   - Fundamental data display
   - Shariah compliance status
   - News section

7. **Portfolio & Watchlist**
   - Add/remove positions
   - Track cost basis and P&L
   - Multiple watchlists
   - Quick add from scanner/analysis

8. **Basic AI Integration**
   - OpenAI integration for stock analysis
   - Ollama integration as fallback
   - AI-powered stock summaries

### Phase 2: Enhanced Features (Next)
- Advanced technical indicators
- Full Shariah screening engine
- Price alerts system
- Enhanced portfolio analytics
- News sentiment analysis

### Phase 3: Production Ready
- WebSocket real-time data
- Cloud deployment (Vercel + PostgreSQL)
- Push notifications
- Mobile responsive optimization

---

## File Structure

```
alphatrader-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # Dashboard
│   │   │   ├── scanner/page.tsx         # Market Scanner
│   │   │   ├── stock/[symbol]/page.tsx  # Stock Analysis
│   │   │   ├── portfolio/page.tsx       # Portfolio
│   │   │   ├── watchlist/page.tsx       # Watchlists
│   │   │   └── settings/page.tsx        # Settings
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── stocks/route.ts
│   │   │   ├── scanner/route.ts
│   │   │   ├── portfolio/route.ts
│   │   │   ├── watchlist/route.ts
│   │   │   └── ai/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Landing/redirect
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── scanner/
│   │   │   ├── ScannerControls.tsx
│   │   │   ├── ScanResults.tsx
│   │   │   ├── StockCard.tsx
│   │   │   └── MarketSelector.tsx
│   │   ├── stock/
│   │   │   ├── StockHeader.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── TechnicalIndicators.tsx
│   │   │   ├── FundamentalData.tsx
│   │   │   ├── ShariahStatus.tsx
│   │   │   ├── NewsSection.tsx
│   │   │   └── AIAnalysis.tsx
│   │   ├── portfolio/
│   │   │   ├── Holdings.tsx
│   │   │   ├── AddPositionDialog.tsx
│   │   │   └── PortfolioSummary.tsx
│   │   ├── watchlist/
│   │   │   ├── WatchlistCard.tsx
│   │   │   └── AddToWatchlistDialog.tsx
│   │   └── ai/
│   │       └── AIAssistant.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── yahoo-finance.ts
│   │   │   ├── alpha-vantage.ts
│   │   │   ├── finnhub.ts
│   │   │   └── openai.ts
│   │   ├── db.ts                        # Prisma client
│   │   ├── auth.ts                      # NextAuth config
│   │   └── utils.ts                     # Utilities
│   │
│   ├── services/
│   │   ├── market-scanner.ts
│   │   ├── stock-analyzer.ts
│   │   ├── technical-indicators.ts
│   │   ├── shariah-screener.ts
│   │   ├── portfolio-manager.ts
│   │   └── ai-service.ts
│   │
│   ├── stores/
│   │   ├── scanner-store.ts
│   │   ├── portfolio-store.ts
│   │   └── settings-store.ts
│   │
│   ├── types/
│   │   ├── stock.ts
│   │   ├── portfolio.ts
│   │   ├── scanner.ts
│   │   └── user.ts
│   │
│   └── hooks/
│       ├── use-stock.ts
│       ├── use-scanner.ts
│       └── use-portfolio.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   └── icons/
│
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## Database Schema

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  password        String
  riskProfile     String?   @default("moderate")
  tradingExp      String?   @default("beginner")
  shariahMode     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  portfolios      Portfolio[]
  watchlists      Watchlist[]
  alerts          Alert[]
  scanHistory     ScanHistory[]
}

model Portfolio {
  id              String    @id @default(cuid())
  userId          String
  symbol          String
  shares          Float
  avgCost         Float
  purchaseDate    DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])
}

model Watchlist {
  id              String    @id @default(cuid())
  userId          String
  name            String
  symbols         String    // JSON array of symbols
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])
}

model Alert {
  id              String    @id @default(cuid())
  userId          String
  symbol          String
  alertType       String    // price, indicator, news
  condition       String    // above, below, crosses
  threshold       Float?
  isActive        Boolean   @default(true)
  triggeredAt     DateTime?
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])
}

model ScanHistory {
  id              String    @id @default(cuid())
  userId          String
  scanType        String
  markets         String
  parameters      String    // JSON
  resultsCount    Int
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])
}

model StockCache {
  id              String    @id @default(cuid())
  symbol          String    @unique
  name            String?
  exchange        String?
  sector          String?
  industry        String?
  currentPrice    Float?
  marketCap       Float?
  peRatio         Float?
  pbRatio         Float?
  dividendYield   Float?
  beta            Float?
  week52High      Float?
  week52Low       Float?
  isShariahCompliant Boolean?
  shariahDetails  String?   // JSON
  technicalData   String?   // JSON
  fundamentalData String?   // JSON
  lastUpdated     DateTime  @default(now())
}
```

---

## API Keys Required

Create `.env.local` with:
```
# Database
DATABASE_URL="file:./dev.db"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# APIs (Free tiers)
ALPHA_VANTAGE_API_KEY="your-key"
FINNHUB_API_KEY="your-key"

# AI (Optional - for AI features)
OPENAI_API_KEY="your-key"
OLLAMA_BASE_URL="http://localhost:11434"
```

---

## Ready to Build!

This plan is now finalized. Starting implementation of Phase 1.
