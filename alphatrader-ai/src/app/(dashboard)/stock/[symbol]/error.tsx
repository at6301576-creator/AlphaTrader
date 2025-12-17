"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Stock page error:", error);
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/scanner">
          <Button variant="ghost" size="sm" className="hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
        </Link>
      </div>

      <Card className="bg-gray-900 border-red-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-red-400">Failed to Load Stock Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            We couldn't load the stock information. This could be due to:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            <li>Invalid stock symbol</li>
            <li>Network connectivity issues</li>
            <li>API rate limiting</li>
            <li>Temporary service unavailability</li>
          </ul>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-xs font-mono text-red-400 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={reset}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link href="/scanner">
              <Button variant="outline" className="border-gray-700">
                Go to Scanner
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
