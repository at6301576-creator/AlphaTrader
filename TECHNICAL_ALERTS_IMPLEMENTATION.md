# Technical Indicator Alerts - Phase 2 Implementation

**Implementation Date:** December 11, 2025
**Status:** ✅ Backend Complete - Ready for UI Integration
**Priority:** High (Week 3-4 - Phase 1)

---

## Overview

This document summarizes the implementation of the **Technical Indicator Alert System** backend infrastructure. This feature allows users to create custom alerts based on technical indicator conditions (RSI, MACD, Stochastic, MA Crossovers, Bollinger Bands) and receive notifications when those conditions are met.

---

## ✅ Phase 2 Complete - Backend Infrastructure

### 1. Database Schema (`prisma/schema.prisma`)

**Added `TechnicalAlert` Model:**
- Stores user-defined technical indicator alerts
- Supports 5 indicator types: RSI, MACD, Stochastic, MA Crossover, Bollinger Bands
- Flexible JSON parameters for indicator configuration
- Tracks alert status, trigger history, and cooldown periods
- Notification preferences (email, push, in-app)

**Key Fields:**
```typescript
model TechnicalAlert {
  id              String    @id
  userId          String
  symbol          String
  indicatorType   String    // rsi, macd, stochastic, ma_crossover, bollinger_bands
  condition       String    // overbought, oversold, bullish_crossover, etc.
  parameters      String    // JSON: indicator-specific parameters
  threshold       Float?
  lastValue       Float?
  notifyEmail     Boolean
  notifyPush      Boolean
  notifyInApp     Boolean
  isActive        Boolean
  triggeredAt     DateTime?
  triggerCount    Int
  repeatAlert     Boolean
  cooldownMinutes Int
  // ... timestamps and relations
}
```

### 2. TypeScript Types (`src/types/technical-alert.ts`)

**Comprehensive Type Definitions:**
- `IndicatorType`: Union type for all supported indicators
- `AlertCondition`: Union type for alert conditions
- Parameter interfaces for each indicator type
- Request/Response interfaces for API operations
- `AlertTriggerEvent` for notification system

### 3. API Endpoints

#### **GET /api/technical-alerts** (`src/app/api/technical-alerts/route.ts`)
- Fetch all technical alerts for authenticated user
- Query filters: `symbol`, `indicatorType`, `isActive`
- Returns array of `TechnicalAlertResponse` objects

#### **POST /api/technical-alerts**
- Create new technical alert
- Validates required fields
- Stores indicator parameters as JSON

#### **GET /api/technical-alerts/[id]** (`src/app/api/technical-alerts/[id]/route.ts`)
- Fetch specific alert by ID
- Ownership verification

#### **PATCH /api/technical-alerts/[id]**
- Update alert settings
- Supports: isActive, message, notification preferences, cooldown

#### **DELETE /api/technical-alerts/[id]**
- Delete specific alert
- Ownership verification

### 4. Alert Scanner Service (`src/services/technical-alert-scanner.ts`)

**Core Detection Logic - 534 lines:**

**Functions:**
- `scanTechnicalAlerts()`: Main scanner function
- `scanAlert()`: Scan individual alert
- `checkRSIAlert()`: Detect RSI overbought/oversold conditions
- `checkMACDAlert()`: Detect MACD bullish/bearish crossovers
- `checkStochasticAlert()`: Detect Stochastic signals
- `checkMACrossoverAlert()`: Detect MA golden/death crosses
- `checkBollingerBandsAlert()`: Detect price touching bands
- `shouldTriggerAlert()`: Cooldown and repeat logic
- `triggerAlert()`: Update database and create trigger event

**Features:**
- Fetches 1 year of daily chart data from Yahoo Finance
- Calculates indicators using centralized library
- Detects signal conditions with crossover detection
- Respects cooldown periods to avoid spam
- Supports one-time and repeating alerts
- Updates `lastChecked` and `lastValue` on every scan

### 5. Cron Job Endpoint (`src/app/api/cron/technical-alerts/route.ts`)

**GET /api/cron/technical-alerts:**
- Hourly cron job endpoint
- Optional Bearer token authentication (`CRON_SECRET`)
- Runs `scanTechnicalAlerts()` service
- Sends push notifications for triggered alerts
- Returns scan summary: scanned count, triggered count, notifications sent
- **TODO:** Email notification integration

---

## Technical Indicator Support

### RSI (Relative Strength Index)
- **Conditions:** Overbought (>70), Oversold (<30)
- **Parameters:** `{ period: 14, overboughtLevel?: 70, oversoldLevel?: 30 }`
- **Use Case:** Identify potential reversal points

