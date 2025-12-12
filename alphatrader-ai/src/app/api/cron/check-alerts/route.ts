import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuotes } from "@/lib/api/stock-data";
import { emailService } from "@/lib/email";

/**
 * Cron job to check active alerts and trigger notifications
 * Should run every 5 minutes during market hours (9:30 AM - 4:00 PM ET)
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-alerts",
 *     "schedule": "every 5 minutes"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔔 Starting alert checking job...");

    // Get all active alerts
    const alerts = await prisma.alert.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (alerts.length === 0) {
      console.log("ℹ️ No active alerts to check");
      return NextResponse.json({ success: true, message: "No active alerts" });
    }

    // Get unique symbols
    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    const quotes = await getQuotes(symbols);

    if (!quotes || quotes.length === 0) {
      console.error("❌ Failed to fetch quotes for alerts");
      return NextResponse.json(
        { error: "Failed to fetch quotes" },
        { status: 500 }
      );
    }

    let triggeredCount = 0;
    let skippedCount = 0;

    for (const alert of alerts) {
      try {
        const quote = quotes.find((q) => q.symbol === alert.symbol);
        if (!quote) {
          console.warn(`⚠️ No quote found for ${alert.symbol}`);
          skippedCount++;
          continue;
        }

        const currentPrice = (quote as any).regularMarketPrice || quote.currentPrice || 0;
        const priceChange = (quote as any).regularMarketChange || 0;
        const changePercent = (quote as any).regularMarketChangePercent || 0;

        let shouldTrigger = false;

        // Check alert conditions
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
            if (alert.percentValue && Math.abs(changePercent) >= Math.abs(alert.percentValue)) {
              shouldTrigger = true;
            }
            break;

          case "rsi_oversold":
            // Would need RSI data - placeholder for now
            // if (rsi < 30) shouldTrigger = true;
            break;

          case "rsi_overbought":
            // Would need RSI data - placeholder for now
            // if (rsi > 70) shouldTrigger = true;
            break;

          default:
            console.warn(`⚠️ Unknown alert type: ${alert.alertType}`);
        }

        if (shouldTrigger) {
          // Check if this is a repeat alert or first trigger
          if (!alert.repeatAlert && alert.triggerCount > 0) {
            // Skip if not repeatable and already triggered
            skippedCount++;
            continue;
          }

          // Update alert
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              triggeredAt: new Date(),
              lastChecked: new Date(),
              triggerCount: { increment: 1 },
              // Deactivate if not repeatable
              isActive: alert.repeatAlert,
            },
          });

          // Send email notification if enabled
          if (alert.notifyEmail && alert.user.email) {
            await emailService.sendAlertNotification(
              alert.user.email,
              alert.user.name || "Trader",
              {
                symbol: alert.symbol,
                alertType: alert.alertType,
                threshold: alert.threshold || undefined,
                currentPrice,
                message: alert.message || undefined,
              }
            );
          }

          console.log(`🔔 Alert triggered for ${alert.user.name}: ${alert.symbol} at $${currentPrice}`);
          triggeredCount++;
        } else {
          // Update last checked time
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              lastChecked: new Date(),
            },
          });
        }
      } catch (error) {
        console.error(`❌ Error checking alert ${alert.id}:`, error);
      }
    }

    console.log(`🔔 Alert checking completed: ${triggeredCount} triggered, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      message: `Checked ${alerts.length} alerts`,
      triggered: triggeredCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("❌ Alert checking cron job error:", error);
    return NextResponse.json(
      { error: "Alert checking failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
