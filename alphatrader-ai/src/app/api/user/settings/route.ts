import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET user settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        riskProfile: true,
        tradingExp: true,
        shariahMode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        name: user.name,
        email: user.email,
        riskProfile: user.riskProfile,
        tradingExp: user.tradingExp,
        shariahMode: user.shariahMode,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    // Validate input
    if (!settings) {
      return NextResponse.json(
        { error: "Settings data is required" },
        { status: 400 }
      );
    }

    // Build update data object (only include fields that exist in User model)
    const updateData: any = {};

    if (settings.name !== undefined) updateData.name = settings.name;
    if (settings.riskProfile !== undefined) updateData.riskProfile = settings.riskProfile;
    if (settings.tradingExp !== undefined) updateData.tradingExp = settings.tradingExp;
    if (settings.shariahMode !== undefined) updateData.shariahMode = settings.shariahMode;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        riskProfile: true,
        tradingExp: true,
        shariahMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        name: updatedUser.name,
        email: updatedUser.email,
        riskProfile: updatedUser.riskProfile,
        tradingExp: updatedUser.tradingExp,
        shariahMode: updatedUser.shariahMode,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
