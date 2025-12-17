import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanMarket } from "@/services/market-scanner";
import type { ScannerFilters } from "@/types/scanner";
import { createSecureErrorResponse, createSecureResponse, rateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createSecureErrorResponse("Unauthorized", 401);
    }

    // Rate limiting: 10 scans per hour per user
    const rateLimitResult = rateLimit(`scanner:${session.user.id}`, {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return createSecureErrorResponse(
        "Too many scan requests. Please try again later.",
        429
      );
    }

    const filters: ScannerFilters = await request.json();
    console.log("🔍 Starting scan with filters:", filters);

    // Run the scan
    const results = await scanMarket(filters);
    console.log(`✅ Scan complete! Found ${results.length} results`);

    // Save scan to history
    await prisma.scanHistory.create({
      data: {
        userId: session.user.id,
        scanType: filters.scanType,
        markets: JSON.stringify(filters.markets),
        parameters: JSON.stringify(filters),
        resultsCount: results.length,
        topResults: JSON.stringify(
          results.slice(0, 10).map((r) => ({
            symbol: r.stock.symbol,
            name: r.stock.name,
            score: r.score,
            recommendation: r.recommendation,
          }))
        ),
      },
    });

    return createSecureResponse({
      results,
      totalCount: results.length,
    });
  } catch (error) {
    console.error("❌ Scanner error:", error);
    return createSecureErrorResponse(
      "An error occurred during scanning",
      500
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createSecureErrorResponse("Unauthorized", 401);
    }

    // Get recent scan history
    const history = await prisma.scanHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return createSecureResponse({ history });
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return createSecureErrorResponse(
      "An error occurred",
      500
    );
  }
}
