"use client";

import { useState, useEffect, useCallback } from "react";
import { VirtualScanResults } from "./VirtualScanResults";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { ScannerFilters, ScanResult } from "@/types/scanner";

interface ProgressiveScanResultsProps {
  filters: ScannerFilters | null;
  onComplete?: (results: ScanResult[]) => void;
  useStreaming?: boolean;
}

export function ProgressiveScanResults({
  filters,
  onComplete,
  useStreaming = false
}: ProgressiveScanResultsProps) {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);

  const runScan = useCallback(async () => {
    if (!filters) return;

    setIsLoading(true);
    setResults([]);
    setProgress(0);

    try {
      if (useStreaming) {
        // Use Server-Sent Events for progressive loading
        const response = await fetch("/api/scanner/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("Stream not available");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "results") {
                  // Progressively add results
                  setResults(prev => [...prev, ...data.data]);
                  setProgress(data.progress);
                  setTotalExpected(data.total);
                } else if (data.type === "complete") {
                  setProgress(100);
                  setTotalExpected(data.totalResults);
                } else if (data.type === "error") {
                  console.error("Scanner error:", data.message);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Standard fetch with single response
        const response = await fetch("/api/scanner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });

        const data = await response.json();
        setResults(data.results || []);
        setProgress(100);
        setTotalExpected(data.results?.length || 0);
      }

      onComplete?.(results);
    } catch (error) {
      console.error("Scan error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, useStreaming, onComplete]);

  useEffect(() => {
    if (filters) {
      runScan();
    }
  }, [filters, runScan]);

  if (isLoading && results.length === 0) {
    return (
      <Card className="bg-card border-border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Scanning market...
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {totalExpected > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Found {results.length} of ~{totalExpected} stocks
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && results.length > 0 && (
        <Card className="bg-card border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Loading more results... {results.length} found
            </span>
            <Progress value={progress} className="w-32" />
          </div>
        </Card>
      )}

      <VirtualScanResults results={results} isLoading={false} />

      {!isLoading && results.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {results.length} results
        </p>
      )}
    </div>
  );
}
