import "server-only";
import { CONNECTION_ERRORS, type ConnectionErrorCode } from "@/lib/connection-messages";
import type { Tables } from "@/lib/database.types";
import { configuredProviders, GOOGLE_SCOPES, type Provider } from "@/lib/integrations/config";
import { driveAbout, googleExchangeCode, googleRefresh, googleRevoke, youtubeMyChannel } from "@/lib/integrations/google";
import { ProviderError } from "@/lib/integrations/http";
import { notionExchangeCode, notionListDataSources, notionRefresh, notionRevoke, notionWhoAmI, type NotionDataSource } from "@/lib/integrations/notion";
import { missingScopes, needsRefresh, parse, serialize, type TokenSet } from "@/lib/integrations/tokens";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Connection lifecycle: connect, check health, refresh tokens, disconnect, and
 * choosing the Notion database.
 *
 * SECURITY: every function takes the accountId that the CALLER got from
 * getCurrentAccount(). Never pass an ID that came from the browser. Writes use
 * the admin client (customers cannot write connections) and always filter by
 * that accountId.
 */

export type Connection = Tables<"connections">;
export type DataSource = Tables<"data_sources">;

// ---------------------------------------------------------------------------
// Reading (as the signed-in person, through Row Level Security)
// ---------------------------------------------------------------------------

export async function getConnections(accountId: string): Promise<Record<Provider, Connection | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("connections").select("*").eq("account_id", accountId);
  if (error) throw new Error(`could not load connections: ${error.message}`);
  const by = (p: Provider) => data.find((c) => c.provider === p) ?? null;
  return { notion: by("notion"), youtube: by("youtube"), google_drive: by("google_drive") };
}

