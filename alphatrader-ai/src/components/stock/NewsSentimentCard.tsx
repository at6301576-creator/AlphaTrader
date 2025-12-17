"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { NewsWithSentiment, AggregatedSentiment } from "@/services/news-sentiment";

interface NewsSentimentCardProps {
  symbol: string;
  days?: number;
}

export function NewsSentimentCard({ symbol, days = 7 }: NewsSentimentCardProps) {
  const [news, setNews] = useState<NewsWithSentiment[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedSentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSentiment = async (useCache = true) => {
    try {
      setRefreshing(!useCache);
      const response = await fetch(
        `/api/news/sentiment?symbol=${symbol}&days=${days}&useCache=${useCache}`
      );

      if (response.ok) {
        const data = await response.json();
        setNews(data.news);
        setAggregated(data.aggregated);
      }
    } catch (error) {
      console.error("Error fetching news sentiment:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSentiment(true);
  }, [symbol, days]);

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case "bullish":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700">Bullish</Badge>
        );
      case "bearish":
        return <Badge className="bg-red-600 hover:bg-red-700">Bearish</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-500" />
            News Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-500" />
              News Sentiment Analysis
            </CardTitle>
            <CardDescription>
              AI-powered analysis of recent news for {symbol}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSentiment(false)}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aggregated Sentiment */}
        {aggregated && aggregated.totalArticles > 0 && (
          <div className="p-4 rounded-lg bg-gray-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSentimentIcon(aggregated.overallSentiment)}
                <div>
                  <p className="text-sm text-gray-400">Overall Sentiment</p>
                  <p className="text-2xl font-bold">
                    {aggregated.overallSentiment.charAt(0).toUpperCase() +
                      aggregated.overallSentiment.slice(1)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Sentiment Score</p>
                <p
                  className={`text-2xl font-bold ${
                    aggregated.averageScore > 0
                      ? "text-emerald-500"
                      : aggregated.averageScore < 0
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {aggregated.averageScore > 0 ? "+" : ""}
                  {aggregated.averageScore.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Distribution</span>
                <span className="text-gray-500">
                  {aggregated.totalArticles} articles analyzed
                </span>
              </div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600"
                  style={{
                    width: `${aggregated.sentimentDistribution.bullish}%`,
                  }}
                />
                <div
                  className="bg-gray-600"
                  style={{
                    width: `${aggregated.sentimentDistribution.neutral}%`,
                  }}
                />
                <div
                  className="bg-red-600"
                  style={{
                    width: `${aggregated.sentimentDistribution.bearish}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="text-emerald-400">
                  {aggregated.bullishCount} Bullish
                </span>
                <span>{aggregated.neutralCount} Neutral</span>
                <span className="text-red-400">
                  {aggregated.bearishCount} Bearish
                </span>
              </div>
            </div>

            {/* Recent Trend */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
              {getTrendIcon(aggregated.recentTrend)}
              <span className="text-sm text-gray-400">
                Recent trend:{" "}
                <span
                  className={`font-medium ${
                    aggregated.recentTrend === "improving"
                      ? "text-emerald-400"
                      : aggregated.recentTrend === "declining"
                      ? "text-red-400"
                      : "text-gray-300"
                  }`}
                >
                  {aggregated.recentTrend}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* No news */}
        {news.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent news available</p>
          </div>
        )}

        {/* News List */}
        {news.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">
              Recent Articles
            </h4>
            {news.map((article) => (
              <div
                key={article.id}
                className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors border border-gray-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-200 hover:text-blue-400 transition-colors line-clamp-2 flex-1"
                      >
                        {article.title}
                      </a>
                      <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5" />
                    </div>
                    {article.summary && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getSentimentBadge(article.sentiment)}
                    {article.sentimentScore !== undefined && (
                      <span
                        className={`text-xs font-medium ${
                          article.sentimentScore > 0
                            ? "text-emerald-400"
                            : article.sentimentScore < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {article.sentimentScore > 0 ? "+" : ""}
                        {article.sentimentScore.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
