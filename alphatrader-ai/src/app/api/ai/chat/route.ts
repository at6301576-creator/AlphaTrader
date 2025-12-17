import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIService, STOCK_ANALYSIS_SYSTEM_PROMPT, type AIMessage } from "@/lib/ai";
import { createSecureErrorResponse, createSecureResponse, rateLimit } from "@/lib/security";
import { z } from "zod";
import { validateInput } from "@/lib/security";

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(10000),
  })).min(1),
  provider: z.enum(["openai", "ollama", "auto"]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return createSecureErrorResponse("Unauthorized", 401);
  }

  // Rate limiting: 20 AI requests per hour per user
  const rateLimitResult = rateLimit(`ai-chat:${session.user.id}`, {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  });

  if (!rateLimitResult.success) {
    return createSecureErrorResponse(
      "Too many AI requests. Please try again later.",
      429
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validateInput(ChatRequestSchema, body);
    if (!validation.success) {
      return createSecureErrorResponse((validation as any).error, 400);
    }

    const { messages, provider } = validation.data;

    const aiService = getAIService(provider || "auto");

    // Add system prompt if not present
    const fullMessages: AIMessage[] = [
      { role: "system", content: STOCK_ANALYSIS_SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await aiService.chat(fullMessages);

    return createSecureResponse({
      content: response.content,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return createSecureErrorResponse(
      error instanceof Error ? error.message : "AI service error",
      500
    );
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return createSecureErrorResponse("Unauthorized", 401);
  }

  try {
    const aiService = getAIService();
    const providers = await aiService.getAvailableProviders();

    return createSecureResponse({ providers });
  } catch (error) {
    console.error("Error checking AI providers:", error);
    return createSecureResponse({ providers: [] });
  }
}
