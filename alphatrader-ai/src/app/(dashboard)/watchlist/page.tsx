"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Star, TrendingUp, TrendingDown, Eye, Edit2, X, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Sparkline } from "@/components/Sparkline";

interface WatchlistStock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  note?: string;
  tags?: string[];
}

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  stocks: WatchlistStock[];
}

interface SparklineData {
  [symbol: string]: Array<{ date: string; price: number }>;
}

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  const [newWatchlist, setNewWatchlist] = useState({ name: "", description: "" });
  const [newSymbol, setNewSymbol] = useState("");
  const [sparklines, setSparklines] = useState<SparklineData>({});
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ watchlistId: string; symbol: string; note: string } | null>(null);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      const response = await fetch("/api/watchlist");
      if (response.ok) {
        const data = await response.json();
        // API returns { watchlists: [...] }, so extract the array
        const watchlistsArray = data.watchlists || [];
        setWatchlists(watchlistsArray);

        // Fetch sparklines for all symbols
        const allSymbols = watchlistsArray.flatMap((wl: Watchlist) => wl.stocks.map((s) => s.symbol));
        if (allSymbols.length > 0) {
          fetchSparklines(allSymbols);
        }
      }
    } catch (error) {
      console.error("Error fetching watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSparklines = async (symbols: string[]) => {
    try {
      const response = await fetch("/api/watchlist/sparklines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        setSparklines(data.sparklines || {});
      }
    } catch (error) {
      console.error("Error fetching sparklines:", error);
    }
  };

  const handleCreateWatchlist = async () => {
    if (!newWatchlist.name.trim()) return;

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWatchlist),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setNewWatchlist({ name: "", description: "" });
        fetchWatchlists();
      } else {
        // Log error details for debugging
        const errorData = await response.json();
        console.error("Failed to create watchlist:", response.status, errorData);
        alert(`Failed to create watchlist: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating watchlist:", error);
      alert(`Error creating watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteWatchlist = async (watchlistId: string) => {
    try {
      const response = await fetch(`/api/watchlist/${watchlistId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchWatchlists();
      }
    } catch (error) {
      console.error("Error deleting watchlist:", error);
    }
  };

  const handleAddStock = async () => {
    if (!selectedWatchlist || !newSymbol.trim()) return;

    try {
      const response = await fetch(`/api/watchlist/${selectedWatchlist}/symbols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase() }),
      });

      if (response.ok) {
        setAddStockDialogOpen(false);
        setNewSymbol("");
        setSelectedWatchlist(null);
        fetchWatchlists();
      }
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const handleRemoveStock = async (watchlistId: string, symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist/${watchlistId}/symbols`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        fetchWatchlists();
      }
    } catch (error) {
      console.error("Error removing stock:", error);
    }
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;

    try {
      const response = await fetch(`/api/watchlist/${editingNote.watchlistId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: editingNote.symbol,
          note: editingNote.note,
        }),
      });

      if (response.ok) {
        setNoteDialogOpen(false);
        setEditingNote(null);
        fetchWatchlists();
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async () => {
    if (!editingNote) return;

    try {
      const response = await fetch(`/api/watchlist/${editingNote.watchlistId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: editingNote.symbol,
          note: "",
        }),
      });

      if (response.ok) {
        setNoteDialogOpen(false);
        setEditingNote(null);
        fetchWatchlists();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watchlists</h1>
          <p className="text-muted-foreground mt-1">Track stocks you're interested in</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Create Watchlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Tech Stocks"
                  value={newWatchlist.name}
                  onChange={(e) => setNewWatchlist({ ...newWatchlist, name: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  placeholder="e.g., My favorite tech companies"
                  value={newWatchlist.description}
                  onChange={(e) => setNewWatchlist({ ...newWatchlist, description: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <Button onClick={handleCreateWatchlist} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Watchlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>Add Stock to Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Stock Symbol</Label>
              <Input
                placeholder="e.g., AAPL"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                className="bg-secondary border-border mt-1"
              />
            </div>
            <Button onClick={handleAddStock} className="w-full bg-blue-600 hover:bg-blue-700">
              Add Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>Edit Note for {editingNote?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Note</Label>
              <Textarea
                placeholder="Add your notes about this stock..."
                value={editingNote?.note || ""}
                onChange={(e) =>
                  setEditingNote(
                    editingNote ? { ...editingNote, note: e.target.value } : null
                  )
                }
                className="bg-secondary border-border mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Save Note
              </Button>
              {editingNote?.note && (
                <Button
                  variant="outline"
                  onClick={handleDeleteNote}
                  className="border-border hover:bg-red-900/20 hover:text-red-500"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Watchlists */}
      {watchlists.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No watchlists yet</h3>
            <p className="text-muted-foreground mt-2">Create your first watchlist to start tracking stocks</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {watchlists.map((watchlist) => (
            <Card key={watchlist.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    {watchlist.name}
                  </CardTitle>
                  {watchlist.description && (
                    <p className="text-sm text-muted-foreground mt-1">{watchlist.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWatchlist(watchlist.id);
                      setAddStockDialogOpen(true);
                    }}
                    className="border-border"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWatchlist(watchlist.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {watchlist.stocks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Symbol</th>
                          <th className="text-center py-3 px-4 text-muted-foreground font-medium">7D Trend</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Price</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Change</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Volume</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Market Cap</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {watchlist.stocks.map((stock) => (
                          <tr key={stock.symbol} className="border-b border-border hover:bg-secondary/50">
                            <td className="py-4 px-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/stock/${stock.symbol}`}
                                    className="font-medium hover:text-blue-400 transition-colors"
                                  >
                                    {stock.symbol}
                                  </Link>
                                  {stock.note && (
                                    <StickyNote className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{stock.name}</div>
                                {stock.note && (
                                  <div className="text-xs text-muted-foreground mt-1 italic">
                                    {stock.note.substring(0, 50)}{stock.note.length > 50 ? "..." : ""}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center">
                                {sparklines[stock.symbol] ? (
                                  <Sparkline data={sparklines[stock.symbol]} width={100} height={30} />
                                ) : (
                                  <div className="text-xs text-muted-foreground">Loading...</div>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-4 px-4 font-medium">
                              ${stock.currentPrice.toFixed(2)}
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className={`flex items-center justify-end gap-1 ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {stock.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span>
                                  {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-4 px-4 text-muted-foreground">
                              {formatNumber(stock.volume)}
                            </td>
                            <td className="text-right py-4 px-4 text-muted-foreground">
                              {formatMarketCap(stock.marketCap)}
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNote({
                                      watchlistId: watchlist.id,
                                      symbol: stock.symbol,
                                      note: stock.note || "",
                                    });
                                    setNoteDialogOpen(true);
                                  }}
                                  className="hover:bg-secondary"
                                  title="Add/Edit Note"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Link href={`/stock/${stock.symbol}`}>
                                  <Button variant="ghost" size="sm" className="hover:bg-secondary">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStock(watchlist.id, stock.symbol)}
                                  className="text-muted-foreground hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No stocks in this watchlist yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}
