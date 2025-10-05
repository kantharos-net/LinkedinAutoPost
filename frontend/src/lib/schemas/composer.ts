import { z } from "zod";

export const composerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  tags: z.string().optional(),
  channel: z.string().min(1, "Select a channel"),
  model: z.string(),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().min(64).max(2048),
  prompt: z.string().min(20, "Provide enough context for GPT"),
  systemPrompt: z.string().optional(),
  autoEnhance: z.boolean().default(true),
  content: z.string().optional(),
  scheduledFor: z.string().optional()
});

export type ComposerSchema = typeof composerSchema;

export const composerDefaultValues = {
  title: "",
  tags: "",
  channel: "linkedin",
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 512,
  prompt: "",
  systemPrompt: "",
  autoEnhance: true,
  content: "",
  scheduledFor: ""
};
