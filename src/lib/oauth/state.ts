import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { IntegrationConfigError, type Provider } from "@/lib/integrations/config";

/**
 * Protection for the round trip to Notion / Google and back (OAuth "state").
 *
 * Before sending the customer away we create a random `state` value and, for
 * Google, a PKCE code verifier. Both go into a short-lived, encrypted,
 * HTTP-only cookie together with who started the flow. On return the callback
 * accepts the code only if the `state` matches the cookie, the cookie is fresh,
 * and the same person is still signed in. This blocks forged and replayed links.
 */

export const STATE_COOKIE = "ntyt_oauth";
export const STATE_TTL_SECONDS = 10 * 60;

export type OAuthState = {
  provider: Provider;
  state: string;
  codeVerifier: string;
  userId: string;
  /** Same-site page to return to afterwards. */
  returnTo: string;
  expiresAt: number; // epoch seconds
};

function key(secret = process.env.OAUTH_STATE_SECRET): Buffer {
  if (!secret || secret.trim().length < 32) throw new IntegrationConfigError(["OAUTH_STATE_SECRET (at least 32 characters)"]);
  return createHash("sha256").update(secret.trim()).digest();
}

const b64url = (buf: Buffer) => buf.toString("base64url");
export const randomToken = (bytes = 32) => b64url(randomBytes(bytes));

/** PKCE (RFC 7636): the verifier stays with us, the S256 challenge goes to the provider. */
export function pkceChallenge(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

export function newState(input: Pick<OAuthState, "provider" | "userId" | "returnTo">, now = Date.now()): OAuthState {
  return { ...input, state: randomToken(), codeVerifier: randomToken(48), expiresAt: Math.floor(now / 1000) + STATE_TTL_SECONDS };
}

/** AES-256-GCM: confidential and tamper-evident. */
export function seal(value: OAuthState, secret?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [b64url(iv), b64url(body), b64url(cipher.getAuthTag())].join(".");
}

export function unseal(sealed: string | undefined, secret?: string): OAuthState | null {
  if (!sealed) return null;
  const parts = sealed.split(".");
  if (parts.length !== 3) return null;
  try {
    const [iv, body, tag] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    return JSON.parse(json) as OAuthState;
  } catch (err) {
    if (err instanceof IntegrationConfigError) throw err;
    return null;
  }
}

export type StateCheck = { ok: true; state: OAuthState } | { ok: false; reason: "missing" | "mismatch" | "expired" | "wrong_user" | "wrong_provider" };

/** Validate the returning request against the sealed cookie. */
export function verifyState(
  sealed: string | undefined,
  input: { provider: Provider; state: string | null; userId: string },
  now = Date.now(),
  secret?: string,
): StateCheck {
  const saved = unseal(sealed, secret);
  if (!saved || !input.state) return { ok: false, reason: "missing" };
  const a = Buffer.from(saved.state);
  const b = Buffer.from(input.state);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "mismatch" };
  if (saved.expiresAt < Math.floor(now / 1000)) return { ok: false, reason: "expired" };
  if (saved.provider !== input.provider) return { ok: false, reason: "wrong_provider" };
  if (saved.userId !== input.userId) return { ok: false, reason: "wrong_user" };
  return { ok: true, state: saved };
}
