# AlphaTrader AI - Testing Checklist

## Mobile Responsiveness Testing

### Viewport Sizes to Test
- [ ] Mobile (320px - 480px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)

### Pages to Test
- [ ] **Login/Register Page**
  - [ ] Forms are readable and usable
  - [ ] Buttons are touch-friendly (min 44x44px)
  - [ ] No horizontal scrolling
  - [ ] Images/logos scale properly

- [ ] **Dashboard**
  - [ ] Portfolio summary cards stack properly on mobile
  - [ ] Charts are responsive and readable
  - [ ] Market movers card is scrollable/responsive
  - [ ] Alerts display properly
  - [ ] Navigation menu works on mobile

- [ ] **Portfolio Page**
  - [ ] Holdings table scrolls horizontally on mobile or stacks
  - [ ] Add/Edit holding modals fit screen
  - [ ] Actions (Buy/Sell/Delete) are accessible
  - [ ] Snapshot creation works

- [ ] **Analysis Page**
  - [ ] Summary cards stack vertically on mobile
  - [ ] Performance charts scale down properly
  - [ ] Benchmark comparison chart readable
  - [ ] Optimization suggestions card scrollable
  - [ ] Rebalancing recommendations display properly
  - [ ] Sector allocation pie chart scales
  - [ ] Top performers/losers cards stack

- [ ] **Watchlist Page**
  - [ ] Watchlist tabs work on mobile
  - [ ] Stock list items are touch-friendly
  - [ ] Add stock modal fits screen
  - [ ] Delete confirmations work

- [ ] **Alerts Page**
  - [ ] Alert cards stack properly
  - [ ] Create alert form is usable
  - [ ] Toggle switches are touch-friendly
  - [ ] Delete actions work

- [ ] **Stock Detail Page**
  - [ ] Candlestick chart is responsive
  - [ ] Stock info sections stack
  - [ ] Add to portfolio/watchlist buttons accessible
  - [ ] Technical indicators display properly

- [ ] **Scanner Page**
  - [ ] Filter options accessible on mobile
  - [ ] Results table scrolls or stacks
  - [ ] Scan button is prominent

### Touch Interactions
- [ ] All buttons are at least 44x44px (touch target size)
- [ ] Dropdowns/selects work with touch
- [ ] Modals can be closed on mobile
- [ ] Swipe gestures don't cause issues
- [ ] Forms can be filled without keyboard overlapping inputs

### Navigation
- [ ] Mobile menu (hamburger) works if implemented
- [ ] Bottom navigation accessible
- [ ] Back navigation works
- [ ] Deep links work on mobile

---

## End-to-End Feature Testing

### Authentication
- [ ] **Registration**
  - [ ] Can create new account with valid email/password
  - [ ] Password requirements enforced
  - [ ] Email validation works
  - [ ] Error messages display for invalid inputs
  - [ ] Redirects to dashboard after signup

- [ ] **Login**
  - [ ] Can login with correct credentials
  - [ ] Error message for wrong credentials
  - [ ] Session persists on page refresh
  - [ ] Remember me functionality (if implemented)

- [ ] **Logout**
  - [ ] Can logout successfully
  - [ ] Session cleared
  - [ ] Redirects to login page

### Portfolio Management
- [ ] **Add Holdings**
  - [ ] Can search for stocks
  - [ ] Can add holding with shares and avg cost
  - [ ] Validation prevents invalid inputs (negative shares, etc.)
  - [ ] Holdings appear in portfolio immediately
  - [ ] Total value calculates correctly

- [ ] **Edit Holdings**
  - [ ] Can update shares/avg cost
  - [ ] Changes reflect in totals
  - [ ] Validation works

- [ ] **Delete Holdings**
  - [ ] Confirmation modal appears
  - [ ] Deletion removes from portfolio
  - [ ] Totals recalculate

