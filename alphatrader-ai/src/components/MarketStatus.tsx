"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface MarketStatusData {
  isOpen: boolean;
  market: string;
  nextOpen?: Date;
  nextClose?: Date;
}

export function MarketStatus() {
  const [status, setStatus] = useState<MarketStatusData | null>(null);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;

      // US Market hours: 9:30 AM - 4:00 PM ET (Mon-Fri)
      // Convert to minutes: 9:30 = 570, 16:00 = 960
      const marketOpen = 570; // 9:30 AM
      const marketClose = 960; // 4:00 PM

      const isWeekday = day >= 1 && day <= 5;
      const isDuringMarketHours = currentTime >= marketOpen && currentTime < marketClose;
      const isOpen = isWeekday && isDuringMarketHours;

      setStatus({
        isOpen,
        market: "US Markets",
      });
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            status.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-xs font-medium">
          {status.market} {status.isOpen ? "Open" : "Closed"}
        </span>
      </div>
    </div>
  );
}
