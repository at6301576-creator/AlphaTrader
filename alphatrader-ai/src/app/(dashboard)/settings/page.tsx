"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  DollarSign,
  Percent,
  Save,
  User,
  Palette,
  Settings as SettingsIcon,
  Loader2,
  Shield,
} from "lucide-react";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";

interface UserSettings {
  name: string;
  email: string;
  riskProfile: string;
  tradingExp: string;
  shariahMode: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User profile settings
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "",
    email: "",
    riskProfile: "moderate",
    tradingExp: "beginner",
    shariahMode: false,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    scanResults: true,
    portfolioUpdates: true,
    newsAlerts: false,
    emailNotifications: false,
  });

  // Trading preferences
  const [preferences, setPreferences] = useState({
    defaultScanType: "undervalued",
    priceThreshold: "5",
    updateFrequency: "realtime",
    defaultCurrency: "USD",
    defaultChartRange: "1mo",
  });

  // Fetch user settings on mount
  useEffect(() => {
    if (session?.user) {
      fetchUserSettings();
    }
  }, [session]);

  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        setUserSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: userSettings }),
      });

      if (response.ok) {
        toast.success("Profile settings saved successfully!");
      } else {
        toast.error("Failed to save profile settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    // Save notification preferences to localStorage for now
    localStorage.setItem("notifications", JSON.stringify(notifications));
    toast.success("Notification preferences saved!");
  };

  const handleSavePreferences = () => {
    // Save trading preferences to localStorage for now
    localStorage.setItem("preferences", JSON.stringify(preferences));
    toast.success("Trading preferences saved!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and trading profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={userSettings.name || ""}
                  onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                  placeholder="Your name"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  disabled
                  className="bg-muted border-border cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="riskProfile">Risk Profile</Label>
                <Select
                  value={userSettings.riskProfile}
                  onValueChange={(value) => setUserSettings({ ...userSettings, riskProfile: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your risk tolerance affects portfolio recommendations and insights
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradingExp">Trading Experience</Label>
                <Select
                  value={userSettings.tradingExp}
                  onValueChange={(value) => setUserSettings({ ...userSettings, tradingExp: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Helps us tailor insights and recommendations to your experience level
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shariah Compliance Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Filter stocks to show only Shariah-compliant options
                  </p>
                </div>
                <Switch
                  checked={userSettings.shariahMode}
                  onCheckedChange={(checked) =>
                    setUserSettings({ ...userSettings, shariahMode: checked })
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/50 transition-all duration-300"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Push Notifications Toggle */}
              <PushNotificationToggle />

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when stocks hit target prices
                  </p>
                </div>
                <Switch
                  checked={notifications.priceAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, priceAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scan Results</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications for new scan results and screener matches
                  </p>
                </div>
                <Switch
                  checked={notifications.scanResults}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, scanResults: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Portfolio Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Daily portfolio performance summaries and snapshots
                  </p>
                </div>
                <Switch
                  checked={notifications.portfolioUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, portfolioUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>News Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Breaking news for stocks in your watchlist and portfolio
                  </p>
                </div>
                <Switch
                  checked={notifications.newsAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, newsAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email (coming soon)
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotifications}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/50 transition-all duration-300"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Trading Preferences
              </CardTitle>
              <CardDescription>
                Configure your default trading and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Scan Type</Label>
                <Select
                  value={preferences.defaultScanType}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, defaultScanType: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="undervalued">Undervalued Stocks</SelectItem>
                    <SelectItem value="momentum">Momentum Plays</SelectItem>
                    <SelectItem value="value">Value Stocks</SelectItem>
                    <SelectItem value="growth">Growth Stocks</SelectItem>
                    <SelectItem value="dividend">Dividend Stocks</SelectItem>
                    <SelectItem value="quality">Quality Stocks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default strategy for market scanner
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Price Alert Threshold (%)
                </Label>
                <Input
                  type="number"
                  value={preferences.priceThreshold}
                  onChange={(e) =>
                    setPreferences({ ...preferences, priceThreshold: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Default percentage change for price alerts
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Data Update Frequency</Label>
                <Select
                  value={preferences.updateFrequency}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, updateFrequency: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="realtime">Real-time (30 seconds)</SelectItem>
                    <SelectItem value="1min">Every Minute</SelectItem>
                    <SelectItem value="5min">Every 5 Minutes</SelectItem>
                    <SelectItem value="15min">Every 15 Minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often to refresh stock prices
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select
                  value={preferences.defaultCurrency}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, defaultCurrency: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Display currency for portfolio values
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Default Chart Range</Label>
                <Select
                  value={preferences.defaultChartRange}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, defaultChartRange: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="5d">5 Days</SelectItem>
                    <SelectItem value="1mo">1 Month</SelectItem>
                    <SelectItem value="3mo">3 Months</SelectItem>
                    <SelectItem value="6mo">6 Months</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                    <SelectItem value="5y">5 Years</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default time range for stock charts
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSavePreferences}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/50 transition-all duration-300"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-border hover:bg-secondary hover:border-emerald-600 hover:text-emerald-400 transition-all duration-300"
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full border-border hover:bg-secondary hover:border-blue-600 hover:text-blue-400 transition-all duration-300"
              >
                Enable Two-Factor Authentication
              </Button>
              <Button
                variant="outline"
                className="w-full border-border hover:bg-secondary hover:border-red-600 hover:text-red-400 transition-all duration-300"
              >
                Sign Out All Devices
              </Button>
              <Separator />
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Password change and two-factor authentication features are coming soon.
                  For now, your account is secured with industry-standard encryption.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
