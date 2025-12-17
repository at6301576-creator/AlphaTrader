/**
 * News Sentiment Analysis Service
 * Uses AI to analyze news sentiment and provide bullish/bearish signals
 */

import { prisma } from "@/lib/prisma";
import type { NewsItem } from "@/types/stock";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1";

export type Sentiment = "bullish" | "bearish" | "neutral";

export interface SentimentAnalysis {
  sentiment: Sentiment;
  score: number; // -1 (very bearish) to +1 (very bullish)
  confidence: number; // 0 to 1
  reasoning: string;
  keyPoints: string[];
}

export interface NewsWithSentiment extends Omit<NewsItem, 'sentiment' | 'sentimentScore'> {
  sentiment?: Sentiment | "positive" | "negative" | "neutral" | null;
  sentimentScore?: number | null;
  sentimentConfidence?: number;
  sentimentReasoning?: string;
}

/**
 * Analyze sentiment of a single news article using OpenAI
 */
export async function analyzeNewsSentiment(
  newsItem: NewsItem
): Promise<SentimentAnalysis> {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured, returning neutral sentiment");
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0,
      reasoning: "AI sentiment analysis not configured",
      keyPoints: [],
    };
  }

  try {
    const prompt = `Analyze the following stock news article and determine its sentiment (bullish, bearish, or neutral).

Title: ${newsItem.title}
Summary: ${newsItem.summary || "No summary available"}
Source: ${newsItem.source}

Provide your analysis in JSON format with the following structure:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "score": <number between -1 and 1, where -1 is very bearish and 1 is very bullish>,
  "confidence": <number between 0 and 1, where 1 is very confident>,
  "reasoning": "<brief explanation of sentiment>",
  "keyPoints": ["<key point 1>", "<key point 2>", ...]
}

Consider:
- Financial impact mentioned in the article
- Management statements or actions
- Market conditions and competitive landscape
- Regulatory or legal developments
- Earnings, revenue, or growth indicators
- Strategic initiatives or partnerships

Focus on factual information and avoid speculation.`;

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective model for sentiment analysis
        messages: [
          {
            role: "system",
            content:
              "You are a financial news analyst specializing in sentiment analysis. Provide accurate, unbiased analysis based solely on the information provided.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent results
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis: SentimentAnalysis = JSON.parse(content);

    // Validate and normalize the response
    if (!["bullish", "bearish", "neutral"].includes(analysis.sentiment)) {
      analysis.sentiment = "neutral";
    }

    analysis.score = Math.max(-1, Math.min(1, analysis.score));
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

    return analysis;
  } catch (error) {
    console.error("Error analyzing news sentiment:", error);
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0,
      reasoning: "Error analyzing sentiment",
      keyPoints: [],
    };
  }
}

/**
 * Analyze sentiment for multiple news articles
 */
export async function analyzeMultipleNews(
  newsItems: NewsItem[]
): Promise<NewsWithSentiment[]> {
  const results = await Promise.all(
    newsItems.map(async (newsItem) => {
      const analysis = await analyzeNewsSentiment(newsItem);
      return {
        ...newsItem,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        sentimentConfidence: analysis.confidence,
        sentimentReasoning: analysis.reasoning,
      };
    })
  );

  return results;
}

/**
 * Calculate overall sentiment for a stock based on recent news
 */
export interface AggregatedSentiment {
  overallSentiment: Sentiment;
  averageScore: number; // -1 to 1
  confidence: number; // 0 to 1
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalArticles: number;
  recentTrend: "improving" | "declining" | "stable";
  sentimentDistribution: {
    bullish: number; // percentage
    bearish: number;
    neutral: number;
  };
}

