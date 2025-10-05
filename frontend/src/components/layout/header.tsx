"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/src/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="px-6 py-4">
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Jump to any section of the console.</SheetDescription>
                </SheetHeader>
                <Sidebar inDrawer />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="text-lg font-semibold">
            LinkedIn AutoPoster
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {pathname === "/" ? "Dashboard" : pathname.replace("/", "").split("/").join(" / ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className={cn("h-5 w-5", theme === "dark" ? "hidden" : "block")} />
              <Moon className={cn("h-5 w-5", theme === "dark" ? "block" : "hidden")} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
