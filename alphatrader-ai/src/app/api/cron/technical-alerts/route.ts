import { NextRequest, NextResponse } from "next/server";
import { scanTechnicalAlerts } from "@/services/technical-alert-scanner";
// import { sendPushNotification } from "@/lib/push-notifications"; // TODO: Implement push notifications
import { prisma } from "@/lib/db";

/**
 * GET /api/cron/technical-alerts
 * Cron job endpoint to scan all active technical alerts
 * This should be called hourly by a cron service (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting technical alert scan...");

    // Run the scanner
    const result = await scanTechnicalAlerts();

    // Send notifications for triggered alerts
    let notificationsSent = 0;
    for (const event of result.events) {
      try {
        // Get the alert and user details
        const alert = await prisma.technicalAlert.findUnique({
          where: { id: event.alertId },
          include: { user: { include: { pushSubscriptions: true } } },
        });

        if (!alert) continue;

        // TODO: Send push notifications
        // if (alert.notifyPush && alert.user.pushSubscriptions.length > 0) {
        //   for (const subscription of alert.user.pushSubscriptions) {
        //     try {
        //       await sendPushNotification(subscription, {
        //         title: `${event.symbol} Alert Triggered`,
        //         body:
        //           event.message ||
        //           `${event.indicatorType.toUpperCase()} ${event.condition} detected`,
        //         icon: "/logo.png",
        //         badge: "/badge.png",
        //         tag: `technical-alert-${alert.id}`,
        //         data: {
        //           url: `/stock/${event.symbol}`,
        //           alertId: alert.id,
        //           symbol: event.symbol,
        //         },
        //       });
        //       notificationsSent++;
        //     } catch (pushError) {
        //       console.error("Error sending push notification:", pushError);
        //     }
        //   }
        // }

        // TODO: Send email notifications if notifyEmail is true
        // This would integrate with an email service like SendGrid, AWS SES, etc.

      } catch (notifError) {
        console.error(`Error sending notification for alert ${event.alertId}:`, notifError);
      }
    }

    console.log(`[Cron] Technical alert scan complete. Notifications sent: ${notificationsSent}`);

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      triggered: result.triggered,
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error in technical alerts cron job:", error);
    return NextResponse.json(
      { error: "Failed to run technical alerts scan" },
      { status: 500 }
    );
  }
}
