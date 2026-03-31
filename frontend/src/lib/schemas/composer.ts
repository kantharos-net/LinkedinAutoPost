import { z } from "zod";

export const composerSchema = z.object({
  description: z.string().min(1, "Description is required"),
  tags: z.string().default(""),
});

export type ComposerValues = z.infer<typeof composerSchema>;

export const composerDefaults: ComposerValues = {
  description: "",
  tags: "",
};

/** Parse comma-separated tags string into a skills array for the API. */
export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
