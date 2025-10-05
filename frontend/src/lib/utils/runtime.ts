export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window === "undefined" ? "http://localhost:8080" : "");

export function getRuntimeBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  }
  const persisted = window.localStorage.getItem("lap-settings");
  if (!persisted) {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  }
  try {
    const parsed = JSON.parse(persisted) as { state?: { settings?: { apiBaseUrl?: string } } };
    return parsed?.state?.settings?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  } catch (error) {
    console.warn("Failed to parse persisted settings", error);
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  }
}
