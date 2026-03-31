import { describe, it, expect } from "vitest";
import { composerSchema } from "@/src/lib/schemas/composer";

describe("composerSchema", () => {
  it("accepts valid input with description only", () => {
    const result = composerSchema.safeParse({ description: "An AI workshop" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with description and tags", () => {
    const result = composerSchema.safeParse({ description: "Workshop", tags: "AI, ML" });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = composerSchema.safeParse({ description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = composerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("tags defaults to empty string when omitted", () => {
    const result = composerSchema.safeParse({ description: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toBe("");
    }
  });
});
