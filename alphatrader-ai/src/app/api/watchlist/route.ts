import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { watchlistService } from "@/services/watchlist.service";
import {
  createSuccessResponse,
  createErrorResponse,
  requireAuth,
  validateRequest,
  ApiError,
  ErrorCode,
} from "@/lib/api-response";

/**
 * GET /api/watchlist
 * Fetch all watchlists with stock data for authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    requireAuth(session);

    const watchlists = await watchlistService.getWatchlistsWithData(
      session.user!.id
    );

    return createSuccessResponse({ watchlists });
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * POST /api/watchlist
 * Create a new watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    requireAuth(session);

    const body = await validateRequest(request, (data) => {
      if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Watchlist name is required and must not be empty",
          400
        );
      }

      if (data.name.length > 100) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Watchlist name must not exceed 100 characters",
          400
        );
      }

      if (data.description && data.description.length > 500) {
        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Description must not exceed 500 characters",
          400
        );
      }

      return data;
    });

    const watchlist = await watchlistService.createWatchlist(session.user!.id, {
      name: body.name,
      description: body.description,
    });

    return createSuccessResponse({ watchlist }, 201);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
