'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, TrendingUp, Search, Database, BarChart3, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

const loadingSteps = [
  { icon: Search, text: "Initializing market scanner", duration: 1000 },
  { icon: Database, text: "Fetching stock data from exchanges", duration: 2000 },
  { icon: BarChart3, text: "Analyzing technical indicators", duration: 2500 },
  { icon: TrendingUp, text: "Scoring and ranking stocks", duration: 1500 },
  { icon: CheckCircle2, text: "Finalizing results", duration: 500 },
];

export function ScannerLoadingState() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStepIndex >= loadingSteps.length) return;

    const timer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, currentStepIndex]);
      setCurrentStepIndex(prev => prev + 1);
    }, loadingSteps[currentStepIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  const currentStep = loadingSteps[currentStepIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Loading Header with Progressive States */}
      <Card className="bg-gradient-to-br from-gray-900 via-emerald-950/20 to-gray-900 border-emerald-900/50 shadow-lg shadow-emerald-900/20">
        <CardHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-6 max-w-md">
              {/* Animated Spinner */}
              <div className="relative">
                <Loader2 className="h-16 w-16 mx-auto text-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 bg-emerald-500/20 rounded-full animate-ping" />
                </div>
              </div>

              {/* Main Status */}
              <div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Scanning Markets
                </h3>
                <p className="text-sm text-gray-400">
                  AI-powered analysis in progress
                </p>
              </div>

              {/* Progressive Steps */}
              <div className="space-y-3 text-left">
                {loadingSteps.map((step, index) => {
                  const isCompleted = completedSteps.includes(index);
                  const isCurrent = index === currentStepIndex;
                  const isPending = index > currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-900/30 border border-emerald-800/50'
                          : isCurrent
                          ? 'bg-emerald-900/20 border border-emerald-700/50 animate-pulse'
                          : 'bg-gray-900/30 border border-gray-800/50 opacity-50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-emerald-500/30 text-emerald-400'
                          : 'bg-gray-800 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <StepIcon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isCompleted
                            ? 'text-emerald-300'
                            : isCurrent
                            ? 'text-emerald-400'
                            : 'text-gray-500'
                        }`}>
                          {step.text}
                        </p>
                      </div>
                      {isCurrent && (
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStepIndex) / loadingSteps.length) * 100}%` }}
                />
              </div>

              {/* Tip */}
              <p className="text-xs text-gray-500 italic">
                💡 Tip: You can adjust filters after scan completes to refine results
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Result Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-3">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StockCardSkeleton() {
  return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
