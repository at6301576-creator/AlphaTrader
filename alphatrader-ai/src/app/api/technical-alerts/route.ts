import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type {
  CreateTechnicalAlertRequest,
  TechnicalAlertResponse,
  IndicatorParameters,
} from "@/types/technical-alert";

/**
 * GET /api/technical-alerts
 * Fetch all technical alerts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const indicatorType = searchParams.get("indicatorType");
    const isActive = searchParams.get("isActive");

    // Build filter object
    const where: any = { userId: user.id };
    if (symbol) where.symbol = symbol;
    if (indicatorType) where.indicatorType = indicatorType;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Fetch alerts
    const alerts = await prisma.technicalAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Transform to response format
    const response: TechnicalAlertResponse[] = alerts.map((alert) => ({
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      companyName: alert.companyName || undefined,
      indicatorType: alert.indicatorType as any,
      condition: alert.condition as any,
      parameters: JSON.parse(alert.parameters) as IndicatorParameters,
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
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching technical alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch technical alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/technical-alerts
 * Create a new technical alert
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body: CreateTechnicalAlertRequest = await request.json();

    // Validate required fields
    if (!body.symbol || !body.indicatorType || !body.condition) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, indicatorType, condition" },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await prisma.technicalAlert.create({
      data: {
        userId: user.id,
        symbol: body.symbol.toUpperCase(),
        companyName: body.companyName,
        indicatorType: body.indicatorType,
        condition: body.condition,
        parameters: JSON.stringify(body.parameters),
        threshold: body.threshold,
        message: body.message,
        notifyEmail: body.notifyEmail ?? false,
        notifyPush: body.notifyPush ?? true,
        notifyInApp: body.notifyInApp ?? true,
        repeatAlert: body.repeatAlert ?? false,
        cooldownMinutes: body.cooldownMinutes ?? 60,
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
      parameters: JSON.parse(alert.parameters) as IndicatorParameters,
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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating technical alert:", error);
    return NextResponse.json(
      { error: "Failed to create technical alert" },
      { status: 500 }
    );
  }
}
