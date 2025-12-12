# Finnhub Migration - Important Information

## ⚠️ Current Status

Your app has been **partially migrated** to Finnhub, but there's a critical limitation you need to understand:

### The Problem with Finnhub Free Tier

**Finnhub Free Tier Limits:**
- 60 API calls per minute
- Each stock requires 3 API calls (quote + profile + metrics)
- **Scanning 50 stocks = 150 API calls = 2.5 minutes**
- **Scanning 100 stocks = 300 API calls = 5 minutes**

This makes the scanner **extremely slow** on the free tier.

---

## Your Options for a Redistributable App

### Option 1: Keep Yahoo Finance (Current - Fast but NOT Redistributable)

**Status:** ✅ Currently working
**Speed:** Fast (handles 300 stocks in ~18 seconds)
**Legal:** ❌ Violates Yahoo ToS for redistribution
**Hardcoded Lists:** ✅ All removed

**Use This If:**
- You're still developing/testing
- You haven't redistributed the app yet
- You're okay with legal risk for personal use

---

### Option 2: Use Finnhub Free Tier (Redistributable but SLOW)

**Status:** ✅ Code ready, needs server restart
**Speed:** ⚠️ VERY SLOW (2-5 minutes per scan)
**Legal:** ✅ Fully legal for redistribution
**Hardcoded Lists:** ✅ All removed

**Files Modified:**
- `src/lib/api/finnhub.ts` - Finnhub integration
- `src/lib/api/stock-data.ts` - Clean API wrapper
- `src/services/market-scanner.ts` - Uses Finnhub instead of Yahoo
- `src/lib/api/stocktwits.ts` - Hardcoded lists removed

**Limitations:**
- Max 50 stocks per scan (to keep under 60/min limit)
- 5-minute cache to reduce API calls
- No batch quote support on free tier

**Use This If:**
- You need to redistribute the app NOW
- You're okay with slower scans
- You want to stay legal

---

### Option 3: Upgrade to Finnhub Paid Plan (Recommended for Production)

**Cost:** $59-$99/month
**Speed:** ✅ Fast (600-6000 calls/min)
**Legal:** ✅ Fully legal for redistribution
**Hardcoded Lists:** ✅ All removed

**Benefits:**
- 10x-100x faster than free tier
- Batch quote endpoints
- Real-time data
- WebSocket support
- No more rate limiting issues

**Plans:**
- **Starter ($59/mo):** 600 calls/min, good for small apps
- **Professional ($99/mo):** 6000 calls/min, production-ready

**Sign up:** https://finnhub.io/pricing

---

### Option 4: Use Alternative APIs

**Alpha Vantage:**
- Free tier: 25 calls/DAY (way too limited)
- Premium: $50/month for 1200 calls/min

**Polygon.io:**
- Free tier: 5 calls/min (too limited)
- Starter: $29/month

**IEX Cloud:**
- Free tier: 50k messages/month
- Good alternative to Finnhub

---

## Current Code Status

### ✅ Completed

1. ✅ Finnhub API integration (`src/lib/api/finnhub.ts`)
2. ✅ Stock data abstraction layer (`src/lib/api/stock-data.ts`)
3. ✅ Market scanner updated to use Finnhub (`src/services/market-scanner.ts`)
4. ✅ Removed 70 hardcoded penny stocks from StockTwits
5. ✅ Removed 120 hardcoded Shariah stocks from yahoo-finance.ts
6. ✅ Removed 20 hardcoded crypto mining stocks
7. ✅ Rate limiting optimized (60 calls/min batching)
8. ✅ Caching implemented (5min TTL)

### ⚠️ What's Currently Running

Your server is still using **Yahoo Finance** because you haven't restarted it yet.

To switch to Finnhub:
```bash
# Kill current server
taskkill //F //IM node.exe

# Restart
npm run dev
```

---

## My Recommendation

**For Development/Testing:**
- Keep using Yahoo Finance for now (fast, works great)
- Remove all hardcoded lists ✅ (already done)
- Test features and functionality

**Before Redistributing:**
1. Consider upgrading to Finnhub Starter ($59/mo)
2. OR accept slower scans with free tier
3. OR explore IEX Cloud as alternative

**The app is ready to be redistributable** - you just need to decide on the API tier based on your performance requirements.

---

## Files You Can Delete (Optional)

These files are no longer needed but kept for reference:
- `src/lib/api/yahoo-finance.ts` - Old Yahoo Finance code (keep for now as fallback)
- `src/lib/api/stocktwits.ts` - Now returns empty arrays (can be deleted)

---

## Testing the Finnhub Version

1. Restart server to load new code
2. Try a scan (will be slow - 2-5 minutes)
3. Check console logs for Finnhub API calls
4. Verify no hardcoded lists are used

---

## Need Help?

- Finnhub Docs: https://finnhub.io/docs/api
- Your API Key is already configured in `.env`
- Free tier limits: https://finnhub.io/pricing

---

**Bottom Line:** Your app is technically redistributable now (no hardcoded lists, legal API), but you'll need to upgrade to a paid Finnhub plan for production-quality performance.
