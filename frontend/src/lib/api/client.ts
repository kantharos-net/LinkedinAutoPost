import { GeneratePostContentRequest, GeneratePostContentResponse, LinkedInPostResponse, NormalizedApiError, PublishPostRequest } from "@/src/lib/types";
import { useSettingsStore } from "@/src/lib/stores/settings";
import { DEFAULT_API_BASE_URL } from "@/src/lib/utils/runtime";

const RETRY_STATUSES = new Set([429, 502, 503, 504]);
const MAX_RETRIES = 3;

function getBaseUrl() {
  return useSettingsStore.getState().settings.apiBaseUrl || DEFAULT_API_BASE_URL;
}

function getAuthHeader() {
  const token = useSettingsStore.getState().settings.apiToken;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function normalizeErrorResponse(response: Response): Promise<NormalizedApiError> {
  const requestId = response.headers.get("x-request-id");
  let details: unknown;
  let message = response.statusText || "Request failed";
  try {
    const body = await response.clone().json();
    details = body;
    if (typeof body === "string") {
      message = body;
    } else if (body?.error) {
      if (typeof body.error === "string") {
        message = body.error;
      } else if (typeof body.error?.message === "string") {
        message = body.error.message;
      }
    } else if (typeof body?.message === "string") {
      message = body.message;
    }
  } catch {
    try {
      const text = await response.clone().text();
      if (text) {
        message = text;
        details = text;
      }
    } catch (err) {
      details = err;
    }
  }
  return {
    message,
    status: response.status,
    requestId,
    details
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers
  } as Record<string, string>;

  let attempt = 0;
  let lastError: NormalizedApiError | null = null;

  while (attempt <= MAX_RETRIES) {
    const response = await fetch(url, { ...options, headers });
    if (response.ok) {
      return (await parseResponse(response)) as T;
    }

    if (!RETRY_STATUSES.has(response.status) || attempt === MAX_RETRIES) {
      throw await normalizeErrorResponse(response);
    }

    lastError = await normalizeErrorResponse(response);
    const backoff = Math.min(1000 * 2 ** attempt + Math.random() * 200, 5000);
    await wait(backoff);
    attempt += 1;
  }

  throw lastError ?? ({ message: "Unknown error" } as NormalizedApiError);
}

export const apiClient = {
  health: () => request<string>("/"),
  generatePostContent: (body: GeneratePostContentRequest) =>
    request<GeneratePostContentResponse>("/makePostContent", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  publishPost: (body: PublishPostRequest) =>
    request<LinkedInPostResponse>("/postPost", {
      method: "POST",
      body: JSON.stringify(body)
    })
};

export const queryKeys = {
  models: ["models"] as const,
  channels: ["channels"] as const,
  jobs: (filters: Record<string, unknown>) => ["jobs", filters] as const,
  history: (filters: Record<string, unknown>) => ["history", filters] as const,
  post: (id: string) => ["post", id] as const
};

export type ApiClient = typeof apiClient;

export function createSseStream(path: string, onMessage: (event: MessageEvent) => void) {
  if (typeof window === "undefined") return null;
  const baseUrl = getBaseUrl();
  try {
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    const source = new EventSource(url, { withCredentials: false });
    source.onmessage = onMessage;
    return source;
  } catch (error) {
    console.warn("Failed to create SSE stream", error);
    return null;
  }
}

export async function safeRequest<T>(promise: Promise<T>) {
  try {
    return await promise;
  } catch (error) {
    throw error;
  }
}
