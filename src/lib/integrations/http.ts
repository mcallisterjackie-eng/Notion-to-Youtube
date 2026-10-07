import "server-only";

/**
 * Calls to Notion and Google, with a timeout and a plain classification of
 * failures. The classification drives what the customer sees (Design Spec §16)
 * and, later, retry rules (§17). Raw responses are kept for logs only.
 */

export type FailureKind =
  | "auth" // token rejected: reconnect needed
  | "permission" // signed in, but not allowed (scope missing, access removed)
  | "not_found"
  | "rate_limited"
  | "temporary" // 5xx from the service
  | "network" // could not reach the service / timed out
  | "bad_request"
  | "unknown";

export class ProviderError extends Error {
  constructor(
    public readonly service: "notion" | "google",
    public readonly kind: FailureKind,
    public readonly status: number | null,
    /** Provider's own error code, e.g. "invalid_grant", "unauthorized". */
    public readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function classifyStatus(status: number, code: string | null): FailureKind {
  if (code === "invalid_grant" || code === "unauthorized" || code === "invalid_token" || status === 401) return "auth";
  if (status === 403) return code === "rateLimitExceeded" || code === "userRateLimitExceeded" ? "rate_limited" : "permission";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "temporary";
  if (status === 400) return "bad_request";
  return "unknown";
}

/** Pull a provider error code out of Notion / Google / OAuth error bodies. */
export function errorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") return b.error; // OAuth: {"error":"invalid_grant"}
  if (typeof b.code === "string") return b.code; // Notion: {"code":"unauthorized"}
  const g = b.error as { errors?: { reason?: string }[]; status?: string } | undefined; // Google APIs
  if (g && typeof g === "object") return g.errors?.[0]?.reason ?? g.status ?? null;
  return null;
}

export async function requestJson<T>(
  service: "notion" | "google",
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 15_000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch (err) {
    throw new ProviderError(service, "network", null, null, err instanceof Error ? err.message : "network error");
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const code = errorCode(body);
    throw new ProviderError(service, classifyStatus(res.status, code), res.status, code, `${service} ${res.status} ${code ?? ""}`.trim());
  }
  return body as T;
}
