"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface AIAnalysisProps {
  symbol: string;
}

export function AIAnalysis({ symbol }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Function to clean and format AI content (remove markdown)
  const formatAIContent = (content: string): string => {
    return content
      // Remove markdown headers (##, ###, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold markers (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic markers (*text* or _text_)
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove code block markers
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, ''))
      .replace(/`([^`]+)`/g, '$1')
      // Clean up bullet points - convert to simple bullets
      .replace(/^\s*[\*\-\+]\s+/gm, '• ')
      // Clean up numbered lists
      .replace(/^\s*\d+\.\s+/gm, (match) => match.replace(/\d+\./, '•'))
      // Remove excessive newlines (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  };

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    setShowAnalysis(true);

    try {
      const response = await fetch("/api/ai/stock-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        setAnalysis("Failed to generate AI analysis. Please try again.");
      }
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAnalysis("An error occurred while generating the analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Stock Analysis
        </CardTitle>
        <Button
          onClick={handleGenerateAnalysis}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Analysis
            </>
          )}
        </Button>
      </CardHeader>
      {showAnalysis && (
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : analysis ? (
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed">
                {formatAIContent(analysis).split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < formatAIContent(analysis).split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
