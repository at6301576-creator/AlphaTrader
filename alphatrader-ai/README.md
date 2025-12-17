# AlphaTrader AI

> AI-powered stock market analysis and portfolio management platform

[![CI](https://github.com/yourusername/alphatrader-ai/workflows/CI/badge.svg)](https://github.com/yourusername/alphatrader-ai/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 📊 **Market Scanner** - Discover undervalued stocks across multiple strategies
  - Momentum, Value, Growth, Dividend, Quality scanning
  - Penny stocks and crypto mining sectors
  - Shariah-compliant filtering

- 📈 **Stock Analysis** - Comprehensive stock analysis with:
  - Real-time price data
  - 13+ technical indicators (RSI, MACD, Bollinger Bands, ATR, ADX, CCI, etc.)
  - Fundamental metrics (P/E, P/B, ROE, debt ratios)
  - Interactive price charts with TradingView-style indicators

- ☪️ **Shariah Screening** - Full Islamic finance compliance checking:
  - Business activity screening
  - Financial ratios (debt, interest, receivables)
  - Purification calculations

- 💼 **Portfolio Management** - Track your investments:
  - Multiple positions with cost basis tracking
  - Real-time P&L calculations
  - Advanced analytics (Sharpe ratio, volatility, best/worst days)
  - Benchmark comparison (S&P 500, NASDAQ)
  - Portfolio optimization suggestions

- 🔔 **Technical Alerts** - Smart price and indicator-based alerts:
  - Price alerts (above/below thresholds)
  - RSI overbought/oversold alerts
  - MACD crossover signals
  - Moving average crossovers
  - Volume spike detection
  - Email and in-app notifications

- 👁️ **Watchlists** - Create and manage custom watchlists with sparklines

- 🤖 **AI Assistant** - AI-powered stock analysis and recommendations
  - Powered by OpenAI GPT
  - Portfolio insights and optimization
  - Stock-specific analysis

- 💎 **Subscription Tiers** - Feature gating with three tiers:
  - **Starter** ($0/month): Basic features, 5 alerts/month
  - **Professional** ($29/month): Advanced analytics, unlimited alerts
  - **Enterprise** ($99/month): API access, priority support

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Data Sources**: Yahoo Finance, Finnhub, Alpha Vantage
- **AI**: OpenAI API, Ollama
- **Testing**: Vitest, Testing Library
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- (Optional) Ollama for local AI

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/alphatrader-ai.git
cd alphatrader-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` with your API keys:

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth (generate a secret: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# APIs (get free keys from these services)
ALPHA_VANTAGE_API_KEY="your-key"
FINNHUB_API_KEY="your-key"
OPENAI_API_KEY="your-key" # Optional
```

**Get your free API keys:**
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- Finnhub: https://finnhub.io/dashboard
- OpenAI: https://platform.openai.com/api-keys

### 4. Set up the database

```bash
# Run migrations
npm run db:push

# Seed with demo data (optional)
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create your first user

Navigate to `/register` and create an account.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
alphatrader-ai/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── scanner/       # Market scanner
│   │   │   ├── stock/[symbol] # Stock analysis
│   │   │   ├── portfolio/     # Portfolio management
│   │   │   ├── watchlist/     # Watchlists
│   │   │   └── assistant/     # AI assistant
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   ├── scanner/           # Scanner components
│   │   ├── analysis/          # Analysis components
│   │   └── ErrorBoundary.tsx  # Error boundary
│   ├── lib/                   # Utilities and configs
│   │   ├── api/               # External API integrations
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Database client
│   │   └── logger.ts          # Logging utility
│   ├── services/              # Business logic
│   │   ├── market-scanner.ts  # Scanner service
│   │   └── shariah-screener.ts# Shariah screening
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Rate limiting & security
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   ├── schema-postgres.prisma # Production schema (PostgreSQL)
│   └── seed.ts                # Database seeding
├── public/                    # Static assets
└── tests/                     # Test files
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/alphatrader-ai)

## Production Readiness Checklist

- [x] TypeScript compilation with zero errors
- [x] Security headers and middleware
- [x] Rate limiting on API routes
- [x] Error boundaries and logging
- [x] Environment configuration
- [x] Database migration strategy
- [x] SEO optimization
- [x] Test coverage for core features
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker support
- [x] Production deployment guide

## Security

- All API routes are rate-limited (60 requests/minute per IP)
- Security headers (CSP, X-Frame-Options, etc.)
- NextAuth.js for secure authentication
- Environment variables for sensitive data
- Input validation with Zod

## API Rate Limits

- **Finnhub**: 60 calls/minute (free tier)
- **Alpha Vantage**: 25 calls/day (free tier)
- **Yahoo Finance**: No official limit, but rate-limited internally

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Yahoo Finance](https://finance.yahoo.com/)
- [Finnhub](https://finnhub.io/)
- [Alpha Vantage](https://www.alphavantage.co/)

## Support

- Documentation: [docs](./docs)
- Issues: [GitHub Issues](https://github.com/yourusername/alphatrader-ai/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/alphatrader-ai/discussions)

## Disclaimer

**This software is for educational and informational purposes only. It is not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.**

---

Made with ❤️ by the AlphaTrader AI team
