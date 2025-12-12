import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Check cache first
    const cachedNews = await prisma.newsCache.findMany({
      where: { symbol: symbolUpper },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    const now = new Date();
    const cacheAge = cachedNews.length > 0
      ? now.getTime() - new Date(cachedNews[0].createdAt).getTime()
      : Infinity;
    const isCacheValid = cacheAge < 3600000; // 1 hour

    if (cachedNews.length > 0 && isCacheValid) {
      return NextResponse.json({ news: cachedNews });
    }

    // Fetch fresh news from Yahoo Finance RSS or similar
    // For now, return cached data or empty array
    // In production, you would fetch from a news API here

    return NextResponse.json({
      news: cachedNews.length > 0 ? cachedNews : [],
      cached: cachedNews.length > 0,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
