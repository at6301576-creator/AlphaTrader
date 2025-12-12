// AI Service abstraction layer for OpenAI and Ollama

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: "openai" | "ollama";
}

export interface AIProvider {
  chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = "https://api.openai.com/v1";
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const model = options?.model || "gpt-4o-mini";

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      model,
      provider: "openai",
    };
  }
}

// Ollama Provider
export class OllamaProvider implements AIProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    const model = options?.model || "llama3.2";

    // Convert messages to Ollama format
    const prompt = messages
      .map((m) => {
        if (m.role === "system") return `System: ${m.content}`;
        if (m.role === "user") return `User: ${m.content}`;
        return `Assistant: ${m.content}`;
      })
      .join("\n\n");

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: prompt + "\n\nAssistant:",
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Ollama API error");
    }

    const data = await response.json();

    return {
      content: data.response || "",
      model,
      provider: "ollama",
    };
  }
}

// AI Service Manager
export class AIService {
  private openai: OpenAIProvider;
  private ollama: OllamaProvider;
  private preferredProvider: "openai" | "ollama" | "auto";

  constructor(preferredProvider: "openai" | "ollama" | "auto" = "auto") {
    this.openai = new OpenAIProvider();
    this.ollama = new OllamaProvider();
    this.preferredProvider = preferredProvider;
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];

    if (await this.openai.isAvailable()) {
      available.push("openai");
    }

    if (await this.ollama.isAvailable()) {
      available.push("ollama");
    }

    return available;
  }

  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    // Try preferred provider first
    if (this.preferredProvider === "openai" && (await this.openai.isAvailable())) {
      return this.openai.chat(messages, options);
    }

    if (this.preferredProvider === "ollama" && (await this.ollama.isAvailable())) {
      return this.ollama.chat(messages, options);
    }

    // Auto mode: try OpenAI first, then Ollama
    if (await this.openai.isAvailable()) {
      return this.openai.chat(messages, options);
    }

    if (await this.ollama.isAvailable()) {
      return this.ollama.chat(messages, options);
    }

    throw new Error("No AI provider available. Configure OpenAI API key or run Ollama locally.");
  }
}

// Stock analysis prompt templates
export const STOCK_ANALYSIS_SYSTEM_PROMPT = `You are AlphaTrader AI, an expert financial analyst assistant. You help users analyze stocks, understand market trends, and make informed investment decisions.

Key capabilities:
- Technical analysis interpretation (RSI, MACD, moving averages, support/resistance)
- Fundamental analysis (P/E, P/B, revenue growth, margins)
- Shariah compliance screening insights
- Risk assessment and portfolio recommendations

Guidelines:
- Be concise and actionable
- Always mention key risks and limitations
- Never provide specific buy/sell recommendations - instead explain the analysis
- When discussing Shariah compliance, reference AAOIFI standards
- Use clear financial terminology but explain complex concepts

Disclaimer: This is educational analysis, not financial advice. Users should consult licensed financial advisors.`;

export function buildStockAnalysisPrompt(stockData: {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  rsi: number | null;
  macdSignal: string | null;
  trendSignal: string | null;
  isShariahCompliant: boolean | null;
}): string {
  return `Analyze ${stockData.symbol} (${stockData.name}):

Current Price: $${stockData.currentPrice.toFixed(2)} (${stockData.changePercent >= 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}%)

Fundamentals:
- P/E Ratio: ${stockData.peRatio?.toFixed(2) || "N/A"}
- P/B Ratio: ${stockData.pbRatio?.toFixed(2) || "N/A"}
- Dividend Yield: ${stockData.dividendYield?.toFixed(2) || "N/A"}%
- Market Cap: ${stockData.marketCap ? formatMarketCap(stockData.marketCap) : "N/A"}

Technical Indicators:
- RSI (14): ${stockData.rsi?.toFixed(1) || "N/A"}
- MACD Signal: ${stockData.macdSignal || "N/A"}
- Trend: ${stockData.trendSignal || "N/A"}

Shariah Compliance: ${stockData.isShariahCompliant === null ? "Unknown" : stockData.isShariahCompliant ? "Compliant" : "Non-Compliant"}

Please provide a brief analysis covering:
1. Technical outlook and key levels to watch
2. Fundamental health assessment
3. Key risks to consider
4. Overall sentiment (bullish/bearish/neutral)`;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

// Singleton instance
let aiService: AIService | null = null;

export function getAIService(preferredProvider?: "openai" | "ollama" | "auto"): AIService {
  if (!aiService) {
    aiService = new AIService(preferredProvider);
  }
  return aiService;
}
