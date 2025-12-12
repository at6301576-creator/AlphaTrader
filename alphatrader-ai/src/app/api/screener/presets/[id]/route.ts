import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Update a preset
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: presetId } = await params;

  try {
    const body = await request.json();
    const { name, description, filters, isPublic } = body;

    // Verify the preset belongs to the user
    const preset = await prisma.screenerPreset.findFirst({
      where: {
        id: presetId,
        userId: session.user.id,
      },
    });

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    const updatedPreset = await prisma.screenerPreset.update({
      where: { id: presetId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters: JSON.stringify(filters) }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(updatedPreset);
  } catch (error) {
    console.error("Error updating screener preset:", error);
    return NextResponse.json(
      { error: "Failed to update screener preset" },
      { status: 500 }
    );
  }
}

// Delete a preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: presetId } = await params;

  try {
    // Verify the preset belongs to the user
    const preset = await prisma.screenerPreset.findFirst({
      where: {
        id: presetId,
        userId: session.user.id,
      },
    });

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    await prisma.screenerPreset.delete({
      where: { id: presetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting screener preset:", error);
    return NextResponse.json(
      { error: "Failed to delete screener preset" },
      { status: 500 }
    );
  }
}

// Increment usage count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: presetId } = await params;

  try {
    await prisma.screenerPreset.update({
      where: { id: presetId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating usage count:", error);
    return NextResponse.json(
      { error: "Failed to update usage count" },
      { status: 500 }
    );
  }
}
