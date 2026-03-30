export interface ApiError {
  message: string;
  status: number;
}

export function normalizeError(err: unknown): ApiError {
  if (err && typeof err === "object" && "message" in err && "status" in err) {
    return { message: String((err as ApiError).message), status: Number((err as ApiError).status) };
  }
  if (err instanceof Error) {
    return { message: err.message, status: 0 };
  }
  return { message: "Unknown error", status: 0 };
}

async function apiFetch(
  baseUrl: string,
  token: string | null,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw { message: text || `HTTP ${res.status}`, status: res.status } as ApiError;
  }
  return res;
}

export interface ApiClient {
  generatePostContent: (payload: { description: string; skills: string[] }) => Promise<string>;
  publishPost: (payload: { text: string }) => Promise<unknown>;
  getMe: () => Promise<{ authenticated: boolean; name: string }>;
}

export function createApiClient(baseUrl: string, token: string | null): ApiClient {
  return {
    async generatePostContent(payload) {
      const res = await apiFetch(baseUrl, token, "/makePostContent", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.text();
    },

    async publishPost(payload) {
      const res = await apiFetch(baseUrl, token, "/postPost", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },

    async getMe() {
      const res = await apiFetch(baseUrl, token, "/me");
      return res.json();
    },
  };
}
