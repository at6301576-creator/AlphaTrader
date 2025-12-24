import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanMarket } from "@/services/market-scanner";
import type { ScannerFilters } from "@/types/scanner";
import { createSecureErrorResponse, createSecureResponse, rateLimit } from "@/lib/security";

// Enhanced caching system with multiple TTLs
const scanCache = new Map<string, { results: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased from 5)
const MAX_CACHE_SIZE = 50; // Increased from 20

// Separate cache for frequently used scans (longer TTL)
const frequentScanCache = new Map<string, { results: any; timestamp: number; hitCount: number }>();
const FREQUENT_SCAN_TTL = 30 * 60 * 1000; // 30 minutes for popular scans

function getCacheKey(filters: ScannerFilters): string {
  // Create consistent cache key regardless of property order
  const normalized = {
    scanType: filters.scanType,
    markets: (filters.markets || []).sort(),
    sectors: (filters.sectors || []).sort(),
    shariahCompliantOnly: filters.shariahCompliantOnly || false,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minMarketCap: filters.minMarketCap,
    maxMarketCap: filters.maxMarketCap,
  };
  return JSON.stringify(normalized);
}

function isCacheValid(cached: { timestamp: number; hitCount?: number }, ttl: number): boolean {
  return Date.now() - cached.timestamp < ttl;
}

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

    // Enhanced multi-tier caching
    const cacheKey = getCacheKey(filters);

    // Check frequent scan cache first (longer TTL)
    const frequentCached = frequentScanCache.get(cacheKey);
    if (frequentCached && isCacheValid(frequentCached, FREQUENT_SCAN_TTL)) {
      frequentCached.hitCount++;
      console.log(`✅ Returning frequent scan cache (${frequentCached.hitCount} hits)`);
      return createSecureResponse({
        results: frequentCached.results,
        totalCount: frequentCached.results.length,
        cached: true,
        cacheType: 'frequent',
      });
    }

    // Check regular cache
    const cached = scanCache.get(cacheKey);
    if (cached && isCacheValid(cached, CACHE_TTL)) {
      console.log("✅ Returning cached scan results");
      // Promote to frequent cache if accessed multiple times
      const hitCount = (cached as any).hitCount || 1;
      (cached as any).hitCount = hitCount + 1;

      if (hitCount >= 3) {
        frequentScanCache.set(cacheKey, { ...cached, hitCount });
        console.log("  📌 Promoted to frequent scan cache");
      }

      return createSecureResponse({
        results: cached.results,
        totalCount: cached.results.length,
        cached: true,
        cacheType: 'standard',
      });
    }

    // Run the scan
    const results = await scanMarket(filters);
    console.log(`✅ Scan complete! Found ${results.length} results`);

    // Cache the results with initial hit count
    const cacheEntry = { results, timestamp: Date.now(), hitCount: 1 };
    scanCache.set(cacheKey, cacheEntry as any);

    // Intelligent cache cleanup - keep most recent and most accessed
    if (scanCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(scanCache.entries());
      // Sort by recency and access count
      entries.sort((a, b) => {
        const scoreA = b[1].timestamp + ((b[1] as any).hitCount || 0) * 60000; // Each hit = 1 min freshness
        const scoreB = a[1].timestamp + ((a[1] as any).hitCount || 0) * 60000;
        return scoreB - scoreA;
      });
      scanCache.clear();
      entries.slice(0, MAX_CACHE_SIZE).forEach(([key, value]) => scanCache.set(key, value));
      console.log(`  🧹 Cache cleanup: kept top ${MAX_CACHE_SIZE} entries`);
    }

    // Clean frequent cache periodically (keep only top 10)
    if (frequentScanCache.size > 10) {
      const entries = Array.from(frequentScanCache.entries());
      entries.sort((a, b) => b[1].hitCount - a[1].hitCount);
      frequentScanCache.clear();
      entries.slice(0, 10).forEach(([key, value]) => frequentScanCache.set(key, value));
      console.log(`  🧹 Frequent cache cleanup: kept top 10 entries`);
    }

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
