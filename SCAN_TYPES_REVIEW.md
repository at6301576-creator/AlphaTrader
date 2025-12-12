# Scan Types Review & Analysis

## Overview
Comprehensive review of all 10 scan types in AlphaTrader AI to ensure they work correctly based on their intended purpose.

---

## 1. ✅ Undervalued Stocks

**Purpose:** Find stocks trading below intrinsic value based on P/E, P/B, and other metrics

**Scoring Criteria:**
- Low P/E ratio (<10 = 30pts, <15 = 20pts, >30 = -10pts)
- Low P/B ratio (<1 = 25pts, <2 = 15pts)
- Near 52-week low (<20% of range = 15pts)
- Has dividend (>2% yield = 10pts)

**Max Score:** 80 points

**Stock Selection:** 50 popular US stocks (mix of liquid and mid-cap)

**Status:** ✅ **WORKING CORRECTLY**
- Properly identifies undervalued stocks
- Good balance of valuation metrics
- Returns strong results

**Recommendations:** None - working as intended

---

## 2. ⚠️ Momentum Plays

**Purpose:** Identify stocks with strong price momentum and positive technical signals

**Scoring Criteria:**
- Positive price change (>3% = 20pts, >1% = 10pts)
- High volume (>2x avg = 15pts)
- Near 52-week high (<5% from high = 20pts)

**Max Score:** 55 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issues:**
1. Finnhub doesn't provide `regularMarketChangePercent` - using Yahoo fallback
2. Volume data often missing from Finnhub
3. Max score too low (55) - many stocks won't score

**Recommendations:**
- Increase scoring for available data points
- Add baseline scoring for positive price movement
- Consider RSI/MACD if available

---

## 3. ✅ Dividend Gems

**Purpose:** Discover high-yield dividend stocks with sustainable payouts

**Scoring Criteria:**
- High dividend yield (>5% = 30pts, >3% = 20pts, >2% = 10pts)
- Reasonable P/E (<20 = 15pts - suggests sustainable)
- Large cap (>$10B = 10pts - stability)

**Max Score:** 55 points

**Stock Selection:** 50 popular US stocks

**Status:** ✅ **WORKING CORRECTLY**
- Identifies high-yield dividend stocks
- Checks for sustainability (P/E, market cap)
- Good balance

**Recommendations:** None - working as intended

---

## 4. ⚠️ Growth Stocks

**Purpose:** Find companies with strong revenue and earnings growth

**Scoring Criteria:**
- Revenue growth (>20% = 25pts, >10% = 15pts)
- Earnings growth (>25% = 25pts, >15% = 15pts)
- Low PEG ratio (<1 = 20pts)

**Max Score:** 70 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **CRITICAL ISSUE**

**Issues:**
1. **Finnhub doesn't provide revenue/earnings growth data**
2. PEG ratio also not available
3. This scan type will return ZERO results with Finnhub

**Recommendations:**
- **URGENT:** Modify to use alternative growth signals:
  - Market cap growth (compare historical)
  - High P/E ratio (indicates growth expectations)
  - Recent IPOs or newer companies
  - Sector-based (tech/biotech = growth)

---

## 5. ✅ Value Investing

**Purpose:** Classic value approach - low valuations with solid fundamentals

**Scoring Criteria:**
- Low P/E (<15 = 20pts)
- Low P/B (<1.5 = 20pts)
- Has dividend (>1% = 10pts)
- Good profit margin (>10% = 15pts)

**Max Score:** 65 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **PARTIAL**

**Issues:**
- Profit margin not available from Finnhub basic metrics
- Otherwise solid

**Recommendations:**
- Remove profit margin check or make optional
- Increase other valuations scores to compensate

---

## 6. ⚠️ Quality Companies

**Purpose:** High-quality companies with strong profitability and low debt

**Scoring Criteria:**
- High ROE (>15% = 25pts)
- High profit margin (>15% = 20pts)
- Low debt (D/E <0.5 = 15pts)
- Large cap (>$50B = 10pts)

**Max Score:** 70 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **CRITICAL ISSUE**

**Issues:**
1. **ROE not available from Finnhub**
2. **Profit margin not available**
3. **Debt-to-equity not available**
4. This scan will return near-ZERO results

**Recommendations:**
- **URGENT:** Replace with available metrics:
  - High market cap (>$10B)
  - Positive P/E (profitable)
  - Beta < 1 (stable)
  - Dividend paying (established)

---

