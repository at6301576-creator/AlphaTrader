# Quick GitHub & Vercel Setup Guide

This is a condensed guide to get AlphaTrader AI deployed to GitHub and Vercel quickly.

## Step 1: Push to GitHub (5 minutes)

### Create GitHub Repository

1. Go to https://github.com/new
2. Name: `alphatrader-ai`
3. Description: "AI-powered stock analysis platform with Shariah-compliant screening"
4. Visibility: Public or Private (your choice)
5. **Don't** initialize with README
6. Click "Create repository"

### Push Your Code

```bash
cd "C:\Projects\AlphaTrader AI\alphatrader-ai"

# Check git status (should already be initialized)
git status

# If not initialized:
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AlphaTrader AI with subscription tiers and feature gating"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/alphatrader-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Verify

Visit `https://github.com/YOUR_USERNAME/alphatrader-ai` and confirm files are there.

---

## Step 2: Deploy to Vercel (10 minutes)

### Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `alphatrader-ai`
4. Click "Import"

### Add Environment Variables

Click "Environment Variables" and add these:

```
NEXTAUTH_SECRET=YOUR_SECRET_HERE
NEXTAUTH_URL=https://your-project-name.vercel.app
ALPHA_VANTAGE_API_KEY=your-key
FINNHUB_API_KEY=your-key
OPENAI_API_KEY=your-key
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Don't deploy yet!**

### Create Vercel Postgres Database

1. In your Vercel project, click "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Name: `alphatrader-db`
5. Region: Choose closest to you
6. Click "Create"
7. Click "Connect" and select your project
8. Vercel automatically adds `DATABASE_URL`

### Update Prisma Schema

Edit `prisma/schema.prisma` - change line 6:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit and push:

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push origin main
```

### Deploy

Vercel will auto-deploy when you push. Wait 2-5 minutes.

### Update NEXTAUTH_URL

1. Copy your deployment URL (e.g., `https://alphatrader-ai-abc123.vercel.app`)
2. Go to Settings > Environment Variables
3. Edit `NEXTAUTH_URL` with your actual URL
4. Click "Redeploy" from Deployments tab

### Run Database Migration

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

### Test Your Deployment

Visit your URL and test:

1. Landing page loads ✅
2. Click "Get Started" → Goes to login ✅
3. Try demo login: `demo@alphatrader.ai` / `demo123` ✅
4. Redirects to dashboard ✅
5. Sign out → Returns to landing page ✅

---

## Step 3: Create Demo User (Optional)

Visit `/register` on your production URL:

- Email: `demo@alphatrader.ai`
- Password: `demo123`
- Name: `Demo User`

---

## Continuous Deployment

Now every push to `main` automatically deploys:

```bash
git add .
git commit -m "Add new feature"
git push origin main
# Automatically deploys to Vercel
```

---

## Troubleshooting

**Build fails?**
- Run `npm run build` locally first
- Check Vercel build logs

**Database errors?**
- Verify `DATABASE_URL` is set
- Run migrations: `npx prisma migrate deploy`

**Auth errors?**
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches deployment URL

**Need help?**
- See full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Check Vercel logs in dashboard

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain (Settings > Domains)
2. ✅ Enable Vercel Analytics
3. ✅ Add error monitoring (Sentry)
4. ✅ Set up Stripe for payments
5. ✅ Configure email notifications

---

**Estimated Time**: 15-20 minutes total

**Cost**: $0/month (Vercel free tier)

**Done!** 🎉
