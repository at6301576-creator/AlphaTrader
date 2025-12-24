import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type {
  UpdateTechnicalAlertRequest,
  TechnicalAlertResponse,
  IndicatorParameters,
} from "@/types/technical-alert";

/**
 * GET /api/technical-alerts/[id]
 * Fetch a specific technical alert by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch alert
    const alert = await prisma.technicalAlert.findUnique({
      where: { id: id },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check ownership
    if (alert.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform to response format
    const response: TechnicalAlertResponse = {
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      companyName: alert.companyName || undefined,
      indicatorType: alert.indicatorType as any,
      condition: alert.condition as any,
      parameters: (typeof alert.parameters === 'string' ? JSON.parse(alert.parameters) : alert.parameters) as IndicatorParameters,
      threshold: alert.threshold || undefined,
      lastValue: alert.lastValue || undefined,
      message: alert.message || undefined,
      notifyEmail: alert.notifyEmail,
      notifyPush: alert.notifyPush,
      notifyInApp: alert.notifyInApp,
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt?.toISOString(),
      lastChecked: alert.lastChecked?.toISOString(),
      triggerCount: alert.triggerCount,
      repeatAlert: alert.repeatAlert,
      cooldownMinutes: alert.cooldownMinutes,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching technical alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch technical alert" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/technical-alerts/[id]
 * Update a specific technical alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch existing alert
    const existingAlert = await prisma.technicalAlert.findUnique({
      where: { id: id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check ownership
    if (existingAlert.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: UpdateTechnicalAlertRequest = await request.json();

    // Update alert
    const alert = await prisma.technicalAlert.update({
      where: { id: id },
      data: {
        isActive: body.isActive ?? existingAlert.isActive,
        message: body.message ?? existingAlert.message,
        notifyEmail: body.notifyEmail ?? existingAlert.notifyEmail,
        notifyPush: body.notifyPush ?? existingAlert.notifyPush,
        notifyInApp: body.notifyInApp ?? existingAlert.notifyInApp,
        repeatAlert: body.repeatAlert ?? existingAlert.repeatAlert,
        cooldownMinutes:
          body.cooldownMinutes ?? existingAlert.cooldownMinutes,
        updatedAt: new Date(),
      },
    });

    // Transform to response format
    const response: TechnicalAlertResponse = {
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      companyName: alert.companyName || undefined,
      indicatorType: alert.indicatorType as any,
      condition: alert.condition as any,
      parameters: (typeof alert.parameters === 'string' ? JSON.parse(alert.parameters) : alert.parameters) as IndicatorParameters,
      threshold: alert.threshold || undefined,
      lastValue: alert.lastValue || undefined,
      message: alert.message || undefined,
      notifyEmail: alert.notifyEmail,
      notifyPush: alert.notifyPush,
      notifyInApp: alert.notifyInApp,
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt?.toISOString(),
      lastChecked: alert.lastChecked?.toISOString(),
      triggerCount: alert.triggerCount,
      repeatAlert: alert.repeatAlert,
      cooldownMinutes: alert.cooldownMinutes,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating technical alert:", error);
    return NextResponse.json(
      { error: "Failed to update technical alert" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/technical-alerts/[id]
 * Delete a specific technical alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch existing alert
    const existingAlert = await prisma.technicalAlert.findUnique({
      where: { id: id },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Check ownership
    if (existingAlert.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete alert
    await prisma.technicalAlert.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    console.error("Error deleting technical alert:", error);
    return NextResponse.json(
      { error: "Failed to delete technical alert" },
      { status: 500 }
    );
  }
}