export async function getDataSource(accountId: string): Promise<DataSource | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("data_sources").select("*").eq("account_id", accountId).maybeSingle();
  if (error) throw new Error(`could not load data source: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Token storage (admin, Vault)
// ---------------------------------------------------------------------------

async function saveTokens(accountId: string, provider: Provider, tokens: TokenSet) {
  const { error } = await createAdminClient().rpc("store_connection_secret", { p_account_id: accountId, p_provider: provider, p_secret: serialize(tokens) });
  if (error) throw new Error(`could not store tokens: ${error.message}`);
}

async function loadTokens(accountId: string, provider: Provider): Promise<TokenSet | null> {
  const { data, error } = await createAdminClient().rpc("read_connection_secret", { p_account_id: accountId, p_provider: provider });
  if (error) throw new Error(`could not read tokens: ${error.message}`);
  return parse(data);
}

async function deleteTokens(accountId: string, provider: Provider) {
  const { error } = await createAdminClient().rpc("delete_connection_secret", { p_account_id: accountId, p_provider: provider });
  if (error) throw new Error(`could not delete tokens: ${error.message}`);
}

async function updateConnection(accountId: string, provider: Provider, patch: Partial<Connection>) {
  const { error } = await createAdminClient().from("connections").update(patch).eq("account_id", accountId).eq("provider", provider);
  if (error) throw new Error(`could not update connection: ${error.message}`);
}

const now = () => new Date().toISOString();

async function markProblem(accountId: string, provider: Provider, status: "error" | "permission_problem", code: ConnectionErrorCode) {
  await updateConnection(accountId, provider, {
    status,
    last_checked_at: now(),
    last_error_code: code,
    last_error_message: CONNECTION_ERRORS[code](provider),
  });
}

function problemFor(err: unknown): { status: "error" | "permission_problem"; code: ConnectionErrorCode } {
  if (err instanceof ProviderError) {
    if (err.kind === "auth") return { status: "error", code: "reconnect_required" };
    if (err.kind === "permission") return { status: "permission_problem", code: "missing_permissions" };
    if (err.kind === "temporary" || err.kind === "network" || err.kind === "rate_limited") return { status: "error", code: "service_unavailable" };
  }
  return { status: "error", code: "unknown" };
}

// ---------------------------------------------------------------------------
// Access tokens with refresh
// ---------------------------------------------------------------------------

/**
 * A valid access token for this account's connection, refreshing (and storing
 * the rotated token) when it is about to expire. Throws ProviderError("auth")
 * when the connection must be reconnected.
 */
export async function getAccessToken(accountId: string, provider: Provider): Promise<string> {
  const tokens = await loadTokens(accountId, provider);
  if (!tokens) throw new ProviderError(provider === "notion" ? "notion" : "google", "auth", null, "not_connected", "no tokens stored");
  if (!needsRefresh(tokens)) return tokens.accessToken;

  try {
    const fresh = provider === "notion" ? await notionRefresh(tokens) : await googleRefresh(tokens);
    await saveTokens(accountId, provider, fresh);
    return fresh.accessToken;
  } catch (err) {
    // Notion rotates refresh tokens: if another request refreshed first, ours is now
    // invalid. Use the token it stored rather than failing.
    if (err instanceof ProviderError && err.kind === "auth") {
      const latest = await loadTokens(accountId, provider);
      if (latest && latest.refreshToken !== tokens.refreshToken && !needsRefresh(latest)) return latest.accessToken;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Connect (OAuth callback)
// ---------------------------------------------------------------------------

export type ConnectResult = { ok: true } | { ok: false; code: ConnectionErrorCode };

/** Finish a connection after the service sends the customer back with a code. */
export async function completeConnection(accountId: string, provider: Provider, code: string, codeVerifier: string): Promise<ConnectResult> {
  try {
    if (provider === "notion") {
      const previous = (await getConnections(accountId)).notion;
      const { tokens, workspaceId, workspaceName } = await notionExchangeCode(code);
      await saveTokens(accountId, provider, tokens);
      // A different workspace means the chosen database is no longer reachable.
      if (previous?.external_account_id && workspaceId && previous.external_account_id !== workspaceId) {
        await clearDataSource(accountId);
      }
      await updateConnection(accountId, provider, {
        status: "connected",
        external_account_id: workspaceId,
        external_account_name: workspaceName ?? "Notion workspace",
        granted_scopes: [],
        connected_at: now(),
        last_checked_at: now(),
        last_error_code: null,
        last_error_message: null,
      });
      return { ok: true };
    }

    const tokens = await googleExchangeCode(provider, code, codeVerifier);
    await saveTokens(accountId, provider, tokens);
    const base = { granted_scopes: tokens.scopes, connected_at: now(), last_checked_at: now() };

    if (missingScopes(tokens.scopes, GOOGLE_SCOPES[provider]).length) {
      await updateConnection(accountId, provider, {
        ...base,
        status: "permission_problem",
        last_error_code: "missing_permissions",
        last_error_message: CONNECTION_ERRORS.missing_permissions(provider),
      });
      return { ok: false, code: "missing_permissions" };
    }

    if (provider === "youtube") {
      const channel = await youtubeMyChannel(tokens.accessToken);
      if (!channel) {
        await updateConnection(accountId, provider, {
          ...base,
          status: "permission_problem",
          external_account_id: null,
          external_account_name: null,
          last_error_code: "no_youtube_channel",
          last_error_message: CONNECTION_ERRORS.no_youtube_channel(),
        });
        return { ok: false, code: "no_youtube_channel" };
      }
      await updateConnection(accountId, provider, {
        ...base,
        status: "connected",
        external_account_id: channel.id,
        external_account_name: channel.title,
        last_error_code: null,
        last_error_message: null,
      });
      return { ok: true };
    }

    const about = await driveAbout(tokens.accessToken);
    await updateConnection(accountId, provider, {
      ...base,
      status: "connected",
      external_account_id: about.email,
      external_account_name: about.email ?? about.name ?? "Google Drive",
      last_error_code: null,
      last_error_message: null,
    });
    return { ok: true };
  } catch (err) {
    log.error("connections.complete", err instanceof Error ? err.message : "unknown error", {
      provider,
      kind: err instanceof ProviderError ? err.kind : undefined,
      code: err instanceof ProviderError ? err.code : undefined,
    });
    return { ok: false, code: problemFor(err).code === "service_unavailable" ? "service_unavailable" : "unknown" };
  }
}

// ---------------------------------------------------------------------------
// Health checks (Design Spec §20 setup validation, §22 connection health)
// ---------------------------------------------------------------------------

export async function checkConnection(accountId: string, provider: Provider): Promise<void> {
  const connections = await getConnections(accountId);
  if (!connections[provider] || connections[provider]!.status === "not_connected") return;

  try {
    const token = await getAccessToken(accountId, provider);
    if (provider === "notion") {
      const me = await notionWhoAmI(token);
      await updateConnection(accountId, provider, {
        status: "connected",
        external_account_name: me.workspaceName ?? connections.notion?.external_account_name ?? "Notion workspace",
        last_checked_at: now(),
        last_error_code: null,
        last_error_message: null,
      });
      return;
    }

    const tokens = await loadTokens(accountId, provider);
    if (tokens && missingScopes(tokens.scopes, GOOGLE_SCOPES[provider]).length) {
      return markProblem(accountId, provider, "permission_problem", "missing_permissions");
    }
    if (provider === "youtube") {
      const channel = await youtubeMyChannel(token);
      if (!channel) return markProblem(accountId, provider, "permission_problem", "no_youtube_channel");
      await updateConnection(accountId, provider, {
        status: "connected",
        external_account_id: channel.id,
        external_account_name: channel.title,
        last_checked_at: now(),
        last_error_code: null,
        last_error_message: null,
      });
      return;
    }
    const about = await driveAbout(token);
    await updateConnection(accountId, provider, {
      status: "connected",
      external_account_name: about.email ?? about.name ?? "Google Drive",
      last_checked_at: now(),
      last_error_code: null,
      last_error_message: null,
    });
  } catch (err) {
    const { status, code } = problemFor(err);
    log.warn("connections.check", err instanceof Error ? err.message : "unknown error", { provider, code });
    await markProblem(accountId, provider, status, code);
  }
}

export async function checkAllConnections(accountId: string): Promise<void> {
  // One at a time keeps token refreshes for different services from interleaving in logs; each is quick.
  for (const provider of ["notion", "youtube", "google_drive"] as const) await checkConnection(accountId, provider);
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------

export async function disconnect(accountId: string, provider: Provider): Promise<void> {
  const tokens = await loadTokens(accountId, provider);
  if (tokens) {
    try {
      if (provider === "notion") await notionRevoke(tokens.accessToken);
      else await googleRevoke(tokens.refreshToken ?? tokens.accessToken);
    } catch (err) {
      // The token is deleted on our side regardless; a failed revoke only means the
      // service keeps it until it expires. The customer can also remove access there.
      log.warn("connections.revoke", err instanceof Error ? err.message : "unknown error", { provider });
    }
  }
  await deleteTokens(accountId, provider);
  if (provider === "notion") await clearDataSource(accountId);
  await updateConnection(accountId, provider, {
    status: "not_connected",
    external_account_id: null,
    external_account_name: null,
    granted_scopes: [],
    connected_at: null,
    last_checked_at: null,
    last_error_code: null,
    last_error_message: null,
  });
}

// ---------------------------------------------------------------------------
// Choosing the Notion database
// ---------------------------------------------------------------------------

export async function listNotionDatabases(accountId: string): Promise<NotionDataSource[]> {
  return notionListDataSources(await getAccessToken(accountId, "notion"));
}

/**
 * Save the database the customer picked. The ID is checked against what Notion
 * says this account can see, so a crafted ID cannot point at anything else.
 * Choosing a different database removes the old one and anything mapped to it.
 */
export async function selectDatabase(accountId: string, dataSourceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const available = await listNotionDatabases(accountId);
  const chosen = available.find((d) => d.id === dataSourceId);
  if (!chosen) return { ok: false, error: "That database is not shared with the app. Share it in Notion, then refresh the list." };

  const notion = (await getConnections(accountId)).notion;
  if (!notion || notion.status === "not_connected") return { ok: false, error: "Connect Notion first." };

  const current = await getDataSource(accountId);
  const admin = createAdminClient();
  if (current && current.external_id !== chosen.id) await clearDataSource(accountId);

  if (current && current.external_id === chosen.id) {
    const { error } = await admin.from("data_sources").update({ name: chosen.name, url: chosen.url, connection_id: notion.id }).eq("account_id", accountId).eq("id", current.id);
    if (error) throw new Error(`could not update data source: ${error.message}`);
  } else {
    const { error } = await admin.from("data_sources").insert({
      account_id: accountId,
      connection_id: notion.id,
      source_type: "notion",
      external_id: chosen.id,
      name: chosen.name,
      url: chosen.url,
    });
    if (error) throw new Error(`could not save data source: ${error.message}`);
  }
  return { ok: true };
}

async function clearDataSource(accountId: string) {
  const { error } = await createAdminClient().from("data_sources").delete().eq("account_id", accountId);
  if (error) throw new Error(`could not clear data source: ${error.message}`);
}

export { configuredProviders };
