"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  Shield,
  Target,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

interface OptimizationSuggestion {
  type: "diversification" | "risk" | "performance" | "rebalancing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
}

interface OptimizationData {
  suggestions: OptimizationSuggestion[];
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  cached: boolean;
}

interface OptimizationSuggestionsCardProps {
  period?: string;
}

export function OptimizationSuggestionsCard({ period = "30d" }: OptimizationSuggestionsCardProps) {
  const [data, setData] = useState<OptimizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOptimization = async (useCache = true) => {
    try {
      setRefreshing(!useCache);
      const response = await fetch(`/api/portfolio/optimization?period=${period}`);

      if (response.ok) {
        const optimizationData = await response.json();
        setData(optimizationData);
      }
    } catch (error) {
      console.error("Error fetching optimization:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOptimization(true);
  }, [period]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "diversification":
        return <Target className="h-4 w-4" />;
      case "risk":
        return <Shield className="h-4 w-4" />;
      case "performance":
        return <TrendingUp className="h-4 w-4" />;
      case "rebalancing":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      diversification: "bg-blue-600 hover:bg-blue-700",
      risk: "bg-orange-600 hover:bg-orange-700",
      performance: "bg-emerald-600 hover:bg-emerald-700",
      rebalancing: "bg-purple-600 hover:bg-purple-700",
    };
    return colors[type as keyof typeof colors] || "bg-gray-600 hover:bg-gray-700";
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-600 hover:bg-red-700">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Portfolio Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Portfolio Optimization
            </CardTitle>
            <CardDescription>
              AI-powered suggestions to improve your portfolio
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOptimization(false)}
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
        {/* Overall Score */}
        <div className="p-4 rounded-lg bg-gray-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Portfolio Health Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
                {data.overallScore}/100
              </p>
              <p className="text-sm text-gray-500">{getScoreLabel(data.overallScore)}</p>
            </div>
            <div className="text-right">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - data.overallScore / 100)}`}
                    className={getScoreColor(data.overallScore)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getScoreColor(data.overallScore)}`}>
                    {data.overallScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-700">
            {/* Strengths */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Strengths</span>
              </div>
              <ul className="space-y-1">
                {data.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-gray-400 pl-6">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Areas to Improve</span>
              </div>
              <ul className="space-y-1">
                {data.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-xs text-gray-400 pl-6">
                    • {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {data.suggestions.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Optimization Recommendations ({data.suggestions.length})
            </h4>
            {data.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-gray-800/30 border border-gray-800/50 hover:bg-gray-800/50 transition-colors space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getTypeBadge(suggestion.type)}`}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-200">{suggestion.title}</h5>
                      </div>
                      <p className="text-sm text-gray-400">{suggestion.description}</p>
                    </div>
                  </div>
                  {getPriorityBadge(suggestion.priority)}
                </div>

                {/* Impact */}
                <div className="pl-14">
                  <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
                    <p className="text-xs text-blue-300">
                      <span className="font-semibold">Expected Impact:</span> {suggestion.impact}
                    </p>
                  </div>
                </div>

                {/* Action Items */}
                <div className="pl-14 space-y-2">
                  <p className="text-xs font-medium text-gray-300">Action Items:</p>
                  <ul className="space-y-1">
                    {suggestion.actionItems.map((action, actionIdx) => (
                      <li key={actionIdx} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No optimization suggestions at this time</p>
            <p className="text-sm">Your portfolio is well-optimized!</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
          <p>
            <strong>Note:</strong> These suggestions are AI-generated recommendations for
            educational purposes. Always conduct your own research and consider consulting with a
            financial advisor before making investment decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
