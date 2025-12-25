import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { watchlistService } from "@/services/watchlist.service";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
  ApiError,
  ErrorCode,
} from "@/lib/api-response";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/watchlist/[id]/symbols
 * Add a symbol to a watchlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAuth(session);

    const { id: watchlistId } = await params;
    const body = await request.json();
    const { symbol } = body;

    if (!symbol || typeof symbol !== "string" || symbol.trim() === "") {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Symbol is required",
        400
      );
    }

    await watchlistService.addSymbols(
      session.user!.id,
      watchlistId,
      [symbol.toUpperCase()]
    );

    return createSuccessResponse({ message: "Symbol added successfully" });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * DELETE /api/watchlist/[id]/symbols
 * Remove a symbol from a watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAuth(session);

    const { id: watchlistId } = await params;
    const body = await request.json();
    const { symbol } = body;

    if (!symbol || typeof symbol !== "string" || symbol.trim() === "") {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Symbol is required",
        400
      );
    }

    await watchlistService.removeSymbol(
      session.user!.id,
      watchlistId,
      symbol
    );

    return createSuccessResponse({ message: "Symbol removed successfully" });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
