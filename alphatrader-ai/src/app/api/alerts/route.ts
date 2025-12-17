import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAlertSchema, updateAlertSchema, safeValidate } from "@/lib/validation";

// GET /api/alerts - Get user's alerts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Return alerts with all fields
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateAlertTitle(alert: any): string {
  switch (alert.alertType) {
    case "price_above":
      return `${alert.symbol} price alert`;
    case "price_below":
      return `${alert.symbol} price alert`;
    case "percent_change":
      return `${alert.symbol} movement alert`;
    case "rsi":
      return `${alert.symbol} RSI alert`;
    case "macd":
      return `${alert.symbol} MACD alert`;
    default:
      return `${alert.symbol} alert`;
  }
}

function generateAlertMessage(alert: any): string {
  const condition = alert.condition;
  const threshold = alert.threshold;

  switch (alert.alertType) {
    case "price_above":
      return `Alert when ${alert.symbol} price goes above $${threshold}`;
    case "price_below":
      return `Alert when ${alert.symbol} price goes below $${threshold}`;
    case "percent_change":
      return `Alert when ${alert.symbol} changes by ${threshold}%`;
    default:
      return `Alert set for ${alert.symbol}`;
  }
}

// POST /api/alerts - Create a new alert
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validation = safeValidate(createAlertSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "error" in validation ? validation.error : "Invalid input" },
        { status: 400 }
      );
    }

    const alertData = validation.data;

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        symbol: alertData.symbol, // Already uppercased by schema
        companyName: alertData.companyName,
        alertType: alertData.alertType,
        condition: alertData.condition,
        threshold: alertData.threshold,
        percentValue: alertData.percentValue,
        message: alertData.message,
        notifyEmail: alertData.notifyEmail,
        notifyInApp: alertData.notifyInApp,
        repeatAlert: alertData.repeatAlert,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/alerts - Delete an alert
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    // Verify the alert belongs to the user
    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await prisma.alert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/alerts - Update an alert
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    // Validate update data
    const validation = safeValidate(updateAlertSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "error" in validation ? validation.error : "Invalid input" },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Verify the alert belongs to the user
    const alert = await prisma.alert.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
