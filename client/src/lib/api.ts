const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/** Absolute URL for a given API path (used for downloads and links). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  if (MUTATING.has(method)) {
    const csrf = readCookie("svapnora_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "Unable to reach the server. Check your connection.");
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const error = (payload as { error?: { code: string; message: string; details?: unknown } })?.error;
    throw new ApiError(
      res.status,
      error?.code ?? "ERROR",
      error?.message ?? `Request failed (${res.status})`,
      error?.details,
    );
  }

  return payload as T;
}

export async function ensureCsrf(): Promise<string> {
  const data = await apiRequest<{ csrfToken: string }>("/auth/session");
  return data.csrfToken;
}
