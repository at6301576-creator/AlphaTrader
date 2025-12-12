"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

export function DashboardClientWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
