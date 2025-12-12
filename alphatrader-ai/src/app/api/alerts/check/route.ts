import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/api/yahoo-finance";

// This endpoint checks all active alerts and triggers them if conditions are met
// It can be called by a cron job or scheduled task
export async function POST(req: Request) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active alerts
    const alerts = await prisma.alert.findMany({
      where: {
        isActive: true,
        // If repeatAlert is false, only check alerts that haven't been triggered
        OR: [
          { repeatAlert: true },
          { triggeredAt: null },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`Checking ${alerts.length} active alerts...`);

    const triggeredAlerts: string[] = [];
    const errors: string[] = [];

    // Group alerts by symbol to minimize API calls
    const symbolMap = new Map<string, typeof alerts>();
    alerts.forEach((alert) => {
      const existing = symbolMap.get(alert.symbol) || [];
      symbolMap.set(alert.symbol, [...existing, alert]);
    });

    // Fetch all stock data at once
    const symbols = Array.from(symbolMap.keys());
    const quotes = await getQuotes(symbols);
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    // Check each symbol
    for (const [symbol, symbolAlerts] of symbolMap.entries()) {
      try {
        // Get stock data from map
        const stockData = quoteMap.get(symbol);

        if (!stockData?.regularMarketPrice) {
          console.log(`No price data for ${symbol}, skipping...`);
          continue;
        }

        const currentPrice = stockData.regularMarketPrice;
        const previousClose = stockData.regularMarketPreviousClose || currentPrice;
        const percentChange = ((currentPrice - previousClose) / previousClose) * 100;

        // Check each alert for this symbol
        for (const alert of symbolAlerts) {
          let shouldTrigger = false;

          switch (alert.alertType) {
            case "price_above":
              if (alert.threshold && currentPrice > alert.threshold) {
                shouldTrigger = true;
              }
              break;

            case "price_below":
              if (alert.threshold && currentPrice < alert.threshold) {
                shouldTrigger = true;
              }
              break;

            case "percent_change":
              const targetChange = alert.percentValue || alert.threshold || 0;
              if (Math.abs(percentChange) >= Math.abs(targetChange)) {
                shouldTrigger = true;
              }
              break;

            case "rsi_oversold":
              // RSI data requires additional API call - skip for now
              console.log(`RSI check not yet implemented for ${symbol}`);
              break;

            case "rsi_overbought":
              // RSI data requires additional API call - skip for now
              console.log(`RSI check not yet implemented for ${symbol}`);
              break;

            case "macd_cross":
              // MACD data requires additional API call - skip for now
              console.log(`MACD check not yet implemented for ${symbol}`);
              break;

            case "volume_spike":
              // Check if volume is significantly higher than average
              if (stockData.regularMarketVolume && stockData.averageVolume) {
                const volumeRatio = stockData.regularMarketVolume / stockData.averageVolume;
                if (volumeRatio > 2) {
                  // 2x average volume
                  shouldTrigger = true;
                }
              }
              break;
          }

          if (shouldTrigger) {
            // Update alert
            await prisma.alert.update({
              where: { id: alert.id },
              data: {
                triggeredAt: new Date(),
                lastChecked: new Date(),
                triggerCount: { increment: 1 },
                // Disable alert if not repeating
                isActive: alert.repeatAlert,
              },
            });

            triggeredAlerts.push(
              `${alert.symbol} - ${alert.alertType} (User: ${alert.user.email})`
            );

            // Here you could send email notifications if notifyEmail is true
            if (alert.notifyEmail && alert.user.email) {
              console.log(`Email notification would be sent to: ${alert.user.email}`);
              // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
            }
          } else {
            // Update lastChecked timestamp
            await prisma.alert.update({
              where: { id: alert.id },
              data: { lastChecked: new Date() },
            });
          }
        }
      } catch (error) {
        console.error(`Error checking alerts for ${symbol}:`, error);
        errors.push(`${symbol}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      checked: alerts.length,
      triggered: triggeredAlerts.length,
      triggeredAlerts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in alert checking service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to manually trigger alert checking (for testing)
export async function GET() {
  return POST(new Request("http://localhost:3000/api/alerts/check"));
}
