# Cron Jobs Documentation

This document describes the automated background tasks (cron jobs) in AlphaTrader AI.

## Overview

The application uses Vercel Cron Jobs to automate routine tasks. All cron endpoints are secured and configured in `vercel.json`.

## Cron Jobs

### 1. Daily Portfolio Snapshot (`/api/cron/snapshot`)

**Schedule:** `0 21 * * 1-5` (9:00 PM UTC / 4:00 PM ET, weekdays only)

**Purpose:** Creates daily snapshots of all user portfolios for historical tracking and analysis.

**What it does:**
- Iterates through all users with active portfolios
- Fetches current prices for all holdings
- Calculates portfolio metrics (total value, cost, gains/losses, day change)
- Computes sector allocation and top performers/losers
- Stores snapshot in database

**Testing locally:**
```bash
curl http://localhost:3000/api/cron/snapshot
```

---

### 2. Alert Checking (`/api/cron/check-alerts`)

**Schedule:** `*/5 14-21 * * 1-5` (Every 5 minutes from 2:00 PM - 9:00 PM UTC / 9:30 AM - 4:00 PM ET, weekdays)

**Purpose:** Monitors active alerts and triggers notifications when conditions are met.

**What it does:**
- Fetches all active alerts
- Gets current prices for watched symbols
- Checks if alert conditions are met (price above/below, percent change)
- Updates alert status and trigger count
- Deactivates non-repeatable alerts after triggering
- Logs triggered alerts (TODO: send email/in-app notifications)

**Supported Alert Types:**
- `price_above` - Trigger when price goes above threshold
- `price_below` - Trigger when price goes below threshold
- `percent_change` - Trigger when price changes by percentage
- `rsi_oversold` - (Placeholder - requires RSI data)
- `rsi_overbought` - (Placeholder - requires RSI data)

**Testing locally:**
```bash
curl http://localhost:3000/api/cron/check-alerts
```

---

### 3. Cache Cleanup (`/api/cron/cleanup`)

**Schedule:** `0 0 * * *` (Midnight UTC, daily)

**Purpose:** Removes stale cache entries and old data to keep database lean.

**What it does:**
- Deletes stock cache entries older than 7 days
- Removes news cache entries older than 7 days
- Cleans up scan history older than 30 days
- Removes triggered non-repeatable alerts older than 30 days

**Testing locally:**
```bash
curl http://localhost:3000/api/cron/cleanup
```

---

## Security

### Production Security

In production, all cron endpoints are protected by an authorization header:

```typescript
const authHeader = request.headers.get("authorization");
if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Required Environment Variable:**
```env
CRON_SECRET=your-secret-token-here
```

Vercel automatically adds this header when calling cron jobs.

### Local Development

In development mode, cron endpoints are accessible without authentication for testing purposes.

---

## Schedule Format

Cron schedules use standard cron syntax:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (0 = Sunday)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 21 * * 1-5` - 9:00 PM UTC, Monday-Friday
- `*/5 14-21 * * 1-5` - Every 5 minutes from 2:00-9:00 PM UTC, Monday-Friday
- `0 0 * * *` - Midnight UTC, daily

---

## Deployment

### Vercel

Cron jobs are automatically configured when deploying to Vercel:

1. Push code to repository
2. Vercel reads `vercel.json` and sets up cron jobs
3. Cron jobs run according to schedule
4. View cron job logs in Vercel Dashboard > Your Project > Logs

### Self-Hosted

If self-hosting, you'll need to set up a cron scheduler:

#### Option 1: node-cron

```bash
npm install node-cron
```

Create `src/cron/scheduler.ts`:
```typescript
import cron from 'node-cron';

// Daily snapshot at 4:00 PM ET (9:00 PM UTC)
cron.schedule('0 21 * * 1-5', async () => {
  await fetch('http://localhost:3000/api/cron/snapshot');
});

// Alert checking every 5 minutes during market hours
cron.schedule('*/5 14-21 * * 1-5', async () => {
  await fetch('http://localhost:3000/api/cron/check-alerts');
});

// Daily cleanup at midnight UTC
cron.schedule('0 0 * * *', async () => {
  await fetch('http://localhost:3000/api/cron/cleanup');
});
```

#### Option 2: System Cron

Add to system crontab:
```bash
0 21 * * 1-5 curl https://your-domain.com/api/cron/snapshot
*/5 14-21 * * 1-5 curl https://your-domain.com/api/cron/check-alerts
0 0 * * * curl https://your-domain.com/api/cron/cleanup
```

---

## Monitoring

### Logs

All cron jobs log their execution:

```
📸 Starting daily portfolio snapshot job...
✅ Snapshot created for user abc123
📸 Snapshot job completed: 10 success, 0 errors
```

### Health Checks

Each cron endpoint returns a JSON response:

```json
{
  "success": true,
  "message": "Created 10 snapshots",
  "errors": 0
}
```

Monitor these responses to ensure cron jobs are running successfully.

---

## Troubleshooting

### Cron job not running

1. Check `vercel.json` syntax is correct
2. Verify cron schedule format
3. Check Vercel Dashboard > Your Project > Settings > Cron Jobs
4. Review logs for errors

### Authorization errors

1. Ensure `CRON_SECRET` environment variable is set in production
2. Vercel adds the authorization header automatically - don't set it manually

### Rate limiting errors

If hitting API rate limits:
- Reduce alert checking frequency
- Implement request queuing
- Use cached data where possible

---

## Future Enhancements

- [ ] Add email notifications when alerts trigger
- [ ] Implement webhook notifications
- [ ] Add RSI/MACD technical indicators for advanced alerts
- [ ] Create admin dashboard to view cron job status
- [ ] Add retry logic for failed jobs
- [ ] Implement job queuing with Bull/BullMQ

---

## Testing

### Manual Testing

Test each cron job locally:

```bash
# Test snapshot job
curl http://localhost:3000/api/cron/snapshot

# Test alert checking
curl http://localhost:3000/api/cron/check-alerts

# Test cleanup
curl http://localhost:3000/api/cron/cleanup
```

### Automated Testing

Create a test script:

```typescript
// test-cron.ts
async function testCronJobs() {
  const jobs = [
    'snapshot',
    'check-alerts',
    'cleanup'
  ];

  for (const job of jobs) {
    const response = await fetch(`http://localhost:3000/api/cron/${job}`);
    const data = await response.json();
    console.log(`${job}: `, data);
  }
}

testCronJobs();
```

---

## Support

For issues or questions about cron jobs:
1. Check Vercel documentation: https://vercel.com/docs/cron-jobs
2. Review this documentation
3. Check application logs
4. Open an issue on GitHub
