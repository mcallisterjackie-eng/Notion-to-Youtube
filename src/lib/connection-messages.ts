/**
 * Customer-facing names and messages for connections (Design Spec §16: plain
 * English, never raw API terms). Pure, so it can be unit-tested and used by
 * both server and client code.
 */

export type ProviderKey = "notion" | "youtube" | "google_drive";
export type ConnectionStatus = "not_connected" | "connected" | "error" | "permission_problem";

export const PROVIDER_NAMES: Record<ProviderKey, string> = {
  notion: "Notion",
  youtube: "YouTube",
  google_drive: "Google Drive",
};

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  not_connected: "Not connected",
  connected: "Connected",
  error: "Connection error",
  permission_problem: "Permission problem",
};

/** Stable codes stored in connections.last_error_code, with the message shown to the customer. */
export const CONNECTION_ERRORS = {
  reconnect_required: (p: ProviderKey) => `Your ${PROVIDER_NAMES[p]} connection has expired or was removed. Reconnect to continue.`,
  missing_permissions: (p: ProviderKey) =>
    `${PROVIDER_NAMES[p]} did not give us every permission we need. Reconnect and leave every box ticked on Google's screen.`,
  no_youtube_channel: () => "This Google account does not have a YouTube channel. Reconnect and choose the account that owns your channel.",
  access_denied: (p: ProviderKey) => `You cancelled the ${PROVIDER_NAMES[p]} connection. Connect again when you are ready.`,
  service_unavailable: (p: ProviderKey) => `We could not reach ${PROVIDER_NAMES[p]} just now. Try checking again in a few minutes.`,
  link_expired: () => "That connection link expired or was already used. Start the connection again.",
  not_configured: (p: ProviderKey) => `Connecting ${PROVIDER_NAMES[p]} is not available yet.`,
  unknown: (p: ProviderKey) => `Something went wrong connecting ${PROVIDER_NAMES[p]}. Try again.`,
} as const;

export type ConnectionErrorCode = keyof typeof CONNECTION_ERRORS;

export function connectionErrorMessage(code: string | null | undefined, provider: ProviderKey): string {
  const fn = code && code in CONNECTION_ERRORS ? CONNECTION_ERRORS[code as ConnectionErrorCode] : CONNECTION_ERRORS.unknown;
  return fn(provider);
}

/** What each connection lets the product do, shown on the Connections page. */
export const PROVIDER_PURPOSE: Record<ProviderKey, string> = {
  notion: "Reads your content calendar and, later, writes upload results back to it",
  youtube: "Uploads videos to your channel",
  google_drive: "Reads the video files linked in your calendar",
};

/** Plain-English access we request (keep in sync with GOOGLE_SCOPES and the Notion capabilities). */
export const PROVIDER_ACCESS: Record<ProviderKey, string> = {
  notion: "Read and update the pages in the databases you choose to share. No access to email addresses.",
  youtube: "Upload videos to your channel and see your channel's name and video status. We cannot delete videos or manage your account.",
  google_drive: "View files in your Google Drive so we can fetch the videos you link. We cannot change or delete anything.",
};
