"use client";

import { useEffect } from "react";
import { seedDemoData } from "@/src/lib/stores/posts";

export function useDemoData() {
  useEffect(() => {
    seedDemoData();
  }, []);
}
