# AlphaTrader AI - Deployment Guide

Complete guide for deploying AlphaTrader AI to GitHub and Vercel with PostgreSQL database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [GitHub Repository Setup](#github-repository-setup)
4. [Database Setup](#database-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or later installed
- **Git** installed and configured
- **GitHub account** (free tier is fine)
- **Vercel account** (free tier is fine) - Sign up at https://vercel.com
- **API Keys**:
  - Alpha Vantage: https://www.alphavantage.co/support/#api-key (free tier available)
  - Finnhub: https://finnhub.io/register (free tier available)
  - OpenAI (optional): https://platform.openai.com/api-keys

---

## Local Setup

### 1. Verify Build Works Locally

```bash
cd "C:\Projects\AlphaTrader AI\alphatrader-ai"

# Install dependencies
npm install

# Run build to ensure no errors
npm run build

# Start development server to test
npm run dev
```

Visit http://localhost:3000 and verify the app works.

### 2. Set Up Local Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Database (SQLite for local development)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth - Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# API Keys
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
FINNHUB_API_KEY="your-finnhub-key"
OPENAI_API_KEY="your-openai-key"  # Optional
```

**Generate NEXTAUTH_SECRET:**

On Windows (Git Bash or WSL):
```bash
openssl rand -base64 32
```

Or use online generator: https://generate-secret.vercel.app/32

---

## GitHub Repository Setup

### 1. Create New Repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `alphatrader-ai` (or your preferred name)
3. **Description**: "AI-powered stock analysis and portfolio management platform with Shariah-compliant screening"
4. **Visibility**: Choose Public or Private
5. **Important**: DO NOT initialize with README, .gitignore, or license (we already have these files)
6. Click **"Create repository"**

### 2. Initialize Git (if not already done)

```bash
cd "C:\Projects\AlphaTrader AI\alphatrader-ai"

# Initialize git repository
git init

# Check git status
git status
```

### 3. Add and Commit Files

```bash
# Add all files (. gitignore will exclude sensitive files)
git add .

# Create initial commit
git commit -m "Initial commit: AlphaTrader AI application with subscription tiers and feature gating"
```

### 4. Push to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/alphatrader-ai.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 5. Verify on GitHub

1. Go to your repository URL: `https://github.com/YOUR_USERNAME/alphatrader-ai`
2. Verify all files are present (except `.env` files which are gitignored)
3. Check that `.env.example` is visible (this is safe to commit)

---

## Database Setup

For production, AlphaTrader AI requires PostgreSQL. We'll use Vercel Postgres.

### Why PostgreSQL?

- SQLite (used locally) doesn't support concurrent connections needed for production
- PostgreSQL is production-ready and fully supported by Vercel
- Free tier available (perfect for MVP)

### Set Up Vercel Postgres

We'll do this in the Vercel deployment step, but here's what happens:

1. Vercel will provide a PostgreSQL database
2. You'll get a connection string like: `postgresql://user:pass@host:5432/dbname`
3. Prisma will automatically create all tables on first deployment

**Note**: The Prisma schema is already configured to support PostgreSQL. When you deploy, just change the `provider` from `sqlite` to `postgresql` in the schema.

---

## Vercel Deployment

### 1. Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended for easy integration)
4. Authorize Vercel to access your GitHub account

### 2. Import Project from GitHub

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Find and select your `alphatrader-ai` repository
4. Click "Import"

### 3. Configure Project Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install`

### 4. Add Environment Variables

Before deploying, add these environment variables:

Click "Environment Variables" and add each one:

```env
# Database - We'll add this after creating Vercel Postgres
DATABASE_URL=  # Leave empty for now

# NextAuth
NEXTAUTH_SECRET=  # Use the same secret you generated locally
NEXTAUTH_URL=https://your-project-name.vercel.app  # You'll update this after first deploy

# API Keys
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
FINNHUB_API_KEY=your-finnhub-key
OPENAI_API_KEY=your-openai-key  # Optional

# Environment
NODE_ENV=production
```

**Don't click Deploy yet!** We need to set up the database first.

### 5. Create Vercel Postgres Database

1. In your Vercel project, go to the "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name (e.g., `alphatrader-db`)
5. Select region (choose closest to your target users)
6. Click "Create"

### 6. Connect Database to Project

1. After database is created, click "Connect"
2. Select your project (`alphatrader-ai`)
3. Vercel will automatically add `DATABASE_URL` environment variable
4. Verify it was added in Settings > Environment Variables

### 7. Update Prisma Schema for PostgreSQL

Before deploying, we need to switch from SQLite to PostgreSQL:

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Commit this change:**

```bash
git add prisma/schema.prisma
git commit -m "Switch database provider to PostgreSQL for production"
git push origin main
```

### 8. Deploy to Vercel

1. Vercel should automatically start deploying after you push
2. Or click "Deployments" > "Redeploy" in Vercel dashboard
3. Wait for build to complete (usually 2-5 minutes)
4. Monitor the build logs for any errors

### 9. Update NEXTAUTH_URL

After first deployment:

1. Copy your deployment URL (e.g., `https://alphatrader-ai-xyz123.vercel.app`)
2. Go to Settings > Environment Variables
3. Find `NEXTAUTH_URL` and click "Edit"
4. Update with your actual deployment URL
5. Click "Save"
6. Redeploy: Deployments > ⋯ > Redeploy

### 10. Run Database Migrations

After deployment, create the database tables:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link to your project
cd "C:\Projects\AlphaTrader AI\alphatrader-ai"
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migration
npx prisma migrate deploy
```

**Option B: Using Prisma Studio (Alternative)**

```bash
# Get DATABASE_URL from Vercel dashboard
# Copy the value from Settings > Environment Variables > DATABASE_URL

# Run migration with production database URL
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

### 11. Verify Deployment

Visit your deployment URL and test:

1. ✅ Landing page loads
2. ✅ Click "Get Started" → Should go to login
3. ✅ Try demo login: `demo@alphatrader.ai` / `demo123`
4. ✅ Should redirect to dashboard
5. ✅ Test portfolio features
6. ✅ Test creating an alert
7. ✅ Sign out → Should return to landing page

---

## Post-Deployment

### 1. Set Up Custom Domain (Optional)

1. Go to Settings > Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `alphatrader.ai`)
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` to use custom domain
6. Redeploy

### 2. Enable Vercel Analytics (Optional)

1. Go to Analytics tab
2. Click "Enable Web Analytics"
3. No code changes needed

### 3. Set Up Error Monitoring (Recommended)

**Using Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow the prompts and redeploy.

### 4. Create Demo User

Visit your production URL:

1. Go to `/register`
2. Create demo account:
   - Email: `demo@alphatrader.ai`
   - Password: `demo123`
   - Name: `Demo User`

Or use Prisma Studio to create users directly.

### 5. Monitor Application

**Check these regularly:**

- Vercel Deployments: Build status and logs
- Vercel Analytics: Traffic and performance
- Database Usage: Storage tab
- Function Logs: Runtime errors
- API Rate Limits: Monitor Alpha Vantage/Finnhub usage

---

## Continuous Deployment

Now that you're deployed, any push to `main` branch automatically deploys:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically builds and deploys
```

**Branch Deployments:**

Create a branch for development:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature

# Vercel creates preview deployment
# Merge to main when ready
```

---

## Troubleshooting

### Build Errors

**Error: TypeScript errors**
```
Solution: Run `npm run build` locally and fix all TypeScript errors
```

**Error: Module not found**
```
Solution: Ensure all dependencies are in package.json
Run: npm install
Commit: git add package.json package-lock.json && git commit && git push
```

**Error: Prisma Client not generated**
```
Solution: Vercel should auto-generate. If not, add to package.json:
"postinstall": "prisma generate"
```

### Database Errors

**Error: DATABASE_URL not set**
```
Solution: Verify DATABASE_URL exists in Settings > Environment Variables
Redeploy after adding
```

**Error: Database connection failed**
```
Solution:
1. Check DATABASE_URL format is correct
2. Ensure Vercel Postgres database is running
3. Check database region matches your deployment region
```

**Error: Tables don't exist**
```
Solution: Run migrations:
vercel env pull .env.production
npx prisma migrate deploy
```

### Authentication Errors

**Error: NextAuth errors in logs**
```
Solution:
1. Verify NEXTAUTH_SECRET is set (use: openssl rand -base64 32)
2. Verify NEXTAUTH_URL matches your deployment URL
3. Check that it uses https:// not http://
4. Redeploy after changing environment variables
```

**Error: Login redirects to wrong URL**
```
Solution: Check src/lib/auth.ts redirect callback
Verify NEXTAUTH_URL is correct
```

### API Errors

**Error: API rate limit exceeded**
```
Solution:
1. Upgrade API key plan
2. Implement better caching (already done for stock data)
3. Reduce API call frequency
```

**Error: Invalid API key**
```
Solution: Verify API keys in Settings > Environment Variables
Test keys locally first
```

### Runtime Errors

**Check Function Logs:**

1. Go to Vercel Dashboard
2. Click on your deployment
3. Navigate to "Functions" tab
4. Look for errors in logs
5. Check specific function that's failing

**Common Issues:**

- Missing environment variables
- Database connection timeout
- API rate limits
- Invalid data format

### Rollback Deployment

If new deployment has issues:

1. Go to Deployments tab
2. Find last working deployment
3. Click ⋯ menu
4. Select "Promote to Production"

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | ✅ Yes | Random secret for JWT encryption | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Yes | Your application URL | `https://alphatrader-ai.vercel.app` |
| `ALPHA_VANTAGE_API_KEY` | ✅ Yes | Stock data API key | Free tier: 5 req/min, 500 req/day |
| `FINNHUB_API_KEY` | ✅ Yes | Financial data API key | Free tier: 60 req/min |
| `OPENAI_API_KEY` | ⚠️ Optional | AI insights (if used) | `sk-...` |
| `NODE_ENV` | ⚠️ Optional | Environment mode | `production` |

---

## Database Migrations Guide

### Creating New Migrations

When you modify the Prisma schema locally:

```bash
# Create migration
npx prisma migrate dev --name describe_your_change

# Test locally
npm run dev

# Commit migration
git add prisma/
git commit -m "Add migration: describe_your_change"
git push origin main
```

### Applying Migrations in Production

After pushing code with new migrations:

```bash
# Pull production environment
vercel env pull .env.production

# Apply migrations
npx prisma migrate deploy
```

---

## Performance Optimization

### Vercel Edge Functions

Already configured! Next.js 14+ automatically uses edge runtime where possible.

### Image Optimization

Next.js Image component is already optimized. No action needed.

### API Caching

Stock data is cached for 5 minutes (configurable in API routes).

### Database Indexing

Prisma schema already includes indexes on:
- `userId` (all user-related queries)
- `symbol` (stock lookups)
- `createdAt` (time-based queries)

---

## Security Checklist

Before going live:

- [x] `.env` files in `.gitignore`
- [x] `NEXTAUTH_SECRET` set to random value
- [x] HTTPS enabled (automatic on Vercel)
- [x] Rate limiting implemented (in API routes)
- [x] SQL injection prevention (Prisma handles this)
- [ ] Set up error monitoring (Sentry)
- [ ] Review API key rate limits
- [ ] Set up automated backups
- [ ] Add security headers (middleware.ts)

---

## Cost Estimates

### Vercel Free Tier:
- ✅ 100 GB bandwidth/month
- ✅ 6,000 build minutes/month
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ⚠️ No custom domains

### Vercel Pro ($20/month):
- ✅ Unlimited bandwidth
- ✅ Custom domains
- ✅ Advanced analytics
- ✅ Password protection
- ✅ Higher limits

### Database (Vercel Postgres):
- **Free Tier**: 60 hours compute/month, 256 MB storage
- **Pro**: $10-20/month for more storage

### API Costs:
- **Alpha Vantage**: Free (500 req/day) → $50/month for premium
- **Finnhub**: Free (60 req/min) → $60/month for premium
- **OpenAI**: Pay-per-use (~$0.01-0.10 per user/month)

**Total Estimated Cost for MVP**: $0-30/month

---

## Scaling Considerations

### When to upgrade:

**> 100 users**: Upgrade to Vercel Pro ($20/month)

**> 1,000 users**:
- Upgrade database to Pro tier
- Implement Redis caching
- Upgrade API keys

**> 10,000 users**:
- Move to dedicated PostgreSQL (AWS RDS, DigitalOcean)
- Implement CDN for assets
- Consider multi-region deployment

---

## Next Steps

After successful deployment:

1. ✅ Set up error monitoring (Sentry)
2. ✅ Configure custom domain
3. ✅ Enable Vercel Analytics
4. ✅ Set up automated database backups
5. ⏳ Implement Stripe for subscriptions
6. ⏳ Set up email service (SendGrid, Resend)
7. ⏳ Add social authentication (Google, GitHub)
8. ⏳ Create staging environment
9. ⏳ Write tests (Jest, Playwright)
10. ⏳ Set up CI/CD pipeline

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org

---

**Last Updated**: December 17, 2025
**Deployment Status**: ✅ Production Ready
**Build Status**: ✅ Passing
