import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { scanMarket } from "@/services/market-scanner";
import type { ScannerFilters } from "@/types/scanner";
import { rateLimit } from "@/lib/security";

// Streaming scanner with progressive results
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await auth();
        if (!session?.user?.id) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Unauthorized" })}\n\n`));
          controller.close();
          return;
        }

        // Rate limiting
        const rateLimitResult = rateLimit(`scanner:${session.user.id}`, {
          interval: 60 * 60 * 1000,
          maxRequests: 20, // Increased for streaming
        });

        if (!rateLimitResult.success) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Rate limit exceeded" })}\n\n`));
          controller.close();
          return;
        }

        const filters: ScannerFilters = await request.json();

        // Send initial acknowledgment
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start", message: "Scan started" })}\n\n`));

        // Run scan and stream results progressively
        const results = await scanMarket(filters);

        // Stream results in chunks of 10 for progressive loading
        const CHUNK_SIZE = 10;
        for (let i = 0; i < results.length; i += CHUNK_SIZE) {
          const chunk = results.slice(i, i + CHUNK_SIZE);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "results",
              data: chunk,
              progress: Math.min(100, Math.round(((i + CHUNK_SIZE) / results.length) * 100)),
              total: results.length
            })}\n\n`)
          );

          // Allow event loop to process
          await new Promise(resolve => setImmediate(resolve));
        }

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: "complete",
            totalResults: results.length
          })}\n\n`)
        );

        controller.close();
      } catch (error) {
        console.error("Scanner stream error:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: "error",
            message: "Scanner error occurred"
          })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
