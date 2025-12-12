import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIService, STOCK_ANALYSIS_SYSTEM_PROMPT, type AIMessage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages, provider } = body as {
      messages: AIMessage[];
      provider?: "openai" | "ollama" | "auto";
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const aiService = getAIService(provider || "auto");

    // Add system prompt if not present
    const fullMessages: AIMessage[] = [
      { role: "system", content: STOCK_ANALYSIS_SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await aiService.chat(fullMessages);

    return NextResponse.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI service error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aiService = getAIService();
    const providers = await aiService.getAvailableProviders();

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error checking AI providers:", error);
    return NextResponse.json({ providers: [] });
  }
}
