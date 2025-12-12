"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
} from "lucide-react";
import type { AnalystData, RecommendationTrend } from "@/lib/api/analyst-ratings";
import { getConsensusRating, calculateUpside } from "@/lib/api/analyst-ratings";

interface AnalystRatingsProps {
  symbol: string;
  currentPrice: number | null;
}

export function AnalystRatings({ symbol, currentPrice }: AnalystRatingsProps) {
  const [data, setData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalystData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/analyst-ratings?symbol=${symbol}`);

        if (!response.ok) {
          throw new Error("Failed to fetch analyst ratings");
        }

        const analystData = await response.json();
        setData(analystData);
      } catch (err) {
        console.error("Error fetching analyst ratings:", err);
        setError("Unable to load analyst ratings");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalystData();
  }, [symbol]);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Analyst Ratings
          </CardTitle>
          <CardDescription>Loading analyst data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            Analyst Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error || "No analyst data available"}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestRecommendation = data.recommendations[0];
  const hasRecommendations = latestRecommendation && (
    latestRecommendation.strongBuy +
    latestRecommendation.buy +
    latestRecommendation.hold +
    latestRecommendation.sell +
    latestRecommendation.strongSell
  ) > 0;

  const consensus = hasRecommendations ? getConsensusRating(latestRecommendation) : null;
  const upside = data.priceTarget && currentPrice
    ? calculateUpside(currentPrice, data.priceTarget.targetMean)
    : null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Strong Buy":
        return "bg-emerald-600 hover:bg-emerald-700";
      case "Buy":
        return "bg-emerald-500 hover:bg-emerald-600";
      case "Hold":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Sell":
        return "bg-red-500 hover:bg-red-600";
      case "Strong Sell":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getActionIcon = (action: string) => {
    if (action === "up" || action === "init") {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    } else if (action === "down") {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-500" />
          Analyst Ratings
        </CardTitle>
        <CardDescription>
          {hasRecommendations || data.priceTarget
            ? "Wall Street analyst recommendations and price targets"
            : "No analyst coverage available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consensus Rating */}
        {consensus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Consensus Rating</span>
              <Badge className={`${getRatingColor(consensus.rating)} text-white border-0`}>
                {consensus.rating}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              Based on {latestRecommendation.strongBuy + latestRecommendation.buy + latestRecommendation.hold + latestRecommendation.sell + latestRecommendation.strongSell} analysts
            </div>
          </div>
        )}

        {/* Price Target */}
        {data.priceTarget && data.priceTarget.targetMean && (
          <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Price Target</span>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  ${data.priceTarget.targetMean.toFixed(2)}
                </div>
                {upside && (
                  <div className={`text-sm flex items-center justify-end gap-1 ${upside.upsidePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {upside.upsidePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {upside.upsidePercent >= 0 ? '+' : ''}{upside.upsidePercent.toFixed(1)}% upside
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Low</div>
                <div className="font-semibold text-gray-300">${data.priceTarget.targetLow.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Median</div>
                <div className="font-semibold text-gray-300">${data.priceTarget.targetMedian.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">High</div>
                <div className="font-semibold text-gray-300">${data.priceTarget.targetHigh.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {data.priceTarget.numberAnalysts} analyst{data.priceTarget.numberAnalysts !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Recommendation Breakdown */}
        {hasRecommendations && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-300">Recommendation Breakdown</div>
            <div className="space-y-2">
              {latestRecommendation.strongBuy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-400">Strong Buy</span>
                  </div>
                  <span className="font-semibold text-emerald-500">{latestRecommendation.strongBuy}</span>
                </div>
              )}
              {latestRecommendation.buy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-gray-400">Buy</span>
                  </div>
                  <span className="font-semibold text-emerald-400">{latestRecommendation.buy}</span>
                </div>
              )}
              {latestRecommendation.hold > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-400">Hold</span>
                  </div>
                  <span className="font-semibold text-yellow-500">{latestRecommendation.hold}</span>
                </div>
              )}
              {latestRecommendation.sell > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-400" />
                    <span className="text-gray-400">Sell</span>
                  </div>
                  <span className="font-semibold text-red-400">{latestRecommendation.sell}</span>
                </div>
              )}
              {latestRecommendation.strongSell > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <span className="text-gray-400">Strong Sell</span>
                  </div>
                  <span className="font-semibold text-red-500">{latestRecommendation.strongSell}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Rating Changes */}
        {data.recentChanges && data.recentChanges.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-300">Recent Rating Changes</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.recentChanges.slice(0, 5).map((change, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between text-xs p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start gap-2 flex-1">
                    {getActionIcon(change.action)}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-300">{change.company}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        {change.fromGrade && (
                          <>
                            <span>{change.fromGrade}</span>
                            <span>→</span>
                          </>
                        )}
                        <span>{change.toGrade}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-right whitespace-nowrap ml-2">
                    {formatDate(change.gradeTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!hasRecommendations && !data.priceTarget && data.recentChanges.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No analyst coverage available for this stock</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
