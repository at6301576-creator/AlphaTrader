"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  savePushSubscription,
  removePushSubscription,
} from "@/lib/push-notifications";

export function PushNotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(isPushNotificationSupported());

    // Check if already subscribed
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await getPushSubscription();
      setIsEnabled(subscription !== null);
    } catch (error) {
      console.error("Failed to check subscription status:", error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (checked) {
        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications();

        if (subscription) {
          // Save subscription to server
          const saved = await savePushSubscription(subscription);

          if (saved) {
            setIsEnabled(true);
            toast({
              title: "Notifications Enabled",
              description: "You will now receive push notifications for alerts",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to save notification settings",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Permission Denied",
            description: "Please allow notifications in your browser settings",
            variant: "destructive",
          });
        }
      } else {
        // Unsubscribe from push notifications
        const subscription = await getPushSubscription();

        if (subscription) {
          // Remove from server first
          await removePushSubscription(subscription);

          // Then unsubscribe
          const unsubscribed = await unsubscribeFromPushNotifications();

          if (unsubscribed) {
            setIsEnabled(false);
            toast({
              title: "Notifications Disabled",
              description: "You will no longer receive push notifications",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="text-base font-medium">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-emerald-500/50 transition-colors">
      <div className="flex items-center gap-3">
        <Bell className={`h-5 w-5 ${isEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
        <div>
          <Label htmlFor="push-notifications" className="text-base font-medium cursor-pointer">
            Push Notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Receive real-time alerts even when the app is closed
          </p>
        </div>
      </div>
      <Switch
        id="push-notifications"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
}
