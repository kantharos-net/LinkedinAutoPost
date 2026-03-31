"use client";

import { Linkedin } from "lucide-react";
import { useAuthStore } from "@/src/lib/stores/auth";

export function Nav() {
  const { isAuthenticated, userName } = useAuthStore();
  const authenticated = isAuthenticated();

  return (
    <nav className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-white/80 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Linkedin size={15} className="text-white" />
        </div>
        <span className="font-display text-sm font-extrabold tracking-tight text-text-primary">
          PostCraft
        </span>
      </div>

      {authenticated && (
        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {userName ?? "Connected"}
        </span>
      )}
    </nav>
  );
}
