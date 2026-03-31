"use client";

import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = `${API_BASE}/login`;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden px-5 py-16">
      {/* Animated background blobs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        style={{ animation: "pulse 8s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
        style={{ animation: "pulse 10s ease-in-out infinite 2s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex max-w-md flex-col items-center text-center"
      >
        {/* Logo */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Linkedin size={32} className="text-white" />
        </div>

        {/* Wordmark */}
        <h1 className="font-display mb-3 text-4xl font-extrabold tracking-tight text-text-primary">
          PostCraft
        </h1>

        {/* Tagline */}
        <p className="mb-8 text-lg text-text-secondary">
          Describe your event.{" "}
          <span className="font-semibold text-primary">Post in seconds.</span>
        </p>

        {/* Feature pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["AI-generated drafts", "Editable output", "One-click post"].map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          className="w-full max-w-xs gap-2.5 py-3 text-base"
          onClick={handleLogin}
        >
          <Linkedin size={18} />
          Login with LinkedIn
        </Button>

        <p className="mt-4 text-xs text-text-secondary/70">
          We only request permission to post on your behalf.
        </p>
      </motion.div>
    </div>
  );
}
