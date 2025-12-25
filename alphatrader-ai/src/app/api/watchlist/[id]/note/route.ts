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

/**
 * PATCH /api/watchlist/[id]/note
 * Update note for a specific stock in a watchlist
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAuth(session);

    const { id: watchlistId } = await params;
    const body = await request.json();
    const { symbol, note } = body;

    if (!symbol || typeof symbol !== "string" || symbol.trim() === "") {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Symbol is required",
        400
      );
    }

    await watchlistService.updateSymbolNote(
      session.user!.id,
      watchlistId,
      symbol,
      note || ""
    );

    return createSuccessResponse({ message: "Note updated successfully" });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
