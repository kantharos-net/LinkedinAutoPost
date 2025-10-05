import { describe, expect, it } from "vitest";
import { normalizeErrorResponse } from "@/src/lib/api/client";

describe("normalizeErrorResponse", () => {
  it("extracts message from error envelope", async () => {
    const body = { error: { message: "Invalid payload" } };
    const response = new Response(JSON.stringify(body), {
      status: 400,
      headers: { "content-type": "application/json", "x-request-id": "abc-123" }
    });
    const normalized = await normalizeErrorResponse(response);
    expect(normalized).toMatchObject({
      message: "Invalid payload",
      status: 400,
      requestId: "abc-123"
    });
  });

  it("falls back to text when JSON parsing fails", async () => {
    const response = new Response("Something went wrong", {
      status: 500,
      headers: { "content-type": "text/plain" }
    });
    const normalized = await normalizeErrorResponse(response);
    expect(normalized.message).toContain("Something went wrong");
    expect(normalized.status).toBe(500);
  });
});
