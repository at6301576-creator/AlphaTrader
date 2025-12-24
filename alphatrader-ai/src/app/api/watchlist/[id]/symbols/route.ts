import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: watchlistId } = await params;

  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Verify the watchlist belongs to the user
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: session.user.id,
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    // Parse existing symbols and add the new one
    const symbolsData = typeof watchlist.symbols === 'string'
      ? JSON.parse(watchlist.symbols || "[]")
      : (watchlist.symbols || []);
    const symbolUpper = symbol.toUpperCase();

    // Handle both old format (array of strings) and new format (array of objects)
    const existingSymbols = symbolsData.map((item: any) =>
      typeof item === "string" ? item : item.symbol
    );

    if (existingSymbols.includes(symbolUpper)) {
      return NextResponse.json(
        { error: "Symbol already in watchlist" },
        { status: 400 }
      );
    }

    // Add new symbol in new format with note support
    const updatedSymbols =
      symbolsData.length > 0 && typeof symbolsData[0] === "string"
        ? [...symbolsData.map((s: string) => ({ symbol: s })), { symbol: symbolUpper }]
        : [...symbolsData, { symbol: symbolUpper }];

    // Update the watchlist
    await prisma.watchlist.update({
      where: { id: watchlistId },
      data: { symbols: JSON.stringify(updatedSymbols) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding symbol:", error);
    return NextResponse.json(
      { error: "Failed to add symbol" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: watchlistId } = await params;

  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Verify the watchlist belongs to the user
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: session.user.id,
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    // Parse existing symbols and remove the specified one
    const symbolsData = typeof watchlist.symbols === 'string'
      ? JSON.parse(watchlist.symbols || "[]")
      : (watchlist.symbols || []);
    const symbolUpper = symbol.toUpperCase();

    // Handle both old format (array of strings) and new format (array of objects)
    const newSymbols = symbolsData.filter((item: any) => {
      const itemSymbol = typeof item === "string" ? item : item.symbol;
      return itemSymbol !== symbolUpper;
    });

    // Update the watchlist
    await prisma.watchlist.update({
      where: { id: watchlistId },
      data: { symbols: JSON.stringify(newSymbols) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing symbol:", error);
    return NextResponse.json(
      { error: "Failed to remove symbol" },
      { status: 500 }
    );
  }
}