### MACD (Moving Average Convergence Divergence)
- **Conditions:** Bullish Crossover, Bearish Crossover
- **Parameters:** `{ fastPeriod?: 12, slowPeriod?: 26, signalPeriod?: 9 }`
- **Use Case:** Trend following, momentum changes

### Stochastic Oscillator
- **Conditions:** Overbought (>80), Oversold (<20), Bullish/Bearish Crossovers
- **Parameters:** `{ kPeriod?: 14, dPeriod?: 3, overboughtLevel?: 80, oversoldLevel?: 20 }`
- **Use Case:** Momentum and reversal signals

### Moving Average Crossover
- **Conditions:** Golden Cross (fast crosses above slow), Death Cross (fast crosses below slow)
- **Parameters:** `{ fastPeriod: 50, slowPeriod: 200, type: 'sma' | 'ema' }`
- **Use Case:** Long-term trend changes

### Bollinger Bands
- **Conditions:** Price above upper band, Price below lower band
- **Parameters:** `{ period?: 20, stdDev?: 2, condition: 'price_above_upper' | 'price_below_lower' }`
- **Use Case:** Volatility and overbought/oversold

---

## Alert Workflow

1. **User Creates Alert** → POST /api/technical-alerts
2. **Alert Stored** → Database with `isActive: true`
3. **Hourly Cron Job** → GET /api/cron/technical-alerts
4. **Scanner Runs** → Fetches chart data, calculates indicators
5. **Condition Met?** → Checks indicator values against alert conditions
6. **Cooldown Check** → Ensures minimum time since last trigger
7. **Trigger Alert** → Updates database, creates trigger event
8. **Send Notifications** → Push notifications (email coming soon)

---

## Notification System Integration

### Push Notifications ✅
- Integrated with existing push notification system
- Sends to all user's registered push subscriptions
- Notification payload:
  ```typescript
  {
    title: "AAPL Alert Triggered",
    body: "RSI is oversold at 25.43 (threshold: 30)",
    data: {
      url: "/stock/AAPL",
      alertId: "...",
      symbol: "AAPL"
    }
  }
  ```

### Email Notifications 🔜
- **TODO:** Integration with email service (SendGrid, AWS SES, etc.)
- Placeholder in cron job code
- Would respect `notifyEmail` preference

---

## Example Usage

### Create RSI Oversold Alert
```typescript
POST /api/technical-alerts
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "indicatorType": "rsi",
  "condition": "oversold",
  "parameters": {
    "period": 14,
    "oversoldLevel": 30
  },
  "message": "AAPL RSI is oversold - potential buy signal",
  "notifyPush": true,
  "repeatAlert": true,
  "cooldownMinutes": 240
}
```

### Create MACD Bullish Crossover Alert
```typescript
POST /api/technical-alerts
{
  "symbol": "TSLA",
  "indicatorType": "macd",
  "condition": "bullish_crossover",
  "parameters": {
    "fastPeriod": 12,
    "slowPeriod": 26,
    "signalPeriod": 9
  },
  "notifyPush": true,
  "repeatAlert": false
}
```

### Create Golden Cross Alert
```typescript
POST /api/technical-alerts
{
  "symbol": "SPY",
  "indicatorType": "ma_crossover",
  "condition": "crosses_above",
  "parameters": {
    "fastPeriod": 50,
    "slowPeriod": 200,
    "type": "sma"
  },
  "notifyPush": true
}
```

---

## Performance Considerations

### Chart Data Caching
- **Current:** Fetches 1 year of daily data per alert per scan
- **Optimization Opportunity:** Cache chart data in `StockCache` table
- **Impact:** Reduces Yahoo Finance API calls by ~90%

### Scan Frequency
- **Current:** Hourly cron job
- **Why:** Balance between timeliness and API usage
- **Daily Data:** Hourly scans are sufficient for daily indicators

### Parallelization
- **Current:** Sequential alert processing
- **Optimization Opportunity:** Process alerts in parallel batches
- **Impact:** Faster scan completion for users with many alerts

---

## Testing

### Manual Testing Checklist

1. **Create Alerts:**
   - ✅ POST /api/technical-alerts with various indicator types
   - ✅ Verify database insertion

2. **Fetch Alerts:**
   - ✅ GET /api/technical-alerts
   - ✅ Filter by symbol, indicatorType, isActive

3. **Update Alerts:**
   - ✅ PATCH /api/technical-alerts/[id]
   - ✅ Verify `updatedAt` timestamp

4. **Delete Alerts:**
   - ✅ DELETE /api/technical-alerts/[id]
   - ✅ Verify cascade delete

