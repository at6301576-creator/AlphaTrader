import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { watchlistService } from "@/services/watchlist.service";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
} from "@/lib/api-response";

/**
 * GET /api/watchlist/[id]
 * Fetch a single watchlist by ID with stock data (includes stocks)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAuth(session);

    const { id: watchlistId } = await params;

    const watchlist = await watchlistService.getWatchlist(
      session.user!.id,
      watchlistId
    );

    return createSuccessResponse({ watchlist });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * DELETE /api/watchlist/[id]
 * Delete a watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAuth(session);

    const { id: watchlistId } = await params;

    await watchlistService.deleteWatchlist(session.user!.id, watchlistId);

    return createSuccessResponse({ message: "Watchlist deleted successfully" });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * PATCH /api/watchlist/[id]
 * Update a watchlist
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
    const { name, description } = body;

    await watchlistService.updateWatchlist(session.user!.id, watchlistId, {
      name,
      description,
    });

    return createSuccessResponse({ message: "Watchlist updated successfully" });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
