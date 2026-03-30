import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/src/lib/stores/auth";

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({ token: null, userName: null });
});

describe("useAuthStore", () => {
  it("starts with no token", () => {
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("setAuth stores token and userName", () => {
    useAuthStore.getState().setAuth("abc123", "Jane Doe");
    expect(useAuthStore.getState().token).toBe("abc123");
    expect(useAuthStore.getState().userName).toBe("Jane Doe");
  });

  it("clearAuth resets to null", () => {
    useAuthStore.getState().setAuth("abc123", "Jane Doe");
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().userName).toBeNull();
  });

  it("isAuthenticated returns true when token is present", () => {
    useAuthStore.getState().setAuth("tok", "User");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it("isAuthenticated returns false when no token", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
