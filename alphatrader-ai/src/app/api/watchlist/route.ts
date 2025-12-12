import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotes, type QuoteResult } from "@/lib/api/yahoo-finance";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all watchlists for user
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Collect all unique symbols across all watchlists
    const allSymbols = new Set<string>();
    watchlists.forEach((wl) => {
      const symbolsData = JSON.parse(wl.symbols || "[]");
      symbolsData.forEach((item: any) => {
        const symbol = typeof item === "string" ? item : item.symbol;
        allSymbols.add(symbol);
      });
    });

    // Fetch quotes for all symbols
    const quotes = await getQuotes(Array.from(allSymbols));
    const quoteMap = new Map<string, QuoteResult>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    // Build response with stock data
    const result = watchlists.map((wl) => {
      const symbolsData = JSON.parse(wl.symbols || "[]");

      // Handle both old format (array of strings) and new format (array of objects with notes)
      const stocks = symbolsData.map((item: any) => {
        const symbol = typeof item === "string" ? item : item.symbol;
        const note = typeof item === "string" ? undefined : item.note;
        const quote = quoteMap.get(symbol);

        return {
          symbol,
          name: quote?.longName || quote?.shortName || symbol,
          currentPrice: quote?.regularMarketPrice || 0,
          change: quote?.regularMarketChange || 0,
          changePercent: quote?.regularMarketChangePercent || 0,
          volume: quote?.regularMarketVolume || 0,
          marketCap: quote?.marketCap || 0,
          note,
        };
      });

      return {
        id: wl.id,
        name: wl.name,
        description: wl.description,
        stocks,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching watchlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Watchlist name is required" },
        { status: 400 }
      );
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        symbols: "[]",
      },
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error("Error creating watchlist:", error);
    return NextResponse.json(
      { error: "Failed to create watchlist" },
      { status: 500 }
    );
  }
}
