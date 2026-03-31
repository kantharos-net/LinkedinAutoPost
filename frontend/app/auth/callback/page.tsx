"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Linkedin, AlertCircle } from "lucide-react";
import { Spinner } from "@/src/components/ui/Spinner";
import { Button } from "@/src/components/ui/Button";
import { useAuthStore } from "@/src/lib/stores/auth";
import { createApiClient } from "@/src/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err || !token) {
      setError(err === "no_code" ? "LinkedIn didn't return an authorization code." : "Authentication failed. Please try again.");
      return;
    }

    // Verify token is valid and fetch user name
    const client = createApiClient(API_BASE, token);
    client
      .getMe()
      .then((data) => {
        setAuth(token, data.name);
        router.replace("/compose");
      })
      .catch(() => {
        setError("Could not verify your LinkedIn session. Please try again.");
      });
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-sm flex-col items-center gap-4 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="font-display font-extrabold text-text-primary">Connection failed</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <Button variant="ghost" onClick={() => router.replace("/")}>
            ← Try again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Linkedin size={28} className="text-white" />
      </div>
      <Spinner size={22} />
      <p className="text-sm font-medium text-text-secondary">Connecting your LinkedIn account…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
