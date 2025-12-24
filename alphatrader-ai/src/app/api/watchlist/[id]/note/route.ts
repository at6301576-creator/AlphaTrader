import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Update note for a specific stock in a watchlist
 * PATCH /api/watchlist/[id]/note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { symbol, note } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Get the watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      );
    }

    // Parse symbols with notes
    const symbolsData = typeof watchlist.symbols === 'string'
      ? JSON.parse(watchlist.symbols || "[]")
      : (watchlist.symbols || []);

    // Check if symbols is array of strings (old format) or array of objects (new format with notes)
    let updatedSymbols;

    if (symbolsData.length > 0 && typeof symbolsData[0] === "string") {
      // Convert old format to new format
      updatedSymbols = symbolsData.map((sym: string) => ({
        symbol: sym,
        note: sym === symbol ? note : undefined,
      }));
    } else {
      // Already in new format, update the note
      updatedSymbols = symbolsData.map((item: any) => {
        if (item.symbol === symbol) {
          return { ...item, note: note || undefined };
        }
        return item;
      });
    }

    // Update the watchlist
    await prisma.watchlist.update({
      where: { id },
      data: {
        symbols: JSON.stringify(updatedSymbols),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}
