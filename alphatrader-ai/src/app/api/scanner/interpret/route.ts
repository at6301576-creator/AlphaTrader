/**
 * API Route: Scanner Query Interpretation
 * Accepts natural language queries and returns structured scanner configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { interpretScannerQuery } from "@/lib/ai/scanner-interpreter";
import { createSecureErrorResponse, createSecureResponse, rateLimit } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InterpretRequest {
  query: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user?.id) {
      return createSecureErrorResponse("Unauthorized", 401);
    }

    // 2. Rate limiting (20 requests per hour per user)
    const rateLimitResult = rateLimit(`scanner-interpret:${session.user.id}`, {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 20,
    });

    if (!rateLimitResult.success) {
      return createSecureErrorResponse(
        "Too many interpretation requests. Please try again later.",
        429
      );
    }

    // 3. Parse request body
    const body = (await request.json()) as InterpretRequest;

    if (!body.query || typeof body.query !== "string") {
      return createSecureErrorResponse("Query is required", 400);
    }

    if (body.query.length > 500) {
      return createSecureErrorResponse("Query too long (max 500 characters)", 400);
    }

    // 4. Interpret query using AI
    console.log(`🤖 Interpreting scanner query for user ${session.user.id}: "${body.query}"`);

    const interpretation = await interpretScannerQuery(body.query);

    console.log(`✅ Interpretation complete:`, {
      scanType: interpretation.scanType,
      confidence: interpretation.confidence,
    });

    // 5. Return interpretation
    return createSecureResponse({
      success: true,
      interpretation,
    });
  } catch (error) {
    console.error("Scanner interpretation error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("OpenAI")) {
        return createSecureErrorResponse(
          "AI service temporarily unavailable. Please try again.",
          503
        );
      }
    }

    return createSecureErrorResponse(
      error instanceof Error ? error.message : "Failed to interpret query",
      500
    );
  }
}
