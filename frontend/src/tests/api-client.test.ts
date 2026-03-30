import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the normalizeError helper and the shape of apiClient — not actual network calls.
import { normalizeError, createApiClient } from "@/src/lib/api/client";

describe("normalizeError", () => {
  it("returns message from Error object", () => {
    expect(normalizeError(new Error("boom"))).toEqual({ message: "boom", status: 0 });
  });

  it("returns fallback for unknown type", () => {
    expect(normalizeError("oops")).toEqual({ message: "Unknown error", status: 0 });
  });

  it("preserves status from ApiError", () => {
    const err = { message: "Unauthorized", status: 401 };
    expect(normalizeError(err)).toEqual({ message: "Unauthorized", status: 401 });
  });
});

describe("createApiClient", () => {
  it("exposes generatePostContent and publishPost methods", () => {
    const client = createApiClient("http://localhost:8080", null);
    expect(typeof client.generatePostContent).toBe("function");
    expect(typeof client.publishPost).toBe("function");
  });
});