- [ ] **Portfolio Snapshots**
  - [ ] Can create snapshot manually
  - [ ] Snapshot saves current portfolio value
  - [ ] Historical snapshots appear in analytics

### Analytics & Insights
- [ ] **Portfolio Analytics**
  - [ ] Performance chart displays correctly
  - [ ] Metrics calculate accurately (return %, volatility, Sharpe)
  - [ ] Best/worst day displays
  - [ ] Sector allocation shows
  - [ ] Top performers/losers display
  - [ ] Period selector updates data

- [ ] **Benchmark Comparison**
  - [ ] Benchmark data loads (S&P 500, NASDAQ, DOW, FTSE)
  - [ ] Portfolio vs benchmark chart displays
  - [ ] Alpha calculation shows
  - [ ] Benchmark selector works

- [ ] **Portfolio Optimization**
  - [ ] Optimization suggestions load
  - [ ] Score displays (0-100)
  - [ ] Strengths/weaknesses show
  - [ ] Actionable suggestions provided
  - [ ] Refresh button works

- [ ] **Portfolio Rebalancing**
  - [ ] Strategy selector works (Equal Weight, Sector Balanced, Risk Parity)
  - [ ] Rebalancing actions calculated
  - [ ] Buy/sell recommendations show
  - [ ] Trade amounts calculated correctly
  - [ ] Tax implications warning shows when needed

### Watchlists
- [ ] **Create Watchlist**
  - [ ] Can create new watchlist with name
  - [ ] Watchlist appears in tabs

- [ ] **Add Stocks to Watchlist**
  - [ ] Search works
  - [ ] Stocks can be added
  - [ ] Prevent duplicates

- [ ] **Remove from Watchlist**
  - [ ] Can remove stocks
  - [ ] Confirmation works

- [ ] **Delete Watchlist**
  - [ ] Can delete entire watchlist
  - [ ] Confirmation modal
  - [ ] Stocks removed

### Price Alerts
- [ ] **Create Price Alert**
  - [ ] Can search for stock
  - [ ] Can set target price
  - [ ] Alert type (above/below) works
  - [ ] Alert saves

- [ ] **Alert Triggers**
  - [ ] Alert activates when condition met (manual testing)
  - [ ] Notification shows (if implemented)

- [ ] **Edit Alert**
  - [ ] Can update target price
  - [ ] Can toggle active status
  - [ ] Changes save

- [ ] **Delete Alert**
  - [ ] Confirmation modal
  - [ ] Alert removed

### Technical Alerts
- [ ] **Create Technical Alert**
  - [ ] Can select indicator (RSI, MACD, MA Crossover, etc.)
  - [ ] Condition selector works
  - [ ] Threshold input validates
  - [ ] Alert saves

- [ ] **Alert Scanning**
  - [ ] Technical alerts scan stocks (cron job)
  - [ ] Alerts trigger correctly
  - [ ] Alert history updates

### Stock Scanner
- [ ] **Basic Scan**
  - [ ] Default scan returns results
  - [ ] Results display stock data

- [ ] **Filter by Criteria**
  - [ ] Price range filter works
  - [ ] Volume filter works
  - [ ] Market cap filter works
  - [ ] Sector filter works
  - [ ] Combined filters work

- [ ] **Sort Results**
  - [ ] Can sort by price
  - [ ] Can sort by volume
  - [ ] Can sort by change %

### Stock Detail Page
- [ ] **Chart Display**
  - [ ] Candlestick chart loads
  - [ ] Period selector works (1D, 1W, 1M, 3M, 6M, 1Y)
  - [ ] Chart updates on period change
  - [ ] Volume bars display

- [ ] **Technical Indicators**
  - [ ] Can add SMA
  - [ ] Can add EMA
  - [ ] Can add Bollinger Bands
  - [ ] Can add RSI
  - [ ] Can add MACD
  - [ ] Can add Stochastic
  - [ ] Can add ATR
  - [ ] Indicators overlay correctly

