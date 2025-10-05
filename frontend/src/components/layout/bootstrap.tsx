"use client";

import { useDemoData } from "@/src/lib/hooks/use-demo-data";

export function BootstrapClient() {
  useDemoData();
  return null;
}
