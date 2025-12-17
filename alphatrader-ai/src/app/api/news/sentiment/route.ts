import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyNews } from "@/lib/api/finnhub";
import {
  analyzeMultipleNews,
  calculateAggregatedSentiment,
  cacheSentimentAnalysis,
  getCachedSentiment,
} from "@/services/news-sentiment";

/**
 * GET /api/news/sentiment?symbol=AAPL&days=7&useCache=true
 * Analyze sentiment for company news
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const days = parseInt(searchParams.get("days") || "7");
    const useCache = searchParams.get("useCache") === "true";

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Check cache first if requested
    if (useCache) {
      const cachedNews = await getCachedSentiment(symbol, days);
      if (cachedNews.length > 0) {
        const aggregated = await calculateAggregatedSentiment(cachedNews);
        return NextResponse.json({
          news: cachedNews,
          aggregated,
          cached: true,
        });
      }
    }

    // Fetch fresh news from Finnhub
    const toDate = new Date().toISOString().split("T")[0];
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const news = await getCompanyNews(symbol, fromDate, toDate);

    if (news.length === 0) {
      return NextResponse.json({
        news: [],
        aggregated: {
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
        },
        cached: false,
      });
    }

    // Analyze sentiment (limit to 10 articles to control API costs)
    const newsToAnalyze = news.slice(0, 10);
    const newsWithSentiment = await analyzeMultipleNews(newsToAnalyze);

    // Cache the results
    await Promise.all(
      newsWithSentiment.map((newsItem) => {
        if (newsItem.sentiment && newsItem.sentimentScore !== undefined) {
          // Convert sentiment to Sentiment type
          const sentiment = newsItem.sentiment === "positive" ? "bullish" :
                          newsItem.sentiment === "negative" ? "bearish" : "neutral";
          return cacheSentimentAnalysis(newsItem as any, {
            sentiment: sentiment as any,
            score: newsItem.sentimentScore,
            confidence: newsItem.sentimentConfidence || 0.5,
            reasoning: newsItem.sentimentReasoning || "",
            keyPoints: [],
          });
        }
        return Promise.resolve();
      })
    );

    // Calculate aggregated sentiment
    const aggregated = await calculateAggregatedSentiment(newsWithSentiment);

    return NextResponse.json({
      news: newsWithSentiment,
      aggregated,
      cached: false,
    });
  } catch (error) {
    console.error("Error analyzing news sentiment:", error);
    return NextResponse.json(
      { error: "Failed to analyze news sentiment" },
      { status: 500 }
    );
  }
}
