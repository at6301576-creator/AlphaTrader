import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job to clean up old cache entries
 * Should run daily at midnight UTC
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 0 * * *"
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

    console.log("🧹 Starting cache cleanup job...");

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Clean up old stock cache (older than 7 days)
    const deletedStockCache = await prisma.stockCache.deleteMany({
      where: {
        lastUpdated: {
          lt: sevenDaysAgo,
        },
      },
    });

    // Clean up old news cache (older than 7 days)
    const deletedNewsCache = await prisma.newsCache.deleteMany({
      where: {
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    // Clean up old scan history (older than 30 days)
    const deletedScanHistory = await prisma.scanHistory.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    // Clean up triggered, non-repeatable alerts (older than 30 days)
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        isActive: false,
        repeatAlert: false,
        triggeredAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log("🧹 Cleanup completed:");
    console.log(`  - Stock cache: ${deletedStockCache.count} entries`);
    console.log(`  - News cache: ${deletedNewsCache.count} entries`);
    console.log(`  - Scan history: ${deletedScanHistory.count} entries`);
    console.log(`  - Old alerts: ${deletedAlerts.count} entries`);

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      deleted: {
        stockCache: deletedStockCache.count,
        newsCache: deletedNewsCache.count,
        scanHistory: deletedScanHistory.count,
        alerts: deletedAlerts.count,
      },
    });
  } catch (error) {
    console.error("❌ Cleanup cron job error:", error);
    return NextResponse.json(
      { error: "Cleanup job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