5. **Scanner Service:**
   - ✅ Create test alert with easily triggered condition
   - ✅ Run cron job: GET /api/cron/technical-alerts
   - ✅ Verify alert triggered, `triggerCount` incremented
   - ✅ Verify push notification sent

6. **Cooldown Logic:**
   - ✅ Trigger alert twice within cooldown period
   - ✅ Verify second trigger blocked

---

## Security

### Authentication
- ✅ All API endpoints require valid session
- ✅ Ownership verification on PATCH/DELETE operations
- ✅ Cron job supports optional Bearer token authentication

### Input Validation
- ✅ Required fields validated
- ✅ Indicator parameters stored as JSON (validated by TypeScript types)
- ✅ Symbol normalized to uppercase

### Rate Limiting
- **TODO:** Add rate limiting to alert creation endpoint
- **Suggested:** Max 50 alerts per user

---

## Next Steps (Phase 3 - UI)

### 1. Create Alert Dialog Component
- Form with indicator type selector
- Dynamic parameter inputs based on indicator type
- Condition selector dropdown
- Notification preferences checkboxes
- Message/note input

### 2. Alert Management List Component
- Display all user alerts in table/card format
- Show: symbol, indicator, condition, status, last triggered
- Actions: Edit, Delete, Enable/Disable
- Filter/search functionality

### 3. Stock Page Integration
- Add "Create Alert" button on stock detail page
- Pre-fill symbol in create alert dialog
- Show active alerts for current stock

### 4. Alerts Dashboard Page
- Dedicated page at `/alerts` or `/dashboard/alerts`
- Summary statistics (total alerts, active alerts, triggered today)
- Recent triggers list
- Bulk actions (enable/disable multiple)

### 5. Alert History
- Track all trigger events in separate table
- Show historical triggers in alert detail view
- Analytics: Which alerts trigger most frequently

---

## Cost Analysis

### Current Setup (Free Tier)
- **Database:** SQLite (free, local)
- **Chart Data:** Yahoo Finance API (free, unlimited)
- **Push Notifications:** Web Push (free)
- **Cron Jobs:** Need to set up (Vercel Cron free tier: 100 hours/month)

### Estimated Load
- **10 users, 5 alerts each:** 50 alerts to scan hourly
- **Chart data fetch:** 50 API calls/hour to Yahoo Finance
- **Scan duration:** ~30-60 seconds (sequential)
- **Notifications:** Variable based on triggers

### Scaling Considerations
- **100 users, 1000 alerts:** ~5-10 minutes scan time
- **Optimization:** Cache chart data, parallelize scans
- **Alternative:** Use real-time WebSocket data for intraday alerts

---

## Files Created/Modified

### Created Files:
1. `src/types/technical-alert.ts` (133 lines) - TypeScript types
2. `src/app/api/technical-alerts/route.ts` (172 lines) - GET, POST endpoints
3. `src/app/api/technical-alerts/[id]/route.ts` (228 lines) - GET, PATCH, DELETE endpoints
4. `src/services/technical-alert-scanner.ts` (534 lines) - Core detection logic
5. `src/app/api/cron/technical-alerts/route.ts` (88 lines) - Cron job endpoint

### Modified Files:
1. `prisma/schema.prisma` - Added `TechnicalAlert` model
2. Database migration created: `20251211112358_add_technical_alerts`

### Total Lines of Code: ~1,155 lines

---

## Conclusion

✅ **Phase 2 Complete** - Robust backend infrastructure for technical indicator alerts

**What Works:**
- Full CRUD API for alert management
- Comprehensive technical indicator detection (5 indicators, 8+ conditions)
- Intelligent scanning with cooldown and repeat logic
- Push notification integration
- Cron job endpoint for automated scanning

**Ready For:**
- UI component development (Phase 3)
- User testing and feedback
- Production deployment with Vercel Cron or GitHub Actions

**Future Enhancements:**
- Email notification integration
- Real-time intraday alerts (WebSocket integration)
- Alert templates and presets
- Social features (share alerts, community strategies)
- Backtesting: Show how alert would have performed historically
- Machine learning: Suggest optimal alert parameters based on past performance

---

## Deployment Checklist

- [ ] Set up Vercel Cron job to call `/api/cron/technical-alerts` hourly
- [ ] Add `CRON_SECRET` to environment variables
- [ ] Test alert creation in production
- [ ] Monitor scanner performance and API usage
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Create user documentation/help articles
- [ ] Add feature announcement to dashboard

---

**Next Action:** Begin Phase 3 UI development or gather user feedback on backend functionality.
