"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Plus,
  Share2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface StockPageActionsProps {
  symbol: string;
  currentPrice: number | null;
}

export function StockPageActions({ symbol, currentPrice }: StockPageActionsProps) {
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

  const handleAddToWatchlist = async () => {
    setAddingToWatchlist(true);
    try {
      // First, get or create a default watchlist
      const watchlistsResponse = await fetch("/api/watchlist");
      let watchlistId: string;

      if (watchlistsResponse.ok) {
        const watchlists = await watchlistsResponse.json();

        if (watchlists.length === 0) {
          // Create a default watchlist
          const createResponse = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "My Watchlist",
              description: "Default watchlist",
            }),
          });

          if (!createResponse.ok) throw new Error("Failed to create watchlist");
          const newWatchlist = await createResponse.json();
          watchlistId = newWatchlist.id;
        } else {
          // Use the first watchlist
          watchlistId = watchlists[0].id;
        }

        // Add stock to watchlist
        const addResponse = await fetch(`/api/watchlist/${watchlistId}/symbols`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: symbol.toUpperCase() }),
        });

        if (!addResponse.ok) {
          const error = await addResponse.json();
          throw new Error(error.error || "Failed to add to watchlist");
        }

        toast.success(`Added ${symbol} to watchlist`);
      }
    } catch (error: any) {
      console.error("Error adding to watchlist:", error);
      toast.error(error.message || "Failed to add to watchlist");
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const handleAddToPortfolio = async () => {
    setAddingToPortfolio(true);
    try {
      const price = currentPrice || 100; // Default price if not available

      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          shares: 1, // Default to 1 share
          avgCost: price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add to portfolio");
      }

      toast.success(`Added 1 share of ${symbol} to portfolio at $${price.toFixed(2)}`);
    } catch (error: any) {
      console.error("Error adding to portfolio:", error);
      toast.error(error.message || "Failed to add to portfolio");
    } finally {
      setAddingToPortfolio(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: `${symbol} Stock Analysis`,
        text: `Check out ${symbol} on AlphaTrader AI`,
        url: url,
      }).catch((error) => {
        console.log("Error sharing:", error);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copied to clipboard!");
      }).catch(() => {
        toast.error("Failed to copy link");
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddToWatchlist}
        disabled={addingToWatchlist}
        className="hover:border-blue-600 hover:bg-blue-900/20 hover:text-blue-400 transition-all duration-300 group"
      >
        {addingToWatchlist ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        )}
        Add to Watchlist
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddToPortfolio}
        disabled={addingToPortfolio}
        className="hover:border-emerald-600 hover:bg-emerald-900/20 hover:text-emerald-400 transition-all duration-300 group"
      >
        {addingToPortfolio ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        )}
        Add to Portfolio
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="hover:bg-gray-800 transition-all duration-300"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
