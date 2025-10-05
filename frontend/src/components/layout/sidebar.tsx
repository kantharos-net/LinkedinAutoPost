"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { CalendarClock, Cog, History, LayoutDashboard, PenSquare, Server } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/composer", label: "Composer", icon: PenSquare },
  { href: "/scheduler", label: "Scheduler", icon: CalendarClock },
  { href: "/jobs", label: "Jobs & Logs", icon: Server },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Cog }
];

interface SidebarProps {
  inDrawer?: boolean;
}

export function Sidebar({ inDrawer = false }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r bg-card/50 p-4",
        inDrawer ? "block" : "hidden md:block"
      )}
    >
      <div className="mb-6 font-semibold text-muted-foreground">Navigation</div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