- [ ] **Company Information**
  - [ ] Company name/description loads
  - [ ] Key metrics display
  - [ ] Sector/industry shows

- [ ] **Actions**
  - [ ] Add to portfolio modal works
  - [ ] Add to watchlist works
  - [ ] Create alert works

### Market Data
- [ ] **Market Movers**
  - [ ] Top gainers load
  - [ ] Top losers load
  - [ ] Most active load
  - [ ] Data refreshes

- [ ] **News Feed**
  - [ ] Market news loads
  - [ ] Stock-specific news loads
  - [ ] Links work
  - [ ] Images display

### AI Chat (if implemented)
- [ ] **Chat Interface**
  - [ ] Can send messages
  - [ ] Responses stream back
  - [ ] Chat history persists
  - [ ] Context awareness works

- [ ] **Stock Analysis**
  - [ ] Can ask about stocks
  - [ ] AI provides insights
  - [ ] Citations/sources provided

---

## Performance Testing

- [ ] **Page Load Times**
  - [ ] Dashboard loads in < 2 seconds
  - [ ] Stock detail page loads in < 2 seconds
  - [ ] Charts render quickly
  - [ ] No infinite loading states

- [ ] **API Response Times**
  - [ ] Portfolio data loads quickly
  - [ ] Stock quotes load quickly
  - [ ] Historical data loads quickly
  - [ ] Optimization completes in reasonable time

- [ ] **Caching**
  - [ ] Benchmark data caches (1 hour)
  - [ ] Quote data caches appropriately
  - [ ] No excessive API calls

---

## Error Handling

- [ ] **Network Errors**
  - [ ] Graceful handling when API unavailable
  - [ ] User-friendly error messages
  - [ ] Retry options provided

- [ ] **Invalid Data**
  - [ ] Form validation catches bad inputs
  - [ ] API errors display properly
  - [ ] No crashes on bad data

- [ ] **Rate Limiting**
  - [ ] Handles API rate limits gracefully
  - [ ] Shows appropriate messages

---

## Browser Compatibility

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile Chrome** (Android)
- [ ] **Mobile Safari** (iOS)

---

## Security

- [ ] **Authentication**
  - [ ] Protected routes redirect to login
  - [ ] Can't access other users' data
  - [ ] Passwords hashed
  - [ ] Sessions expire appropriately

- [ ] **Input Validation**
  - [ ] SQL injection prevented
  - [ ] XSS prevented
  - [ ] CSRF protection (if applicable)

---

## Accessibility

- [ ] **Keyboard Navigation**
  - [ ] Can tab through forms
  - [ ] Can trigger actions with Enter/Space
  - [ ] Focus indicators visible

- [ ] **Screen Readers**
  - [ ] Semantic HTML used
  - [ ] ARIA labels where needed
  - [ ] Alt text on images

- [ ] **Color Contrast**
  - [ ] Text readable against backgrounds
  - [ ] Important info not color-only

---

## Status Summary

### Completed ✅
- Advanced technical indicators added
- Portfolio rebalancing recommendations added

### In Progress 🔄
- Mobile responsiveness testing
- End-to-end feature testing

### Pending ⏳
- Unit tests with Vitest

---

## Test Results Log

| Date | Tester | Feature | Status | Notes |
|------|--------|---------|--------|-------|
| YYYY-MM-DD | - | - | - | - |

---

## Known Issues

1. [Issue tracker - add issues found during testing]

---

## Browser DevTools Commands

### Test Responsive Design
```javascript
// Open DevTools (F12)
// Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
// Select different device presets
// Or set custom dimensions
```

### Test Performance
```javascript
// Lighthouse audit
// Performance tab
// Network tab (throttle to 3G to test slow connections)
```

### Test Accessibility
```javascript
// Lighthouse accessibility audit
// WAVE browser extension
// axe DevTools extension
```
