import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all presets (user's own + public)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const presets = await prisma.screenerPreset.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
      },
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error("Error fetching screener presets:", error);
    return NextResponse.json(
      { error: "Failed to fetch screener presets" },
      { status: 500 }
    );
  }
}

// Create a new preset
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, filters, isPublic } = body;

    if (!name || !filters) {
      return NextResponse.json(
        { error: "Name and filters are required" },
        { status: 400 }
      );
    }

    const preset = await prisma.screenerPreset.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        filters: JSON.stringify(filters),
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error("Error creating screener preset:", error);
    return NextResponse.json(
      { error: "Failed to create screener preset" },
      { status: 500 }
    );
  }
}
