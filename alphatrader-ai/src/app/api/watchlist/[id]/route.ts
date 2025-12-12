import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Delete the watchlist
    await prisma.watchlist.delete({
      where: { id: watchlistId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting watchlist:", error);
    return NextResponse.json(
      { error: "Failed to delete watchlist" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description } = body;

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

    // Update the watchlist
    const updated = await prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        name: name || watchlist.name,
        description: description !== undefined ? description : watchlist.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating watchlist:", error);
    return NextResponse.json(
      { error: "Failed to update watchlist" },
      { status: 500 }
    );
  }
}
