"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always set dark mode
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");

    // Set body background for dark mode
    document.body.style.backgroundColor = "#030712"; // gray-950
    document.body.style.color = "white";
  }, []);

  return <>{children}</>;
}
