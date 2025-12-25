/**
 * API Route: Scanner Query Interpretation
 * Accepts natural language queries and returns structured scanner configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { interpretScannerQuery } from "@/lib/ai/scanner-interpreter";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InterpretRequest {
  query: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limiting (20 requests per hour per user)
    const rateLimitKey = `scanner-interpret:${userId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 20, 60 * 60); // 20 per hour

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // 3. Parse request body
    const body = (await request.json()) as InterpretRequest;

    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (body.query.length > 500) {
      return NextResponse.json({ error: "Query too long (max 500 characters)" }, { status: 400 });
    }

    // 4. Interpret query using AI
    console.log(`🤖 Interpreting scanner query for user ${userId}: "${body.query}"`);

    const interpretation = await interpretScannerQuery(body.query);

    console.log(`✅ Interpretation complete:`, {
      scanType: interpretation.scanType,
      confidence: interpretation.confidence,
    });

    // 5. Return interpretation
    return NextResponse.json({
      success: true,
      interpretation,
      remaining: rateLimitResult.remaining,
    });
  } catch (error) {
    console.error("Scanner interpretation error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("OpenAI")) {
        return NextResponse.json(
          {
            error: "AI service temporarily unavailable",
            details: error.message,
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to interpret query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
