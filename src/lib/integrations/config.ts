import "server-only";

/**
 * Settings for the three services customers connect (Design Spec §2).
 *
 * Endpoints default to the real services. The *_URL overrides exist ONLY so the
 * automated tests can point at local stand-ins; never set them in production.
 */

export type Provider = "notion" | "youtube" | "google_drive";
export const PROVIDERS: Provider[] = ["notion", "youtube", "google_drive"];

export function isProvider(value: string): value is Provider {
  return (PROVIDERS as string[]).includes(value);
}

/** Least-privilege Google scopes (owner-approved, Phase 3). */
export const GOOGLE_SCOPES = {
  youtube: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
  google_drive: ["https://www.googleapis.com/auth/drive.readonly"],
} as const;

/** Notion pins the API version per request; 2025-09-03 introduced data sources. */
export const NOTION_VERSION = "2025-09-03";

export const endpoints = {
  notionApi: () => process.env.NOTION_API_URL || "https://api.notion.com",
  notionAuthorize: () => process.env.NOTION_AUTHORIZE_URL || "https://api.notion.com/v1/oauth/authorize",
  googleAuthorize: () => process.env.GOOGLE_AUTHORIZE_URL || "https://accounts.google.com/o/oauth2/v2/auth",
  googleToken: () => process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",
  googleRevoke: () => process.env.GOOGLE_REVOKE_URL || "https://oauth2.googleapis.com/revoke",
  googleApi: () => process.env.GOOGLE_API_URL || "https://www.googleapis.com",
};

export class IntegrationConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. See .env.example.`);
    this.name = "IntegrationConfigError";
  }
}

function required(names: string[]): Record<string, string> {
  const missing = names.filter((n) => !process.env[n]?.trim());
  if (missing.length) throw new IntegrationConfigError(missing);
  return Object.fromEntries(names.map((n) => [n, process.env[n]!.trim()]));
}

export function notionClient() {
  const env = required(["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"]);
  return { clientId: env.NOTION_CLIENT_ID, clientSecret: env.NOTION_CLIENT_SECRET };
}

export function googleClient() {
  const env = required(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
}

export function siteUrl(): string {
  return required(["NEXT_PUBLIC_SITE_URL"]).NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
}

/** Where each service sends the customer back. Must be registered with the service exactly. */
export function redirectUri(provider: Provider): string {
  return `${siteUrl()}/api/connect/${provider}/callback`;
}

/** Which providers are configured in this environment (so the UI can say "not available yet"). */
export function configuredProviders(): Record<Provider, boolean> {
  const has = (...names: string[]) => names.every((n) => Boolean(process.env[n]?.trim()));
  const base = has("NEXT_PUBLIC_SITE_URL", "SUPABASE_SECRET_KEY", "OAUTH_STATE_SECRET");
  return {
    notion: base && has("NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"),
    youtube: base && has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
    google_drive: base && has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
  };
}
