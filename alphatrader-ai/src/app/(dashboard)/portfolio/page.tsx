"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw, Edit, Sparkles, Loader2, Receipt, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import { PortfolioAnalytics } from "@/components/portfolio/PortfolioAnalytics";

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  previousClose: number;
  value: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector?: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"update" | "add">("update");
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    shares: "",
    avgCost: "",
    purchaseDate: "",
  });
  const [editHolding, setEditHolding] = useState({
    shares: "",
    avgCost: "",
    addShares: "",
    addAvgCost: "",
  });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [soldData, setSoldData] = useState({
    soldPrice: "",
    soldDate: "",
  });
  const [snapshotting, setSnapshotting] = useState(false);

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

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolio");
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const handleAddHolding = async () => {
    if (!newHolding.symbol || !newHolding.shares || !newHolding.avgCost) return;

    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newHolding.symbol.toUpperCase(),
          shares: parseFloat(newHolding.shares),
          avgCost: parseFloat(newHolding.avgCost),
          purchaseDate: newHolding.purchaseDate || null,
        }),
      });

      if (response.ok) {
        setAddDialogOpen(false);
        setNewHolding({ symbol: "", shares: "", avgCost: "", purchaseDate: "" });
        fetchPortfolio();
      }
    } catch (error) {
      console.error("Error adding holding:", error);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    try {
      const response = await fetch(`/api/portfolio/${holdingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPortfolio();
      }
    } catch (error) {
      console.error("Error deleting holding:", error);
    }
  };

  const handleEditHolding = (holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setEditHolding({
      shares: holding.shares.toString(),
      avgCost: holding.avgCost.toString(),
      addShares: "",
      addAvgCost: "",
    });
    setEditMode("update");
    setEditDialogOpen(true);
  };

  const handleUpdateHolding = async () => {
    if (!selectedHolding) return;

    try {
      let body: any;

      if (editMode === "add") {
        // Adding more shares
        if (!editHolding.addShares || !editHolding.addAvgCost) return;
        body = {
          addShares: parseFloat(editHolding.addShares),
          addAvgCost: parseFloat(editHolding.addAvgCost),
        };
      } else {
        // Direct update
        if (!editHolding.shares || !editHolding.avgCost) return;
        body = {
          shares: parseFloat(editHolding.shares),
          avgCost: parseFloat(editHolding.avgCost),
        };
      }

      const response = await fetch(`/api/portfolio/${selectedHolding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setSelectedHolding(null);
        fetchPortfolio();
      }
    } catch (error) {
      console.error("Error updating holding:", error);
    }
  };

  const handleOpenSoldDialog = (holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setSoldData({
      soldPrice: holding.currentPrice.toString(),
      soldDate: new Date().toISOString().split('T')[0],
    });
    setSoldDialogOpen(true);
  };

  const handleMarkAsSold = async () => {
    if (!selectedHolding || !soldData.soldPrice || !soldData.soldDate) return;

    try {
      const response = await fetch(`/api/portfolio/${selectedHolding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soldPrice: parseFloat(soldData.soldPrice),
          soldDate: soldData.soldDate,
        }),
      });

      if (response.ok) {
        setSoldDialogOpen(false);
        setSelectedHolding(null);
        setSoldData({ soldPrice: "", soldDate: "" });
        fetchPortfolio();
      }
    } catch (error) {
      console.error("Error marking as sold:", error);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!portfolio || portfolio.holdings.length === 0) return;

    setAiLoading(true);
    setShowAiInsights(true);

    try {
      const response = await fetch("/api/ai/portfolio-summary", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        setAiSummary("Failed to generate AI summary. Please try again.");
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setAiSummary("An error occurred while generating the summary.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!portfolio || portfolio.holdings.length === 0) return;

    setSnapshotting(true);
    try {
      const response = await fetch("/api/portfolio/snapshot", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Snapshot created successfully! Total Value: $${data.snapshot.totalValue.toLocaleString()}`);
      } else {
        alert("Failed to create snapshot. Please try again.");
      }
    } catch (error) {
      console.error("Error creating snapshot:", error);
      alert("An error occurred while creating the snapshot.");
    } finally {
      setSnapshotting(false);
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
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">Track your investments and performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateSnapshot}
            disabled={snapshotting || !portfolio || portfolio.holdings.length === 0}
            className="border-border"
          >
            <Camera className={`h-4 w-4 mr-2 ${snapshotting ? "animate-pulse" : ""}`} />
            Snapshot
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>Add New Holding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Stock Symbol</Label>
                  <Input
                    placeholder="e.g., AAPL"
                    value={newHolding.symbol}
                    onChange={(e) =>
                      setNewHolding({ ...newHolding, symbol: e.target.value.toUpperCase() })
                    }
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label>Number of Shares</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={newHolding.shares}
                    onChange={(e) => setNewHolding({ ...newHolding, shares: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label>Average Cost per Share</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.00"
                    value={newHolding.avgCost}
                    onChange={(e) => setNewHolding({ ...newHolding, avgCost: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label>Purchase Date (optional)</Label>
                  <Input
                    type="date"
                    value={newHolding.purchaseDate}
                    onChange={(e) => setNewHolding({ ...newHolding, purchaseDate: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <Button
                  onClick={handleAddHolding}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add to Portfolio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {portfolio && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cost basis: ${portfolio.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
              {portfolio.totalGain >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio.totalGain >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolio.totalGain >= 0 ? "+" : ""}${portfolio.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className={`text-xs mt-1 ${portfolio.totalGainPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolio.totalGainPercent >= 0 ? "+" : ""}{portfolio.totalGainPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Change</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio.dayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolio.dayChange >= 0 ? "+" : ""}${portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className={`text-xs mt-1 ${portfolio.dayChangePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolio.dayChangePercent >= 0 ? "+" : ""}{portfolio.dayChangePercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Stocks in portfolio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="holdings" className="data-[state=active]:bg-accent">
            Holdings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-accent">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-6">
          {/* AI Insights */}
          {portfolio && portfolio.holdings.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI Portfolio Insights
                </CardTitle>
                <Button
                  onClick={handleGenerateAiSummary}
                  disabled={aiLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {aiLoading ? (
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
              {showAiInsights && (
                <CardContent>
                  {aiLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : aiSummary ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="text-muted-foreground leading-relaxed">
                        {formatAIContent(aiSummary).split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < formatAIContent(aiSummary).split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              )}
            </Card>
          )}

          {/* Holdings Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio && portfolio.holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Symbol</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Shares</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Avg Cost</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Current Price</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Value</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Gain/Loss</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Day Change</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((holding) => (
                    <tr key={holding.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-4 px-4">
                        <div>
                          <Link
                            href={`/stock/${holding.symbol}`}
                            className="font-medium hover:text-blue-400 transition-colors"
                          >
                            {holding.symbol}
                          </Link>
                          <div className="text-sm text-muted-foreground">{holding.name}</div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">{holding.shares}</td>
                      <td className="text-right py-4 px-4">${holding.avgCost.toFixed(2)}</td>
                      <td className="text-right py-4 px-4">${holding.currentPrice.toFixed(2)}</td>
                      <td className="text-right py-4 px-4">${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-right py-4 px-4">
                        <div className={holding.gain >= 0 ? "text-green-500" : "text-red-500"}>
                          {holding.gain >= 0 ? "+" : ""}${holding.gain.toFixed(2)}
                        </div>
                        <div className={`text-sm ${holding.gainPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {holding.gainPercent >= 0 ? "+" : ""}{holding.gainPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className={holding.dayChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {holding.dayChange >= 0 ? "+" : ""}${holding.dayChange.toFixed(2)}
                        </div>
                        <div className={`text-sm ${holding.dayChangePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {holding.dayChangePercent >= 0 ? "+" : ""}{holding.dayChangePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditHolding(holding)}
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSoldDialog(holding)}
                            className="text-green-500 hover:text-green-400 hover:bg-green-900/20"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHolding(holding.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No holdings yet</h3>
              <p className="text-muted-foreground mt-2">Add your first stock to start tracking your portfolio</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PortfolioAnalytics />
        </TabsContent>
      </Tabs>

      {/* Edit Holding Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedHolding?.symbol} Position
            </DialogTitle>
          </DialogHeader>
          <Tabs value={editMode} onValueChange={(v) => setEditMode(v as "update" | "add")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="update" className="data-[state=active]:bg-accent">
                Update Position
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-accent">
                Add More Shares
              </TabsTrigger>
            </TabsList>
            <TabsContent value="update" className="space-y-4 pt-4">
              <div>
                <Label>Number of Shares</Label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={editHolding.shares}
                  onChange={(e) => setEditHolding({ ...editHolding, shares: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label>Average Cost per Share</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150.00"
                  value={editHolding.avgCost}
                  onChange={(e) => setEditHolding({ ...editHolding, avgCost: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <Button
                onClick={handleUpdateHolding}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Update Position
              </Button>
            </TabsContent>
            <TabsContent value="add" className="space-y-4 pt-4">
              <div className="bg-secondary p-3 rounded mb-4">
                <div className="text-muted-foreground text-sm">Current Position</div>
                <div>
                  {selectedHolding?.shares} shares @ ${selectedHolding?.avgCost.toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Additional Shares</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={editHolding.addShares}
                  onChange={(e) => setEditHolding({ ...editHolding, addShares: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div>
                <Label>Purchase Price per Share</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 160.00"
                  value={editHolding.addAvgCost}
                  onChange={(e) => setEditHolding({ ...editHolding, addAvgCost: e.target.value })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              {editHolding.addShares && editHolding.addAvgCost && selectedHolding && (
                <div className="bg-secondary p-3 rounded">
                  <div className="text-muted-foreground text-sm mb-2">New Average Cost</div>
                  <div className="font-semibold">
                    {(() => {
                      const addShares = parseFloat(editHolding.addShares);
                      const addCost = parseFloat(editHolding.addAvgCost);
                      const totalShares = selectedHolding.shares + addShares;
                      const totalCost = (selectedHolding.shares * selectedHolding.avgCost) + (addShares * addCost);
                      const newAvgCost = totalCost / totalShares;
                      return `${totalShares} shares @ $${newAvgCost.toFixed(2)}`;
                    })()}
                  </div>
                </div>
              )}
              <Button
                onClick={handleUpdateHolding}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Add Shares
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Mark as Sold Dialog */}
      <Dialog open={soldDialogOpen} onOpenChange={setSoldDialogOpen}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>
              Mark {selectedHolding?.symbol} as Sold
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-secondary p-3 rounded">
              <div className="text-muted-foreground text-sm">Current Position</div>
              <div>
                {selectedHolding?.shares} shares @ ${selectedHolding?.avgCost.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Cost Basis: ${selectedHolding?.costBasis.toLocaleString()}
              </div>
            </div>

            <div>
              <Label>Sold Price per Share</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 175.00"
                value={soldData.soldPrice}
                onChange={(e) => setSoldData({ ...soldData, soldPrice: e.target.value })}
                className="bg-secondary border-border mt-1"
              />
            </div>

            <div>
              <Label>Sold Date</Label>
              <Input
                type="date"
                value={soldData.soldDate}
                onChange={(e) => setSoldData({ ...soldData, soldDate: e.target.value })}
                className="bg-secondary border-border mt-1"
              />
            </div>

            {soldData.soldPrice && selectedHolding && (
              <div className="bg-secondary p-3 rounded">
                <div className="text-muted-foreground text-sm mb-2">Realized Gain/Loss</div>
                {(() => {
                  const soldPrice = parseFloat(soldData.soldPrice);
                  const totalSold = selectedHolding.shares * soldPrice;
                  const gainLoss = totalSold - selectedHolding.costBasis;
                  const gainLossPercent = (gainLoss / selectedHolding.costBasis) * 100;
                  const isGain = gainLoss >= 0;

                  return (
                    <div>
                      <div className={`font-semibold text-lg ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                        {isGain ? '+' : ''}${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                        {isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleMarkAsSold}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Mark as Sold
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
