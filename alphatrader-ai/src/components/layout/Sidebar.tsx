"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  TrendingUp,
  Radar,
  BarChart3,
  Wallet,
  Eye,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Filter,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: BarChart3 },
  { title: "Market Scanner", href: "/scanner", icon: Radar },
  { title: "Portfolio", href: "/portfolio", icon: Wallet },
  { title: "Analysis", href: "/analysis", icon: LineChart },
  { title: "Watchlist", href: "/watchlist", icon: Eye },
];

const secondaryNavItems: NavItem[] = [
  { title: "Alerts", href: "/alerts", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Fetch triggered alerts count
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const response = await fetch("/api/alerts");
        if (response.ok) {
          const data = await response.json();
          // Count triggered alerts that are still active and notify in-app
          const triggeredCount = data.filter(
            (alert: any) => alert.triggeredAt && alert.isActive && alert.notifyInApp
          ).length;
          setUnreadAlerts(triggeredCount);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlertCount();
    // Refresh alerts count every 30 seconds
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = () => (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-emerald-500 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold text-sidebar-foreground">AlphaTrader</span>
          )}
        </Link>
      </div>

      {/* Collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <ScrollArea className="flex-1 py-4">
        {/* Main navigation */}
        <div className="px-3 space-y-1">
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
                  pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        {/* Secondary navigation */}
        <div className="px-3 space-y-1">
          {secondaryNavItems.map((item) => {
            const badge = item.title === "Alerts" ? unreadAlerts : item.badge;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent relative",
                    pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                  {badge && badge > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      {badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* User info */}
        {!collapsed && (
          <div className="px-2 py-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        {/* Sign out */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Hamburger menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-sidebar border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold text-sidebar-foreground">AlphaTrader</span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div onClick={() => setMobileOpen(false)}>
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Regular sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>
    </>
  );
}
