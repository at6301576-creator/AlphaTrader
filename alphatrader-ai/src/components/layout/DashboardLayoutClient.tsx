"use client";

import { useState, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { AIChatCompanion } from "@/components/chat/AIChatCompanion";

interface DashboardLayoutClientProps {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    id?: string;
  };
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-950 text-white">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar - hidden on desktop, slide-in on mobile */}
        <div
          className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-0 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <Sidebar user={user} onClose={closeMobileMenu} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} onMobileMenuToggle={toggleMobileMenu} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #374151",
            },
          }}
        />

        {/* AI Chat Companion */}
        <AIChatCompanion />
      </div>
    </SessionProvider>
  );
}
