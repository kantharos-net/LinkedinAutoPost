import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { AppProviders } from "@/src/providers/app-providers";
import { Sidebar } from "@/src/components/layout/sidebar";
import { Header } from "@/src/components/layout/header";
import { BootstrapClient } from "@/src/components/layout/bootstrap";
import { cn } from "@/src/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LinkedIn AutoPoster Dashboard",
  description: "Manage AI-assisted LinkedIn posts and scheduling"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AppProviders>
          <BootstrapClient />
          <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
                <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
              </main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
