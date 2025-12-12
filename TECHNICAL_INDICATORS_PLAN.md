# Advanced Technical Indicators & Alerts Implementation Plan

**Status:** Library Created ✅ | UI Integration Pending ⏳ | Alerts System Pending ⏳

---

## What's Been Completed

### ✅ Technical Indicators Library (`src/lib/technical-indicators.ts`)

Created comprehensive library with:

**Indicators:**
1. **RSI (Relative Strength Index)** - Momentum oscillator (0-100)
2. **MACD** - Trend-following indicator with histogram
3. **Stochastic Oscillator** - %K and %D lines (0-100)
4. **ATR (Average True Range)** - Volatility indicator
5. **Volume SMA** - Volume moving average
6. **SMA/EMA** - Moving averages (already in StockChart, now centralized)
7. **Bollinger Bands** - Volatility bands

**Signal Detection Functions:**
- `detectRSISignal()` - Overbought (>70) / Oversold (<30)
- `detectMACDCrossover()` - Bullish/bearish crossovers
- `detectMACrossover()` - Golden cross / Death cross
- `detectStochasticSignal()` - Overbought/oversold + crossovers

---

## Phase 1: Enhanced Chart with Oscillator Panels

###  Objective
Add RSI, MACD, and Stochastic panels below the main price chart

### Files to Modify

#### 1. `src/components/analysis/StockChart.tsx`

**Changes Needed:**
- Import from `@/lib/technical-indicators`
- Add state for oscillator selection: `const [selectedOscillator, setSelectedOscillator] = useState<"none" | "rsi" | "macd" | "stochastic">("none")`
- Create separate chart containers for oscillators
- Add UI controls to toggle between oscillators

**Implementation Steps:**

```typescript
// Add after main chart
if (selectedOscillator === "rsi") {
  // Create RSI panel (150px height)
  const rsiChart = createChart(rsiContainerRef.current, {
    height: 150,
    // ... theme config
  });

  const rsiData = calculateRSI(filteredData, 14);
  const rsiSeries = rsiChart.addSeries(LineSeries, {
    color: "#a855f7",
    lineWidth: 2,
  });
  rsiSeries.setData(rsiData);

  // Add overbought/oversold reference lines at 70 and 30
}

if (selectedOscillator === "macd") {
  // Create MACD panel
  const macdChart = createChart(macdContainerRef.current, {
    height: 150,
  });

  const { macd, signal, histogram } = calculateMACD(filteredData);

  // MACD line (blue)
  const macdSeries = macdChart.addSeries(LineSeries, {
    color: "#3b82f6",
    lineWidth: 2,
  });
  macdSeries.setData(macd);

  // Signal line (orange)
  const signalSeries = macdChart.addSeries(LineSeries, {
    color: "#f59e0b",
    lineWidth: 1,
  });
  signalSeries.setData(signal);

  // Histogram (green/red)
  const histSeries = macdChart.addSeries(HistogramSeries);
  histSeries.setData(histogram);
}

if (selectedOscillator === "stochastic") {
  // Create Stochastic panel
  const stochChart = createChart(stochContainerRef.current, {
    height: 150,
  });

  const { k, d } = calculateStochastic(filteredData);

  // %K line (fast, blue)
  const kSeries = stochChart.addSeries(LineSeries, {
    color: "#3b82f6",
    lineWidth: 2,
  });
  kSeries.setData(k);

  // %D line (slow, orange)
  const dSeries = stochChart.addSeries(LineSeries, {
    color: "#f59e0b",
    lineWidth: 1,
  });
  dSeries.setData(d);

  // Add overbought (80) and oversold (20) lines
}
```

**UI Controls:**
```tsx
<div className="flex gap-2 mb-4">
  <Badge onClick={() => setSelectedOscillator("none")}>None</Badge>
  <Badge onClick={() => setSelectedOscillator("rsi")}>RSI</Badge>
  <Badge onClick={() => setSelectedOscillator("macd")}>MACD</Badge>
  <Badge onClick={() => setSelectedOscillator("stochastic")}>Stochastic</Badge>
</div>
```

---

## Phase 2: Technical Alerts System

### Objective
Allow users to create and manage technical indicator alerts

### Architecture

**Alert Types:**
1. RSI alerts (overbought/oversold)
2. MACD crossover alerts (bullish/bearish)
3. Moving Average crossover alerts (golden cross/death cross)
4. Stochastic alerts (overbought/oversold/crossovers)
5. Price crossing Moving Average

### Database Schema

#### 1. Create Prisma Migration

**File:** `prisma/schema.prisma`

```prisma
model TechnicalAlert {
  id          String   @id @default(cuid())
  userId      String
  symbol      String

  // Alert type and configuration
  alertType   String   // "rsi" | "macd_crossover" | "ma_crossover" | "stochastic" | "price_ma"
  condition   String   // "overbought" | "oversold" | "bullish_crossover" | "bearish_crossover" | "golden_cross" | "death_cross"

  // Parameters (stored as JSON)
  parameters  Json     // { period: 14, threshold: 70, fastPeriod: 12, etc. }

  // Alert delivery
  enabled     Boolean  @default(true)
  emailAlert  Boolean  @default(true)
  pushAlert   Boolean  @default(false)

  // Tracking
  lastTriggered DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([symbol])
  @@index([enabled])
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add_technical_alerts
npx prisma generate
```

