/**
 * AI Scanner Interpreter
 * Uses OpenAI to interpret natural language queries and generate scanner configurations
 */

import { getAIService, type AIMessage } from "./index";
import type { ScannerFilters, ScanType, Market } from "@/types/scanner";
import { SECTORS } from "@/types/scanner";

export interface ScannerInterpretation {
  scanType: ScanType;
  filters: Partial<ScannerFilters>;
  scoringWeights?: {
    technical?: number;
    fundamental?: number;
    growth?: number;
    quality?: number;
    valuation?: number;
  };
  explanation: string;
  confidence: "high" | "medium" | "low";
}

const SCANNER_INTERPRETATION_SYSTEM_PROMPT = `You are a stock scanner configuration expert. Your job is to interpret natural language queries and convert them into structured scanner parameters.

Available scan types:
- undervalued: Stocks trading below intrinsic value (low P/E, P/B)
- momentum: Strong price momentum with positive technical signals
- dividend: High-yield dividend stocks
- growth: Strong revenue/earnings growth
- value: Classic value investing (low valuations + solid fundamentals)
- quality: High profitability, low debt, strong financials
- turnaround: Recovery candidates showing improvement
- breakout: Technical breakouts with volume confirmation
- penny_stocks: Low-priced (<$5) with high growth potential

Available markets: US, UK, DE, FR, JP, CN, HK, IN, AU, CA, SA, AE

Available sectors: ${SECTORS.join(", ")}

Available filters:
Price: minPrice, maxPrice
Market Cap (millions): minMarketCap, maxMarketCap
Valuation: minPERatio, maxPERatio, minPBRatio, maxPBRatio
Dividends: minDividendYield, maxDividendYield
Growth: minRevenueGrowth, minEarningsGrowth
Quality: minROE, minROA, maxDebtToEquity
Technical: minRSI, maxRSI, aboveSMA (20/50/200), belowSMA
Shariah: shariahCompliantOnly (boolean)

Examples:
Query: "beaten down tech stocks with bullish RSI reversals"
→ scanType: "turnaround", sectors: ["Technology"], maxPriceChange: (implied), minRSI: 25, maxRSI: 45

Query: "high dividend Shariah compliant stocks in US"
→ scanType: "dividend", markets: ["US"], shariahCompliantOnly: true

Query: "momentum plays above 50-day moving average"
→ scanType: "momentum", aboveSMA: 50, minRSI: 55

Your response MUST be valid JSON with this exact structure:
{
  "scanType": "...",
  "markets": ["..."],
  "sectors": ["..."],
  "filters": {
    "key": value
  },
  "scoringWeights": {
    "technical": 1.5,
    "fundamental": 1.0
  },
  "explanation": "Looking for...",
  "confidence": "high|medium|low"
}

Rules:
- Always return valid JSON
- Use null for unknown values
- Infer reasonable defaults when possible
- Set confidence based on query clarity
- Include explanation of your interpretation
- Scoring weights: higher = more important (default = 1.0)`;

export async function interpretScannerQuery(query: string): Promise<ScannerInterpretation> {
  const aiService = getAIService("openai");

  const messages: AIMessage[] = [
    {
      role: "system",
      content: SCANNER_INTERPRETATION_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `User query: "${query}"\n\nReturn JSON configuration:`,
    },
  ];

  try {
    const response = await aiService.chat(messages, {
      temperature: 0.3, // Lower temperature for more consistent JSON
      maxTokens: 1000,
      model: "gpt-4o-mini",
    });

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonContent = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonContent);

    // Build ScannerFilters object
    const filters: Partial<ScannerFilters> = {
      scanType: parsed.scanType || "value",
      markets: (parsed.markets || ["US"]) as Market[],
      sectors: parsed.sectors || [],
      shariahCompliantOnly: parsed.filters?.shariahCompliantOnly || false,
      ...parsed.filters,
    };

    return {
      scanType: parsed.scanType || "value",
      filters,
      scoringWeights: parsed.scoringWeights,
      explanation: parsed.explanation || "AI interpretation of your query",
      confidence: parsed.confidence || "medium",
    };
  } catch (error) {
    console.error("AI interpretation error:", error);

    // Fallback: simple keyword matching
    return fallbackInterpretation(query);
  }
}

/**
 * Fallback interpretation using simple keyword matching
 * Used when AI fails or is unavailable
 */
function fallbackInterpretation(query: string): ScannerInterpretation {
  const lowerQuery = query.toLowerCase();

  let scanType: ScanType = "value";
  const filters: Partial<ScannerFilters> = {
    markets: ["US"],
    sectors: [],
    shariahCompliantOnly: false,
  };

  // Detect scan type
  if (lowerQuery.includes("momentum") || lowerQuery.includes("strong")) {
    scanType = "momentum";
  } else if (lowerQuery.includes("dividend") || lowerQuery.includes("yield")) {
    scanType = "dividend";
  } else if (lowerQuery.includes("growth") || lowerQuery.includes("growing")) {
    scanType = "growth";
  } else if (lowerQuery.includes("undervalued") || lowerQuery.includes("cheap")) {
    scanType = "undervalued";
  } else if (lowerQuery.includes("turnaround") || lowerQuery.includes("recovery") || lowerQuery.includes("beaten")) {
    scanType = "turnaround";
  } else if (lowerQuery.includes("breakout")) {
    scanType = "breakout";
  } else if (lowerQuery.includes("quality")) {
    scanType = "quality";
  }

  // Detect sectors
  const detectedSectors: string[] = [];
  if (lowerQuery.includes("tech")) detectedSectors.push("Technology");
  if (lowerQuery.includes("health")) detectedSectors.push("Healthcare");
  if (lowerQuery.includes("financ") || lowerQuery.includes("bank")) detectedSectors.push("Financial Services");
  if (lowerQuery.includes("energy") || lowerQuery.includes("oil")) detectedSectors.push("Energy");

  filters.sectors = detectedSectors;

  // Detect Shariah
  if (lowerQuery.includes("shariah") || lowerQuery.includes("islamic") || lowerQuery.includes("halal")) {
    filters.shariahCompliantOnly = true;
  }

  // Detect technical filters
  if (lowerQuery.includes("oversold") || lowerQuery.includes("rsi")) {
    filters.minRSI = 20;
    filters.maxRSI = 35;
  }

  if (lowerQuery.includes("above") && lowerQuery.includes("moving average")) {
    filters.aboveSMA = 50;
  }

  return {
    scanType,
    filters: { ...filters, scanType },
    explanation: `Interpreted as ${scanType} scan${detectedSectors.length > 0 ? ` in ${detectedSectors.join(", ")}` : ""}`,
    confidence: "low",
  };
}

/**
 * Get example queries for user guidance
 */
export const EXAMPLE_QUERIES = [
  "Find beaten-down tech stocks with bullish RSI reversals",
  "High dividend Shariah compliant stocks in US markets",
  "Momentum plays above 50-day moving average",
  "Undervalued healthcare stocks with low P/E ratios",
  "Quality companies with strong fundamentals in Europe",
  "Breakout stocks with volume confirmation",
  "Growth stocks in technology sector with high revenue growth",
  "Value stocks below $50 with P/E under 15",
];
