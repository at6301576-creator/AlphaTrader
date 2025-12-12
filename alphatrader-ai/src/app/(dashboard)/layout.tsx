import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";
import { AIChatCompanion } from "@/components/chat/AIChatCompanion";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardClientWrapper>
      <div className="flex h-screen bg-gray-950 text-white">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar user={session.user} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={session.user} />
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
    </DashboardClientWrapper>
  );
}
