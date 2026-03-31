"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface SuccessStateProps {
  onCreateAnother: () => void;
}

export function SuccessState({ onCreateAnother }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center gap-5 rounded-card border border-border bg-surface p-10 text-center shadow-card"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 size={36} className="text-emerald-500" />
      </div>
      <div>
        <h2 className="font-display text-xl font-extrabold text-text-primary">
          Posted to LinkedIn!
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your post is live. Great work.
        </p>
      </div>
      <Button variant="ghost" onClick={onCreateAnother}>
        ↺ Create another post
      </Button>
    </motion.div>
  );
}
