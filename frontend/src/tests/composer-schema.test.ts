import { describe, expect, it } from "vitest";
import { composerDefaultValues, composerSchema } from "@/src/lib/schemas/composer";

describe("composerSchema", () => {
  it("accepts valid payloads", () => {
    const payload = {
      ...composerDefaultValues,
      title: "Launch recap",
      prompt: "We released a new feature and want to thank the community for their support.",
      tags: "launch, community"
    };
    const result = composerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("rejects short prompts", () => {
    const result = composerSchema.safeParse({
      ...composerDefaultValues,
      title: "Hi",
      prompt: "Too short"
    });
    expect(result.success).toBe(false);
  });
});
