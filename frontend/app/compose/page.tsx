"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Send } from "lucide-react";

import { Card, CardLabel, CardHint } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { Badge } from "@/src/components/ui/Badge";
import { StepIndicator } from "@/src/components/layout/StepIndicator";
import { SuccessState } from "@/src/components/layout/SuccessState";
import { useAuthStore } from "@/src/lib/stores/auth";
import { createApiClient } from "@/src/lib/api/client";
import { composerSchema, composerDefaults, parseTags, type ComposerValues } from "@/src/lib/schemas/composer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const LINKEDIN_CHAR_LIMIT = 3000;

export default function ComposePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [posted, setPosted] = useState(false);

  // Guard — redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const client = createApiClient(API_BASE, token);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: composerDefaults,
  });

  const generateMutation = useMutation({
    mutationFn: (values: ComposerValues) =>
      client.generatePostContent({
        description: values.description,
        skills: parseTags(values.tags),
      }),
    onSuccess: (content) => {
      setGeneratedContent(content);
      setEditedContent(content);
    },
    onError: () => {
      toast.error("Generation failed", { description: "Could not reach the AI service. Is the backend running?" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => client.publishPost({ text: editedContent }),
    onSuccess: () => {
      setPosted(true);
    },
    onError: () => {
      toast.error("Post failed", { description: "LinkedIn returned an error. Check that your token is still valid." });
    },
  });

  const charCount = editedContent.length;
  const charOverLimit = charCount > LINKEDIN_CHAR_LIMIT;

  const steps = [
    { label: "Connected", status: "done" as const },
    { label: "Describe", status: generatedContent ? "done" as const : "active" as const },
    { label: "Review & Post", status: generatedContent ? "active" as const : "pending" as const },
  ];

  if (posted) {
    return (
      <div className="mx-auto max-w-[680px] px-5 py-10">
        <SuccessState onCreateAnother={() => {
          setPosted(false);
          setGeneratedContent("");
          setEditedContent("");
        }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto max-w-[680px] px-5 py-10"
    >
      <div className="mb-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          Create your post
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Describe your event and let AI write it for LinkedIn.
        </p>
      </div>

      <div className="mt-6">
        <StepIndicator steps={steps} />
      </div>

      {/* Card 1 — Input */}
      <Card className="mb-4">
        <CardLabel>Event description</CardLabel>
        <CardHint>
          Paste what your event is about — topics, audience, date, location.
        </CardHint>
        <Textarea
          {...register("description")}
          placeholder="E.g. We're hosting a free AI workshop for developers on April 15th in Lisbon. 50 seats, networking included..."
          rows={4}
          error={errors.description?.message}
        />

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Skills / tags{" "}
            <span className="text-text-secondary/60">(optional, comma-separated)</span>
          </label>
          <input
            {...register("tags")}
            placeholder="AI, Machine Learning, Python"
            className="w-full rounded-lg border border-muted bg-slate-50 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="primary"
            loading={generateMutation.isPending}
            onClick={handleSubmit((values) => generateMutation.mutate(values))}
          >
            <Sparkles size={15} />
            Generate post
          </Button>
        </div>
      </Card>

      {/* Shimmer bar while generating */}
      <AnimatePresence>
        {generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-blue-100"
          >
            <div className="h-full shimmer rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card 2 — Generated draft */}
      <AnimatePresence>
        {generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="mb-3">
                <Badge dot>LinkedIn preview</Badge>
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={10}
                className={charOverLimit ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}
              />
              <p className={`mt-1.5 text-right text-xs font-medium ${charOverLimit ? "text-red-500" : "text-text-secondary"}`}>
                <span className={charOverLimit ? "text-red-500 font-bold" : "text-primary font-semibold"}>
                  {charCount.toLocaleString()}
                </span>
                {" / "}
                {LINKEDIN_CHAR_LIMIT.toLocaleString()} characters
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="ghost"
                  onClick={() => generateMutation.mutate(getValues())}
                  loading={generateMutation.isPending}
                >
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
                <Button
                  variant="dark"
                  disabled={charOverLimit || publishMutation.isPending || !editedContent.trim()}
                  loading={publishMutation.isPending}
                  onClick={() => publishMutation.mutate()}
                >
                  <Send size={14} />
                  Post to LinkedIn
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