## 7. ⚠️ Turnaround Candidates

**Purpose:** Companies showing signs of recovery and potential upside

**Scoring Criteria:**
- Price recovery from 52-week low (20-50% off bottom = 25pts)
- Recent positive momentum (>3% = 20pts, >0% = 10pts)
- Now profitable (profit margin >0 = 20pts)
- Revenue growth (>5% = 15pts)
- High volume (>1.5x = 15pts)
- Low valuation (P/E <15 = 10pts)

**Max Score:** 105 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **PARTIAL**

**Issues:**
- Profit margin not available
- Revenue growth not available
- Max score very high but missing data reduces effectiveness

**Recommendations:**
- Remove unavailable metrics
- Focus on price recovery + momentum
- Lower max score accordingly

---

## 8. ⚠️ Breakout Potential

**Purpose:** Stocks breaking out of consolidation with volume confirmation

**Scoring Criteria:**
- Near/at 52-week high (<2% = 30pts, <5% = 20pts)
- Strong daily momentum (>5% = 25pts, >2% = 15pts)
- Volume confirmation (>2.5x = 30pts, >1.5x = 20pts)
- Good fundamentals (revenue growth >10% = 10pts)

**Max Score:** 95 points

**Stock Selection:** 50 popular US stocks

**Status:** ⚠️ **PARTIAL**

**Issues:**
- `regularMarketChangePercent` not available from Finnhub
- Revenue growth not available
- Volume often missing

**Recommendations:**
- Calculate daily change from current vs previous close
- Remove revenue growth requirement
- Lower volume thresholds

---

## 9. ✅ Penny Stocks

**Purpose:** Low-priced stocks under $5 with high growth potential

**Scoring Criteria:**
- Under $5 (required, then 20pts base)
- High volume (>2x = 25pts, >1.5x = 15pts, >0.5x = 5pts, none = 10pts)
- Strong momentum (>10% = 30pts, >5% = 20pts, >2% = 10pts, >=0% = 5pts)
- Revenue growth (>15% = 20pts)
- Low debt (<0.3 = 15pts, >1.5 = -10pts)

**Max Score:** 110 points

**Stock Selection:** First 100 US stocks (most liquid), filter to <$5

**Status:** ✅ **RECENTLY IMPROVED**
- Lenient scoring even with missing data
- Baseline points for being under $5
- Returns good results now

**Recommendations:** None - working well after improvements

---

## 10. ✅ Crypto Mining Stocks

**Purpose:** Companies mining Bitcoin, Ethereum, and other cryptocurrencies

**Scoring Criteria:**
- Is crypto-related (15pts baseline)
- Strong momentum (>5% = 25pts, >2% = 15pts)
- High volume (>1.5x = 20pts)
- Profitable (margin >10% = 20pts, <0 = -10pts)
- Low debt (<0.5 = 15pts)
- Market cap >$1B (10pts)

**Max Score:** 105 points

**Stock Selection:** Curated list of 19 crypto stocks (MARA, RIOT, CLSK, COIN, etc.)

**Status:** ✅ **WORKING CORRECTLY**
- Uses curated list of known crypto stocks
- Good scoring criteria
- Returns relevant results

**Recommendations:** Keep curated list updated with new crypto stocks

---

## Critical Issues Summary

### Data Availability Problems with Finnhub Free Tier

**Not Available:**
- ❌ `regularMarketChangePercent` (daily % change)
- ❌ Revenue growth
- ❌ Earnings growth
- ❌ PEG ratio
- ❌ ROE (Return on Equity)
- ❌ Profit margin
- ❌ Debt-to-equity
- ❌ Volume (often missing)

**Available:**
- ✅ Current price
- ✅ Previous close
- ✅ 52-week high/low
- ✅ P/E ratio
- ✅ P/B ratio
- ✅ Dividend yield
- ✅ Market cap
- ✅ Beta

---

## Scan Types Status

| Scan Type | Status | Results Quality | Action Needed |
|-----------|--------|----------------|---------------|
| Undervalued | ✅ Working | Good | None |
| Momentum | ⚠️ Partial | Fair | Improve scoring |
| Dividend | ✅ Working | Good | None |
| Growth | ❌ Broken | Zero results | **URGENT FIX** |
| Value | ⚠️ Partial | Fair | Remove profit margin |
| Quality | ❌ Broken | Zero results | **URGENT FIX** |
| Turnaround | ⚠️ Partial | Fair | Remove unavailable metrics |
| Breakout | ⚠️ Partial | Fair | Calculate daily change |
| Penny Stocks | ✅ Working | Good | None |
| Crypto Mining | ✅ Working | Good | None |

