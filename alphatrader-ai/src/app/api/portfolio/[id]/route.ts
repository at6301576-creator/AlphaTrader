import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: holdingId } = await params;

  try {
    const body = await request.json();
    const { shares, avgCost, addShares, addAvgCost, soldPrice, soldDate } = body;

    // Verify the holding belongs to the user
    const holding = await prisma.portfolio.findFirst({
      where: {
        id: holdingId,
        userId: session.user.id,
      },
    });

    if (!holding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    let updatedData: { shares?: number; avgCost?: number; soldPrice?: number; soldDate?: Date } = {};

    // If marking as sold
    if (soldPrice !== undefined && soldDate !== undefined) {
      updatedData.soldPrice = soldPrice;
      updatedData.soldDate = new Date(soldDate);
    }
    // If adding shares, calculate new average cost
    else if (addShares !== undefined && addAvgCost !== undefined) {
      const totalShares = holding.shares + addShares;
      const totalCostBasis = (holding.shares * holding.avgCost) + (addShares * addAvgCost);
      updatedData.shares = totalShares;
      updatedData.avgCost = totalCostBasis / totalShares;
    } else {
      // Direct update
      if (shares !== undefined) updatedData.shares = shares;
      if (avgCost !== undefined) updatedData.avgCost = avgCost;
    }

    // Update the holding
    await prisma.portfolio.update({
      where: { id: holdingId },
      data: updatedData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating holding:", error);
    return NextResponse.json(
      { error: "Failed to update holding" },
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

  const { id: holdingId } = await params;

  try {
    // Verify the holding belongs to the user
    const holding = await prisma.portfolio.findFirst({
      where: {
        id: holdingId,
        userId: session.user.id,
      },
    });

    if (!holding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    // Delete the holding
    await prisma.portfolio.delete({
      where: { id: holdingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting holding:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 }
    );
  }
}
