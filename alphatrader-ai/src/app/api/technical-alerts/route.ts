import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { CreateTechnicalAlertRequest } from "@/types/technical-alert";
import { technicalAlertService } from "@/services/technical-alert.service";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
  ApiError,
  ErrorCode,
} from "@/lib/api-response";

/**
 * GET /api/technical-alerts
 * Fetch all technical alerts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    requireAuth(session);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, "User not found", 404);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || undefined;
    const indicatorType = searchParams.get("indicatorType") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam !== null ? isActiveParam === "true" : undefined;

    // Fetch alerts via service
    const alerts = await technicalAlertService.getAlerts(user.id, {
      symbol,
      indicatorType,
      isActive,
    });

    return createSuccessResponse(alerts);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * POST /api/technical-alerts
 * Create a new technical alert with comprehensive validation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    requireAuth(session);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, "User not found", 404);
    }

    // Parse request body
    const body: CreateTechnicalAlertRequest = await request.json();

    // Create alert via service (includes comprehensive validation)
    const alert = await technicalAlertService.createAlert(user.id, body);

    return createSuccessResponse(alert, { status: 201 });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