**Summary:**
- ✅ **Working:** 4/10 (Undervalued, Dividend, Penny Stocks, Crypto Mining)
- ⚠️ **Partial:** 4/10 (Momentum, Value, Turnaround, Breakout)
- ❌ **Broken:** 2/10 (Growth, Quality)

---

## Recommended Fixes

### Priority 1: Fix Broken Scans (Growth & Quality)

**Growth Stocks - Replace with Available Metrics:**
```typescript
function scoreGrowth(stock: Stock, signals: ScanSignal[]) {
  let score = 0;

  // High P/E suggests growth expectations
  if (stock.peRatio && stock.peRatio > 20) {
    score += 20;
    signals.push({ message: "High growth expectations (P/E > 20)" });
  }

  // Low P/B suggests underpriced growth
  if (stock.pbRatio && stock.pbRatio < 3) {
    score += 15;
    signals.push({ message: "Reasonable valuation for growth" });
  }

  // Large market cap = established growth company
  if (stock.marketCap && stock.marketCap > 5_000_000_000) {
    score += 15;
    signals.push({ message: "Established growth company" });
  }

  // Technology/Healthcare sectors (growth sectors)
  if (stock.sector?.includes('Technology') || stock.sector?.includes('Healthcare')) {
    score += 20;
    signals.push({ message: `Growth sector: ${stock.sector}` });
  }

  return { score, signals };
}
```

**Quality Companies - Replace with Available Metrics:**
```typescript
function scoreQuality(stock: Stock, signals: ScanSignal[]) {
  let score = 0;

  // Large market cap = established
  if (stock.marketCap && stock.marketCap > 50_000_000_000) {
    score += 25;
    signals.push({ message: "Large cap - established company" });
  }

  // Profitable (positive P/E)
  if (stock.peRatio && stock.peRatio > 0 && stock.peRatio < 30) {
    score += 20;
    signals.push({ message: "Profitable with reasonable valuation" });
  }

  // Pays dividend = mature, stable
  if (stock.dividendYield && stock.dividendYield > 1) {
    score += 15;
    signals.push({ message: "Dividend paying - stable" });
  }

  // Low beta = stable
  if (stock.beta && stock.beta < 1) {
    score += 15;
    signals.push({ message: "Low volatility (beta < 1)" });
  }

  return { score, signals };
}
```

### Priority 2: Calculate Daily Change from Available Data

All scans using `regularMarketChangePercent` should calculate it:

```typescript
const changePercent = stock.currentPrice && stock.previousClose
  ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
  : 0;
```

### Priority 3: Remove Unavailable Metrics

- Remove all references to: `revenueGrowth`, `earningsGrowth`, `profitMargin`, `roe`, `debtToEquity`, `pegRatio`
- Or make them optional with fallback scoring

---

## Testing Checklist

After fixes:

- [ ] **Undervalued** - Should return 20-40 results
- [ ] **Momentum** - Should return 15-30 results
- [ ] **Dividend** - Should return 10-20 results
- [ ] **Growth** - Should return 20-30 results (after fix)
- [ ] **Value** - Should return 20-30 results (after fix)
- [ ] **Quality** - Should return 15-25 results (after fix)
- [ ] **Turnaround** - Should return 10-20 results (after fix)
- [ ] **Breakout** - Should return 5-15 results (after fix)
- [ ] **Penny Stocks** - Should return 30-50 results ✅
- [ ] **Crypto Mining** - Should return 15-19 results ✅

---

## Bottom Line

**Current State:**
- 4 scan types work well (Undervalued, Dividend, Penny Stocks, Crypto Mining)
- 2 scan types are broken (Growth, Quality) - **need urgent fixes**
- 4 scan types partially work but need improvement

**Required Actions:**
1. **URGENT:** Fix Growth scan type (replace revenue/earnings growth metrics)
2. **URGENT:** Fix Quality scan type (replace ROE/profit margin/debt metrics)
3. **HIGH:** Calculate daily change percentage from current/previous close
4. **MEDIUM:** Improve scoring for partial scans (Momentum, Value, Turnaround, Breakout)

**Estimated Impact:**
- After fixes: **8-9/10 scan types** will work well
- User experience will significantly improve
- All major use cases will be covered
