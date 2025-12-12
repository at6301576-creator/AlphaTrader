"use client";

import { useState } from "react";
import { CreateTechnicalAlertDialog } from "@/components/alerts/CreateTechnicalAlertDialog";
import { TechnicalAlertsList } from "@/components/alerts/TechnicalAlertsList";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

export default function AlertsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAlertChange = () => {
    // Trigger refresh of alerts list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-500" />
              Technical Alerts
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor technical indicators and get notified when conditions are met
            </p>
          </div>
          <CreateTechnicalAlertDialog
            onAlertCreated={handleAlertChange}
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            }
          />
        </div>
      </div>

      {/* Alerts List */}
      <TechnicalAlertsList
        key={refreshKey}
        onAlertUpdated={handleAlertChange}
      />
    </div>
  );
}
