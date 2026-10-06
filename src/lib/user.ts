/**
 * The signed-in person as the app shell shows them: name, email and initials.
 * Built from the verified session claims. Account records arrive in Phase 2.
 */

export type DisplayUser = { name: string; email: string; initials: string };

type Claims = { email?: unknown; user_metadata?: unknown } | null | undefined;

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function toDisplayUser(claims: Claims): DisplayUser {
  const meta = (claims?.user_metadata && typeof claims.user_metadata === "object" ? claims.user_metadata : {}) as Record<string, unknown>;
  const email = str(claims?.email);
  // full_name: our sign-up form and Google; name: some other providers.
  const name = str(meta.full_name) || str(meta.name) || email.split("@")[0];
  if (!name) return { name: "Your account", email, initials: "?" };
  const words = name.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 2)).toUpperCase();
  return { name, email, initials };
}