### API Endpoints

#### 1. Create Alert

**File:** `src/app/api/alerts/technical/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { symbol, alertType, condition, parameters, emailAlert, pushAlert } = body;

  const alert = await prisma.technicalAlert.create({
    data: {
      userId: session.user.id,
      symbol,
      alertType,
      condition,
      parameters,
      emailAlert,
      pushAlert,
    },
  });

  return NextResponse.json(alert);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  const alerts = await prisma.technicalAlert.findMany({
    where: {
      userId: session.user.id,
      ...(symbol && { symbol }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}
```

#### 2. Update/Delete Alert

**File:** `src/app/api/alerts/technical/[id]/route.ts`

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { enabled, emailAlert, pushAlert, parameters } = body;

  const alert = await prisma.technicalAlert.update({
    where: {
      id: params.id,
      userId: session.user.id, // Ensure ownership
    },
    data: {
      ...(enabled !== undefined && { enabled }),
      ...(emailAlert !== undefined && { emailAlert }),
      ...(pushAlert !== undefined && { pushAlert }),
      ...(parameters && { parameters }),
    },
  });

  return NextResponse.json(alert);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.technicalAlert.delete({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
```

### Alert Detection Service

**File:** `src/services/technical-alert-scanner.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { getHistoricalData } from "@/lib/api/yahoo-finance";
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateStochastic,
  detectRSISignal,
  detectMACDCrossover,
  detectMACrossover,
  detectStochasticSignal,
} from "@/lib/technical-indicators";
import { sendEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/push-notifications";

export async function scanTechnicalAlerts() {
  // Get all enabled alerts
  const alerts = await prisma.technicalAlert.findMany({
    where: { enabled: true },
    include: { user: true },
  });

  for (const alert of alerts) {
    try {
      // Fetch latest price data
      const data = await getHistoricalData(alert.symbol, "1mo", "1d");
      if (data.length < 50) continue; // Need enough data

      let triggered = false;
      let message = "";

      // Check alert condition
      switch (alert.alertType) {
        case "rsi": {
          const rsiData = calculateRSI(data, (alert.parameters as any).period || 14);
          if (rsiData.length === 0) break;

          const latestRSI = rsiData[rsiData.length - 1].value;
          const signal = detectRSISignal(latestRSI);

          if (alert.condition === "overbought" && signal.type === "overbought") {
            triggered = true;
            message = `${alert.symbol} RSI is overbought at ${latestRSI.toFixed(2)}`;
          } else if (alert.condition === "oversold" && signal.type === "oversold") {
            triggered = true;
            message = `${alert.symbol} RSI is oversold at ${latestRSI.toFixed(2)}`;
          }
          break;
        }

        case "macd_crossover": {
          const { macd, signal: signalLine } = calculateMACD(data);
          if (macd.length < 2 || signalLine.length < 2) break;

          const current = detectMACDCrossover(
            macd[macd.length - 1].value,
            signalLine[signalLine.length - 1].value,
            macd[macd.length - 2].value,
            signalLine[signalLine.length - 2].value
          );

          if (alert.condition === "bullish_crossover" && current.type === "bullish_crossover") {
            triggered = true;
            message = `${alert.symbol} MACD bullish crossover detected`;
          } else if (alert.condition === "bearish_crossover" && current.type === "bearish_crossover") {
            triggered = true;
            message = `${alert.symbol} MACD bearish crossover detected`;
          }
          break;
        }

        case "ma_crossover": {
          const params = alert.parameters as any;
          const fastSMA = calculateSMA(data, params.fastPeriod || 50);
          const slowSMA = calculateSMA(data, params.slowPeriod || 200);

          if (fastSMA.length < 2 || slowSMA.length < 2) break;

          const current = detectMACrossover(
            fastSMA[fastSMA.length - 1].value,
            slowSMA[slowSMA.length - 1].value,
            fastSMA[fastSMA.length - 2].value,
            slowSMA[slowSMA.length - 2].value
          );

          if (alert.condition === "golden_cross" && current.type === "golden_cross") {
            triggered = true;
            message = `${alert.symbol} Golden Cross detected (${params.fastPeriod}/${params.slowPeriod} MA)`;
          } else if (alert.condition === "death_cross" && current.type === "death_cross") {
            triggered = true;
            message = `${alert.symbol} Death Cross detected (${params.fastPeriod}/${params.slowPeriod} MA)`;
          }
          break;
        }

        case "stochastic": {
          const { k, d } = calculateStochastic(data);
          if (k.length < 2 || d.length < 2) break;

          const signal = detectStochasticSignal(
            k[k.length - 1].value,
            d[d.length - 1].value,
            k[k.length - 2].value,
            d[d.length - 2].value
          );

          if (alert.condition === signal.type) {
            triggered = true;
            message = `${alert.symbol} Stochastic ${signal.type.replace("_", " ")}`;
          }
          break;
        }
      }

      // Send notifications if triggered
      if (triggered) {
        // Update last triggered time
        await prisma.technicalAlert.update({
          where: { id: alert.id },
          data: { lastTriggered: new Date() },
        });

        // Send email
        if (alert.emailAlert && alert.user.email) {
          await sendEmail({
            to: alert.user.email,
            subject: `Technical Alert: ${alert.symbol}`,
            html: `<p>${message}</p>`,
          });
        }

        // Send push notification
        if (alert.pushAlert) {
          await sendPushNotification(alert.userId, {
            title: "Technical Alert",
            body: message,
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning alert ${alert.id}:`, error);
    }
  }
}
```

### Cron Job Setup

**File:** `src/app/api/cron/technical-alerts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { scanTechnicalAlerts } from "@/services/technical-alert-scanner";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await scanTechnicalAlerts();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error running technical alert scan:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
```

**Setup Vercel Cron (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/technical-alerts",
    "schedule": "0 * * * *"
  }]
}
```

### UI Components

#### 1. Alert Creation Dialog

**File:** `src/components/alerts/CreateTechnicalAlert.tsx`

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

export function CreateTechnicalAlert({ symbol }: { symbol: string }) {
  const [alertType, setAlertType] = useState("rsi");
  const [condition, setCondition] = useState("overbought");
  const [emailAlert, setEmailAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(false);

  async function handleCreate() {
    const parameters = getParameters(alertType);

    const response = await fetch("/api/alerts/technical", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        alertType,
        condition,
        parameters,
        emailAlert,
        pushAlert,
      }),
    });

    if (response.ok) {
      // Close dialog and refresh
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Technical Alert for {symbol}</DialogTitle>
          <DialogDescription>
            Get notified when technical indicators trigger
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert Type Selection */}
          <div>
            <Label>Indicator</Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <option value="rsi">RSI</option>
              <option value="macd_crossover">MACD Crossover</option>
              <option value="ma_crossover">MA Crossover</option>
              <option value="stochastic">Stochastic</option>
            </Select>
          </div>

          {/* Condition Selection (dynamic based on type) */}
          <div>
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              {getConditions(alertType).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          {/* Notification Preferences */}
          <div className="flex items-center justify-between">
            <Label>Email Alert</Label>
            <Switch checked={emailAlert} onCheckedChange={setEmailAlert} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Push Notification</Label>
            <Switch checked={pushAlert} onCheckedChange={setPushAlert} />
          </div>

          <Button onClick={handleCreate} className="w-full">
            Create Alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2. Alert Management Panel

**File:** `src/components/alerts/TechnicalAlertsList.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

export function TechnicalAlertsList({ symbol }: { symbol?: string }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, [symbol]);

  async function fetchAlerts() {
    const url = symbol ? `/api/alerts/technical?symbol=${symbol}` : `/api/alerts/technical`;
    const response = await fetch(url);
    const data = await response.json();
    setAlerts(data);
  }

  async function toggleAlert(id: string, enabled: boolean) {
    await fetch(`/api/alerts/technical/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchAlerts();
  }

  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return;
    await fetch(`/api/alerts/technical/${id}`, { method: "DELETE" });
    fetchAlerts();
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card key={alert.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{alert.symbol}</div>
              <div className="text-sm text-gray-500">
                {formatAlertDescription(alert)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={alert.enabled}
                onCheckedChange={(enabled) => toggleAlert(alert.id, enabled)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteAlert(alert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## Implementation Timeline

### Week 1: Enhanced Charts
- [ ] Day 1-2: Update StockChart.tsx with oscillator panels
- [ ] Day 3: Add RSI panel with reference lines
- [ ] Day 4: Add MACD panel with histogram
- [ ] Day 5: Add Stochastic panel

### Week 2: Alert System Backend
- [ ] Day 1: Database schema and migration
- [ ] Day 2: API endpoints (create, list, update, delete)
- [ ] Day 3: Alert detection service
- [ ] Day 4: Cron job setup
- [ ] Day 5: Testing and refinement

### Week 3: Alert System UI
- [ ] Day 1-2: Create alert dialog component
- [ ] Day 3: Alert management list component
- [ ] Day 4: Integrate into stock page
- [ ] Day 5: Testing and UX polish

---

## Testing Plan

1. **Indicator Calculations**: Verify against TradingView/Yahoo Finance
2. **Signal Detection**: Test crossover logic with edge cases
3. **Alert Triggering**: Manually trigger conditions, verify notifications sent
4. **Performance**: Ensure cron job completes within time limits
5. **Email/Push**: Test delivery of both notification types

---

## Success Metrics

- ✅ RSI, MACD, Stochastic visible on charts
- ✅ Users can create alerts for all indicator types
- ✅ Alerts trigger correctly and send notifications
- ✅ Alert management UI is intuitive
- ✅ Cron job runs reliably every hour

---

##  Next Steps

1. Complete Phase 1 (Enhanced Charts) first - visual impact, no backend complexity
2. Then implement Phase 2 (Alert System) - requires database, cron, notifications
3. Test thoroughly before marking feature as complete
4. Update competitive analysis to mark technical alerts as implemented

