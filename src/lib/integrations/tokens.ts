/**
 * The token bundle stored (encrypted) for each connection. Pure helpers, no I/O.
 */

export type TokenSet = {
  accessToken: string;
  refreshToken: string | null;
  /** Epoch seconds; null when the service did not say (treated as valid until rejected). */
  expiresAt: number | null;
  /** Scopes the person actually granted (Google lets them untick some). */
  scopes: string[];
};

/** Refresh this many seconds early so a token never expires mid-request. */
export const REFRESH_MARGIN_SECONDS = 120;

export function needsRefresh(t: TokenSet, now = Date.now()): boolean {
  return t.expiresAt !== null && t.expiresAt - REFRESH_MARGIN_SECONDS <= Math.floor(now / 1000);
}

/** Build a TokenSet from an OAuth token response. Keeps the old refresh token when none is returned. */
export function fromTokenResponse(
  r: { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown; scope?: unknown },
  previous: TokenSet | null = null,
  now = Date.now(),
): TokenSet {
  if (typeof r.access_token !== "string" || !r.access_token) throw new Error("token response has no access_token");
  const expiresIn = typeof r.expires_in === "number" && r.expires_in > 0 ? r.expires_in : null;
  const scopes = typeof r.scope === "string" ? r.scope.split(/[\s,]+/).filter(Boolean) : previous?.scopes ?? [];
  return {
    accessToken: r.access_token,
    refreshToken: typeof r.refresh_token === "string" && r.refresh_token ? r.refresh_token : previous?.refreshToken ?? null,
    expiresAt: expiresIn ? Math.floor(now / 1000) + expiresIn : null,
    scopes,
  };
}

export function serialize(t: TokenSet): string {
  return JSON.stringify(t);
}

export function parse(raw: string | null | undefined): TokenSet | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as TokenSet;
    return typeof t.accessToken === "string" && t.accessToken ? t : null;
  } catch {
    return null;
  }
}

/** Scopes from `required` that were not granted. */
export function missingScopes(granted: string[], required: readonly string[]): string[] {
  const have = new Set(granted);
  return required.filter((s) => !have.has(s));
}
