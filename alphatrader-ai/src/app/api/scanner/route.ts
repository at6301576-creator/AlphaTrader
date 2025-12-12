import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanMarket } from "@/services/market-scanner";
import type { ScannerFilters } from "@/types/scanner";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      results,
      totalCount: results.length,
    });
  } catch (error) {
    console.error("❌ Scanner error:", error);
    return NextResponse.json(
      { error: "An error occurred during scanning" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent scan history
    const history = await prisma.scanHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