export async function calculateAggregatedSentiment(
  newsWithSentiment: NewsWithSentiment[]
): Promise<AggregatedSentiment> {
  if (newsWithSentiment.length === 0) {
    return {
      overallSentiment: "neutral",
      averageScore: 0,
      confidence: 0,
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0,
      totalArticles: 0,
      recentTrend: "stable",
      sentimentDistribution: {
        bullish: 0,
        bearish: 0,
        neutral: 0,
      },
    };
  }

  const bullishCount = newsWithSentiment.filter(
    (n) => n.sentiment === "bullish"
  ).length;
  const bearishCount = newsWithSentiment.filter(
    (n) => n.sentiment === "bearish"
  ).length;
  const neutralCount = newsWithSentiment.filter(
    (n) => n.sentiment === "neutral"
  ).length;

  const totalArticles = newsWithSentiment.length;
  const averageScore =
    newsWithSentiment.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) /
    totalArticles;

  const averageConfidence =
    newsWithSentiment.reduce((sum, n) => sum + (n.sentimentConfidence || 0), 0) /
    totalArticles;

  // Determine overall sentiment
  let overallSentiment: Sentiment;
  if (averageScore > 0.15) {
    overallSentiment = "bullish";
  } else if (averageScore < -0.15) {
    overallSentiment = "bearish";
  } else {
    overallSentiment = "neutral";
  }

  // Calculate recent trend (compare first half vs second half of articles)
  let recentTrend: "improving" | "declining" | "stable" = "stable";
  if (totalArticles >= 4) {
    const midpoint = Math.floor(totalArticles / 2);
    const olderArticles = newsWithSentiment.slice(0, midpoint);
    const newerArticles = newsWithSentiment.slice(midpoint);

    const olderAvg =
      olderArticles.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) /
      olderArticles.length;
    const newerAvg =
      newerArticles.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) /
      newerArticles.length;

    if (newerAvg - olderAvg > 0.2) {
      recentTrend = "improving";
    } else if (newerAvg - olderAvg < -0.2) {
      recentTrend = "declining";
    }
  }

  return {
    overallSentiment,
    averageScore,
    confidence: averageConfidence,
    bullishCount,
    bearishCount,
    neutralCount,
    totalArticles,
    recentTrend,
    sentimentDistribution: {
      bullish: (bullishCount / totalArticles) * 100,
      bearish: (bearishCount / totalArticles) * 100,
      neutral: (neutralCount / totalArticles) * 100,
    },
  };
}

/**
 * Cache sentiment analysis in database
 */
export async function cacheSentimentAnalysis(
  newsItem: NewsItem,
  analysis: SentimentAnalysis
): Promise<void> {
  try {
    await prisma.newsCache.upsert({
      where: {
        id: newsItem.id,
      },
      create: {
        id: newsItem.id,
        symbol: newsItem.symbol,
        title: newsItem.title,
        summary: newsItem.summary || "",
        source: newsItem.source,
        url: newsItem.url,
        imageUrl: newsItem.imageUrl || undefined,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        publishedAt: newsItem.publishedAt,
      },
      update: {
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
      },
    });
  } catch (error) {
    console.error("Error caching sentiment:", error);
  }
}

/**
 * Get cached sentiment for news articles
 */
export async function getCachedSentiment(
  symbol: string,
  days: number = 7
): Promise<NewsWithSentiment[]> {
  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const cachedNews = await prisma.newsCache.findMany({
      where: {
        symbol,
        publishedAt: {
          gte: fromDate,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return cachedNews.map((news) => ({
      id: news.id,
      symbol: news.symbol,
      title: news.title,
      summary: news.summary || null,
      source: news.source || null,
      url: news.url || null,
      imageUrl: news.imageUrl || null,
      publishedAt: news.publishedAt,
      sentiment: news.sentiment as Sentiment | undefined,
      sentimentScore: news.sentimentScore || undefined,
      sentimentConfidence: undefined, // Not stored in cache currently
      sentimentReasoning: undefined,
    }));
  } catch (error) {
    console.error("Error getting cached sentiment:", error);
    return [];
  }
}
