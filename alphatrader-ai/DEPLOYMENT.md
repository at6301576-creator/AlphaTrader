# AlphaTrader AI - Deployment Guide

## Prerequisites for Production

Before deploying to production, ensure you have:

1. ✅ All TypeScript errors resolved (build passes)
2. ✅ Environment variables configured
3. ✅ Database migration strategy
4. ✅ API keys for production
5. ✅ Security headers and rate limiting
6. ⚠️ Tests written (recommended but not blocking)

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Prepare Database

**For PostgreSQL on Vercel:**
```bash
# Install Vercel PostgreSQL
npm install -g vercel

# Login to Vercel
vercel login

# Create a new Vercel Postgres database in your project dashboard
# Copy the DATABASE_URL and DIRECT_URL from Vercel dashboard
```

#### Step 2: Update Prisma Schema
```bash
# Copy production schema
cp prisma/schema-postgres.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run migrations (do this in Vercel dashboard or after deployment)
npx prisma migrate deploy
```

#### Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```bash
# Database
DATABASE_URL="postgresql://..."  # From Vercel Postgres
DIRECT_URL="postgresql://..."    # From Vercel Postgres

# Auth
NEXTAUTH_SECRET="<generate-a-random-secret>"  # Use: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.vercel.app"

# APIs
ALPHA_VANTAGE_API_KEY="your-key"
FINNHUB_API_KEY="your-key"
OPENAI_API_KEY="your-key" # Optional

# Environment
NODE_ENV="production"
```

#### Step 4: Deploy
```bash
# Deploy to Vercel
vercel --prod

# Or connect your GitHub repo to Vercel for automatic deployments
```

#### Step 5: Run Database Migration
```bash
# After first deployment, run migration
vercel env pull .env.production
npx prisma migrate deploy
```

---

### Option 2: Railway

Railway offers easy PostgreSQL setup:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add

# Deploy
railway up
```

Set environment variables in Railway dashboard, similar to Vercel.

---

### Option 3: DigitalOcean App Platform

1. Connect your GitHub repository
2. Add PostgreSQL managed database
3. Configure environment variables
4. Deploy

---

### Option 4: AWS (Advanced)

For AWS deployment:
- EC2 for app hosting
- RDS for PostgreSQL
- CloudFront for CDN
- Route 53 for DNS
- ElastiCache (Redis) for rate limiting

This requires more setup but offers maximum control.

---

## Database Migration Strategy

### Development → Production

1. **SQLite to PostgreSQL Migration:**

```bash
# Export data from SQLite (development)
npx prisma migrate reset  # Fresh start
npm run db:seed           # Seed with test data

# Switch to PostgreSQL schema
cp prisma/schema-postgres.prisma prisma/schema.prisma

# Create initial migration
npx prisma migrate dev --name init

# Deploy to production
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

2. **For existing production data:**
   - Use a migration tool like `pgloader` to transfer SQLite → PostgreSQL
   - Or manually export/import using CSV

---

## Security Checklist

Before going to production:

- [ ] Change `NEXTAUTH_SECRET` to a strong random value
- [ ] Use strong, unique API keys
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Review CORS and CSP headers in middleware.ts
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Enable rate limiting (already implemented)
- [ ] Review all environment variables
- [ ] Set `NODE_ENV=production`
- [ ] Add .env to .gitignore (already done)
- [ ] Review database indexes for performance
- [ ] Set up automated backups (Vercel Postgres does this)

---

## Post-Deployment

### 1. Create First User
```bash
# Visit /register on your production domain
# Or use Prisma Studio to create admin user
```

### 2. Monitor Application
- Check Vercel Analytics
- Set up Sentry for error tracking
- Monitor API rate limits
- Watch database performance

### 3. Set up CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - run: npm test
```

---

## Scaling Considerations

### When to Scale:

1. **More than 1,000 users:**
   - Move from Vercel Postgres to dedicated PostgreSQL
   - Add Redis for caching and rate limiting

2. **High API usage:**
   - Implement API response caching
   - Use CDN for static assets
   - Consider API key rotation

3. **Global users:**
   - Use edge functions
   - Add CDN
   - Consider multi-region deployment

---

## Rollback Strategy

### Vercel Rollback:
```bash
# View deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback:
```bash
# Revert migration
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## Monitoring & Alerts

### Recommended Services:

1. **Error Tracking:** Sentry
2. **Analytics:** Vercel Analytics or Plausible
3. **Uptime:** UptimeRobot
4. **Performance:** Vercel Speed Insights

### Set up Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Cost Estimates

### Vercel (Recommended for MVP):
- **Hobby:** $0/month (good for testing)
- **Pro:** $20/month (recommended for production)
- **Postgres:** $0-10/month for starter

### Railway:
- **Free Tier:** $0/month (500 hours)
- **Starter:** $5/month
- **Postgres:** ~$5-10/month

### Total Estimated Cost: **$25-50/month** for production-ready app

---

## Support & Troubleshooting

Common issues:

1. **Build fails:** Check TypeScript errors with `npm run build`
2. **Database connection:** Verify DATABASE_URL format
3. **API errors:** Check API keys and rate limits
4. **Auth issues:** Verify NEXTAUTH_SECRET and NEXTAUTH_URL

For help:
- Check Vercel/Railway logs
- Review middleware.ts for rate limiting
- Check browser console for client-side errors
