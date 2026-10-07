/**
 * Which pages need a signed-in user, and where redirects may send people.
 * Pure functions so they can be unit-tested without Next.js or Supabase.
 */

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";
/** Where new accounts start (onboarding, Design Spec §20). */
export const SETUP_PATH = "/dashboard/setup";

/** Pages only signed-in users can open. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Sign-in pages a signed-in user has no reason to see. (/reset-password is not one: it needs a session.) */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => matches(pathname, p));
}

export function isGuestOnlyPath(pathname: string) {
  return GUEST_ONLY_PATHS.some((p) => matches(pathname, p));
}

/**
 * Only same-site paths are allowed as a post-sign-in destination, so a crafted
 * link cannot bounce a user to another website (open redirect).
 */
export function safeNextPath(next: string | null | undefined, fallback = HOME_PATH): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  try {
    // Resolving against a dummy origin must keep the same origin.
    const resolved = new URL(next, "http://x.invalid");
    if (resolved.origin !== "http://x.invalid") return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}

export type RouteDecision = { redirect: string } | null;

/** What the proxy does for a request: send it somewhere else, or let it through (null). */
export function decideRoute(pathname: string, search: string, signedIn: boolean): RouteDecision {
  if (!signedIn && isProtectedPath(pathname)) {
    return { redirect: `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}` };
  }
  if (signedIn && isGuestOnlyPath(pathname)) {
    return { redirect: HOME_PATH };
  }
  return null;
}
