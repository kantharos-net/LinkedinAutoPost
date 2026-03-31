import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/src/providers/QueryProvider";
import { Nav } from "@/src/components/layout/Nav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PostCraft — LinkedIn Post Generator",
  description: "Describe your event. Post in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <QueryProvider>
          <Nav />
          <main>{children}</main>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
