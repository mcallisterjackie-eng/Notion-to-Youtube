import "server-only";
import { endpoints, GOOGLE_SCOPES, googleClient, redirectUri } from "./config";
import { ProviderError, requestJson } from "./http";
import { fromTokenResponse, type TokenSet } from "./tokens";
import { pkceChallenge } from "@/lib/oauth/state";

/**
 * Google OAuth for the two Google connections (YouTube, Google Drive). Each is a
 * separate consent with its own token, so they can be different Google accounts.
 * This is separate from "Sign in with Google", which only asks for basic profile.
 */

export type GoogleProvider = "youtube" | "google_drive";

export function googleAuthorizeUrl(provider: GoogleProvider, state: string, codeVerifier: string): string {
  const url = new URL(endpoints.googleAuthorize());
  url.searchParams.set("client_id", googleClient().clientId);
  url.searchParams.set("redirect_uri", redirectUri(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES[provider].join(" "));
  url.searchParams.set("access_type", "offline"); // we need a refresh token to work while the customer is away
  url.searchParams.set("prompt", "consent select_account"); // always return a refresh token; let them pick the right account
  url.searchParams.set("include_granted_scopes", "false"); // keep YouTube and Drive tokens separate
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", pkceChallenge(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

type GoogleTokenResponse = { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };

const form = (data: Record<string, string>) => ({
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(data).toString(),
});

export async function googleExchangeCode(provider: GoogleProvider, code: string, codeVerifier: string): Promise<TokenSet> {
  const { clientId, clientSecret } = googleClient();
  const r = await requestJson<GoogleTokenResponse>(
    "google",
    endpoints.googleToken(),
    form({ grant_type: "authorization_code", code, code_verifier: codeVerifier, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri(provider) }),
  );
  const tokens = fromTokenResponse(r);
  if (!tokens.refreshToken) throw new ProviderError("google", "auth", null, "no_refresh_token", "Google returned no refresh token");
  return tokens;
}

export async function googleRefresh(previous: TokenSet): Promise<TokenSet> {
  if (!previous.refreshToken) throw new ProviderError("google", "auth", null, "no_refresh_token", "no refresh token stored");
  const { clientId, clientSecret } = googleClient();
  const r = await requestJson<GoogleTokenResponse>(
    "google",
    endpoints.googleToken(),
    form({ grant_type: "refresh_token", refresh_token: previous.refreshToken, client_id: clientId, client_secret: clientSecret }),
  );
  return fromTokenResponse(r, previous);
}

/** Revoking the refresh token also revokes its access tokens. */
export async function googleRevoke(token: string): Promise<void> {
  await requestJson("google", endpoints.googleRevoke(), form({ token }));
}

const bearer = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } });

/** YouTube health check (1 quota unit): the channel this token uploads to. */
export async function youtubeMyChannel(accessToken: string): Promise<{ id: string; title: string } | null> {
  const r = await requestJson<{ items?: { id: string; snippet?: { title?: string } }[] }>(
    "google",
    `${endpoints.googleApi()}/youtube/v3/channels?part=snippet&mine=true`,
    bearer(accessToken),
  );
  const c = r.items?.[0];
  return c ? { id: c.id, title: c.snippet?.title ?? "Your channel" } : null;
}

/** Drive health check: whose Drive this token reads. */
export async function driveAbout(accessToken: string): Promise<{ email: string | null; name: string | null }> {
  const r = await requestJson<{ user?: { emailAddress?: string; displayName?: string } }>(
    "google",
    `${endpoints.googleApi()}/drive/v3/about?fields=user(displayName,emailAddress)`,
    bearer(accessToken),
  );
  return { email: r.user?.emailAddress ?? null, name: r.user?.displayName ?? null };
}
