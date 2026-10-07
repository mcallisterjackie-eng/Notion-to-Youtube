import "server-only";
import { endpoints, NOTION_VERSION, notionClient, redirectUri } from "./config";
import { ProviderError, requestJson } from "./http";
import { fromTokenResponse, type TokenSet } from "./tokens";

/**
 * Notion public-integration OAuth and the few read calls Phase 3 needs.
 * Notion rotates refresh tokens: every refresh returns a new one, which must be stored.
 */

const basicAuth = () => {
  const { clientId, clientSecret } = notionClient();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
};

export function notionAuthorizeUrl(state: string): string {
  const url = new URL(endpoints.notionAuthorize());
  url.searchParams.set("client_id", notionClient().clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri("notion"));
  url.searchParams.set("state", state);
  return url.toString();
}

type NotionTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  workspace_id?: string;
  workspace_name?: string | null;
};

export async function notionExchangeCode(code: string): Promise<{ tokens: TokenSet; workspaceId: string | null; workspaceName: string | null }> {
  const r = await requestJson<NotionTokenResponse>("notion", `${endpoints.notionApi()}/v1/oauth/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri("notion") }),
  });
  return { tokens: fromTokenResponse(r), workspaceId: r.workspace_id ?? null, workspaceName: r.workspace_name ?? null };
}

export async function notionRefresh(previous: TokenSet): Promise<TokenSet> {
  if (!previous.refreshToken) throw new ProviderError("notion", "auth", null, "no_refresh_token", "no refresh token stored");
  const r = await requestJson<NotionTokenResponse>("notion", `${endpoints.notionApi()}/v1/oauth/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: previous.refreshToken }),
  });
  return fromTokenResponse(r, previous);
}

export async function notionRevoke(token: string): Promise<void> {
  await requestJson("notion", `${endpoints.notionApi()}/v1/oauth/revoke`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

const apiHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

/** Health check: the integration's bot user, which names the workspace. */
export async function notionWhoAmI(accessToken: string): Promise<{ workspaceName: string | null }> {
  const me = await requestJson<{ bot?: { workspace_name?: string | null } }>("notion", `${endpoints.notionApi()}/v1/users/me`, {
    headers: apiHeaders(accessToken),
  });
  return { workspaceName: me.bot?.workspace_name ?? null };
}

export type NotionDataSource = { id: string; name: string; databaseId: string | null; url: string | null };

type RichText = { plain_text?: string }[];
type SearchResponse = {
  results: { object: string; id: string; title?: RichText; url?: string; parent?: { type?: string; database_id?: string } }[];
  has_more: boolean;
  next_cursor: string | null;
};

/**
 * The databases (data sources, in Notion API 2025-09-03) the customer shared with
 * the integration. Only these are visible to us; the customer chooses which to share.
 */
export async function notionListDataSources(accessToken: string, maxPages = 5): Promise<NotionDataSource[]> {
  const out: NotionDataSource[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const body: Record<string, unknown> = { filter: { property: "object", value: "data_source" }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r: SearchResponse = await requestJson<SearchResponse>("notion", `${endpoints.notionApi()}/v1/search`, {
      method: "POST",
      headers: apiHeaders(accessToken),
      body: JSON.stringify(body),
    });
    for (const item of r.results) {
      if (item.object !== "data_source") continue;
      const name = (item.title ?? []).map((t) => t.plain_text ?? "").join("").trim() || "Untitled";
      const databaseId = item.parent?.type === "database_id" ? item.parent.database_id ?? null : null;
      out.push({ id: item.id, name, databaseId, url: item.url ?? (databaseId ? `https://www.notion.so/${databaseId.replace(/-/g, "")}` : null) });
    }
    if (!r.has_more || !r.next_cursor) break;
    cursor = r.next_cursor;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
