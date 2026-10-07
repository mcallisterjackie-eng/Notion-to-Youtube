/**
 * A tiny stand-in for the Supabase Auth and REST APIs, used ONLY by the Playwright
 * tests so sign-in and the profile pages can be tested end to end without a real
 * project or network. It implements just the endpoints the app calls, with the
 * same ownership rule as the database: a request only ever sees the caller's rows.
 * Never used by the app itself. Real Row Level Security is tested in supabase/tests.
 *
 *   node tests/e2e/mock-supabase.mjs   (port from MOCK_SUPABASE_PORT, default 54399)
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54399);

/** Test accounts. `providers` mimics app_metadata.providers ("google" = Google-only, no password). */
const USERS = [
  { id: "00000000-0000-4000-8000-000000000001", email: "creator@example.com", password: "correct-horse-battery", full_name: "Riley Morgan", providers: ["email"], timezone: "America/Edmonton" },
  { id: "00000000-0000-4000-8000-000000000002", email: "google-user@example.com", password: "test-only-google-standin", full_name: "Gale Google", providers: ["google"], timezone: "UTC" },
  { id: "00000000-0000-4000-8000-000000000003", email: "pw-change@example.com", password: "old-password-123", full_name: "Pat Change", providers: ["email"], timezone: "UTC" },
  { id: "00000000-0000-4000-8000-000000000004", email: "connector@example.com", password: "connect-me-please", full_name: "Casey Connect", providers: ["email"], timezone: "UTC" },
  { id: "00000000-0000-4000-8000-000000000005", email: "neighbour@example.com", password: "neighbour-password", full_name: "Nico Neighbour", providers: ["email"], timezone: "UTC" },
];
const accounts = new Map(USERS.map((u) => [u.id, { id: `acc-${u.id}`, name: u.full_name, timezone: u.timezone, timezone_confirmed_at: null, automation_status: "inactive" }]));

// ---- Database state for the connection tests (one set per account, like the real tables) ----
const SECRET_KEY = "sb_secret_test_only";
const PROVIDER_LIST = ["notion", "youtube", "google_drive"];
const blankConnection = (accountId, provider) => ({
  id: `conn-${provider}-${accountId}`, account_id: accountId, provider, status: "not_connected",
  external_account_id: null, external_account_name: null, granted_scopes: [], connected_at: null,
  last_checked_at: null, last_error_code: null, last_error_message: null,
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
});
const connections = new Map(); // `${accountId}:${provider}` -> row
const secrets = new Map(); // `${accountId}:${provider}` -> text
const dataSources = new Map(); // accountId -> row
function resetDb() {
  connections.clear(); secrets.clear(); dataSources.clear();
  for (const a of accounts.values()) {
    a.timezone_confirmed_at = null;
    for (const p of PROVIDER_LIST) connections.set(`${a.id}:${p}`, blankConnection(a.id, p));
  }
}
resetDb();

// ---- Notion / Google behaviour the tests can switch (POST /__mock/config) ----
let mockConfig = {};
function resetProviders() {
  mockConfig = { notionDeny: false, googleDeny: false, googleScopes: "all", noChannel: false, rejectTokens: false };
}
resetProviders();
const issued = new Map(); // auth code -> { challenge, scopes, provider }
const validProviderTokens = new Set();
const sha256url = async (v) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v))).toString("base64url");

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const tokens = new Map(); // access token -> user id

function authUser(u) {
  return {
    id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: "2026-10-01T00:00:00Z",
    app_metadata: { provider: u.providers[0], providers: u.providers },
    user_metadata: { full_name: u.full_name },
    created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
  };
}

function session(u) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: u.id, aud: "authenticated", role: "authenticated", email: u.email,
    app_metadata: { provider: u.providers[0], providers: u.providers },
    user_metadata: { full_name: u.full_name }, iat: now, exp: now + 3600, session_id: `s-${now}-${Math.random()}`,
  };
  // HS256 with no kid: supabase-js verifies such tokens by calling GET /auth/v1/user, which we control.
  const access_token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.mock-signature`;
  tokens.set(access_token, u.id);
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: `r-${u.id}-${now}-${Math.random()}`, user: authUser(u) };
}

function caller(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const id = tokens.get(token);
  return id ? USERS.find((u) => u.id === id) : undefined;
}

const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-allow-headers": "*" };
function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", ...cors });
  res.end(body === undefined ? "" : JSON.stringify(body));
}
async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}
const eqParam = (url, key) => (url.searchParams.get(key) ?? "").replace(/^eq\./, "");
const validTz = (tz) => typeof tz === "string" && /^(UTC|[A-Z][A-Za-z_+-]*(\/[A-Za-z0-9_+-]+){1,2})$/.test(tz) && (() => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } })();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") return send(res, 204);

  // ---- Auth ----
  if (url.pathname === "/auth/v1/settings") {
    return send(res, 200, { external: { email: true, google: process.env.MOCK_GOOGLE === "1" }, disable_signup: false });
  }
  if (url.pathname === "/auth/v1/token" && req.method === "POST") {
    const grant = url.searchParams.get("grant_type");
    const body = await readJson(req);
    if (grant === "password") {
      const u = USERS.find((x) => x.email === body.email && x.password === body.password);
      return u ? send(res, 200, session(u)) : send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
    }
    if (grant === "refresh_token") {
      const id = String(body.refresh_token ?? "").split("-").slice(1, 6).join("-");
      const u = USERS.find((x) => x.id === id);
      return u ? send(res, 200, session(u)) : send(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
    }
    return send(res, 400, { code: 400, error_code: "validation_failed", msg: "unsupported grant" });
  }
  if (url.pathname === "/auth/v1/user" && req.method === "GET") {
    const u = caller(req);
    return u ? send(res, 200, authUser(u)) : send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  }
  if (url.pathname === "/auth/v1/user" && req.method === "PUT") {
    const u = caller(req);
    if (!u) return send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    const body = await readJson(req);
    if (body.password) u.password = body.password;
    // Email changes wait for the confirmation link, like Supabase: the address does not change yet.
    return send(res, 200, { ...authUser(u), new_email: body.email ?? undefined });
  }
  if (url.pathname === "/auth/v1/logout") {
    tokens.delete((req.headers.authorization ?? "").replace(/^Bearer\s+/i, ""));
    return send(res, 204);
  }
  if (url.pathname === "/auth/v1/signup" && req.method === "POST") {
    const body = await readJson(req);
    return send(res, 200, { id: "00000000-0000-4000-8000-0000000000ff", aud: "authenticated", role: "authenticated", email: body.email, email_confirmed_at: null, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: body.data ?? {}, created_at: "2026-10-01T00:00:00Z" });
  }
  if (url.pathname === "/auth/v1/recover" && req.method === "POST") return send(res, 200, {});

  // ---- Test controls ----
  if (url.pathname === "/__mock/reset" && req.method === "POST") { resetDb(); resetProviders(); return send(res, 204); }
  if (url.pathname === "/__mock/config" && req.method === "POST") { Object.assign(mockConfig, await readJson(req)); return send(res, 204); }
  if (url.pathname === "/__mock/state" && req.method === "GET") {
    return send(res, 200, { connections: [...connections.values()], secrets: [...secrets.keys()], dataSources: [...dataSources.values()] });
  }

  // ---- Notion ----
  if (url.pathname === "/notion/authorize") {
    const back = new URL(url.searchParams.get("redirect_uri"));
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    if (mockConfig.notionDeny) back.searchParams.set("error", "access_denied");
    else {
      const code = `notion-code-${Math.random().toString(36).slice(2)}`;
      issued.set(code, { provider: "notion" });
      back.searchParams.set("code", code);
    }
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }
  if (url.pathname === "/notion/v1/oauth/token" && req.method === "POST") {
    if (req.headers.authorization !== `Basic ${Buffer.from("notion-test-client:notion-test-secret").toString("base64")}`) return send(res, 401, { error: "invalid_client" });
    const body = await readJson(req);
    if (body.grant_type === "authorization_code" && issued.get(body.code)?.provider === "notion") {
      issued.delete(body.code);
      const access = `notion-access-${Math.random()}`;
      validProviderTokens.add(access);
      return send(res, 200, { access_token: access, refresh_token: `notion-refresh-${Math.random()}`, token_type: "bearer", workspace_id: "ws-123", workspace_name: "Creator Studio", bot_id: "bot-1" });
    }
    return send(res, 400, { error: "invalid_grant" });
  }
  if (url.pathname === "/notion/v1/oauth/revoke" && req.method === "POST") {
    const body = await readJson(req);
    validProviderTokens.delete(body.token);
    return send(res, 200, {});
  }
  if (url.pathname.startsWith("/notion/v1/")) {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (mockConfig.rejectTokens || !validProviderTokens.has(token)) return send(res, 401, { object: "error", status: 401, code: "unauthorized", message: "API token is invalid." });
    if (req.headers["notion-version"] !== "2025-09-03") return send(res, 400, { object: "error", status: 400, code: "missing_version" });
    if (url.pathname === "/notion/v1/users/me") return send(res, 200, { object: "user", type: "bot", bot: { workspace_name: "Creator Studio" } });
    if (url.pathname === "/notion/v1/search" && req.method === "POST") {
      const ds = (id, name, db) => ({ object: "data_source", id, title: [{ plain_text: name }], parent: { type: "database_id", database_id: db } });
      return send(res, 200, { object: "list", results: [ds("ds-content", "Content calendar", "db-1"), ds("ds-ideas", "Video ideas", "db-2")], has_more: false, next_cursor: null });
    }
  }

  // ---- Google ----
  if (url.pathname === "/google/auth") {
    const back = new URL(url.searchParams.get("redirect_uri"));
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    if (mockConfig.googleDeny) back.searchParams.set("error", "access_denied");
    else {
      const requested = (url.searchParams.get("scope") ?? "").split(" ");
      // "partial": the person unticks one box on Google's screen.
      const scopes = mockConfig.googleScopes === "partial" ? requested.slice(0, 1) : requested;
      const code = `google-code-${Math.random().toString(36).slice(2)}`;
      issued.set(code, { provider: "google", challenge: url.searchParams.get("code_challenge"), scopes, offline: url.searchParams.get("access_type") === "offline" });
      back.searchParams.set("code", code);
    }
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }
  if (url.pathname === "/google/token" && req.method === "POST") {
    let raw = ""; for await (const chunk of req) raw += chunk;
    const body = Object.fromEntries(new URLSearchParams(raw));
    if (body.client_id !== "google-test-client" || body.client_secret !== "google-test-secret") return send(res, 401, { error: "invalid_client" });
    if (body.grant_type === "authorization_code") {
      const grant = issued.get(body.code);
      if (!grant || grant.provider !== "google") return send(res, 400, { error: "invalid_grant" });
      issued.delete(body.code);
      if (!body.code_verifier || (await sha256url(body.code_verifier)) !== grant.challenge) return send(res, 400, { error: "invalid_grant", error_description: "PKCE verification failed" });
      const access = `google-access-${Math.random()}`;
      validProviderTokens.add(access);
      return send(res, 200, { access_token: access, refresh_token: grant.offline ? `google-refresh-${Math.random()}` : undefined, expires_in: 3599, scope: grant.scopes.join(" "), token_type: "Bearer" });
    }
    if (body.grant_type === "refresh_token") {
      if (mockConfig.rejectTokens) return send(res, 400, { error: "invalid_grant" });
      const access = `google-access-${Math.random()}`;
      validProviderTokens.add(access);
      return send(res, 200, { access_token: access, expires_in: 3599, token_type: "Bearer" });
    }
    return send(res, 400, { error: "unsupported_grant_type" });
  }
  if (url.pathname === "/google/revoke" && req.method === "POST") return send(res, 200, {});
  if (url.pathname.startsWith("/google/api/")) {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (mockConfig.rejectTokens || !validProviderTokens.has(token)) return send(res, 401, { error: { code: 401, status: "UNAUTHENTICATED", errors: [{ reason: "authError" }] } });
    if (url.pathname === "/google/api/youtube/v3/channels") {
      return send(res, 200, mockConfig.noChannel ? { items: [] } : { items: [{ id: "UC-test-channel", snippet: { title: "Creator Studio Channel" } }] });
    }
    if (url.pathname === "/google/api/drive/v3/about") return send(res, 200, { user: { displayName: "Casey Connect", emailAddress: "casey.drive@example.com" } });
  }

  // ---- Supabase REST ----
  if (url.pathname.startsWith("/rest/v1/")) {
    const table = url.pathname.slice("/rest/v1/".length);
    const isAdmin = req.headers.apikey === SECRET_KEY;

    // Trusted server code (secret key): like the service role, sees everything it filters for.
    if (isAdmin) {
      const acc = eqParam(url, "account_id");
      if (table === "rpc/store_connection_secret") {
        const b = await readJson(req);
        if (!connections.has(`${b.p_account_id}:${b.p_provider}`)) return send(res, 400, { code: "P0001", message: "connection not found" });
        secrets.set(`${b.p_account_id}:${b.p_provider}`, b.p_secret);
        return send(res, 204);
      }
      if (table === "rpc/read_connection_secret") {
        const b = await readJson(req);
        return send(res, 200, secrets.get(`${b.p_account_id}:${b.p_provider}`) ?? null);
      }
      if (table === "rpc/delete_connection_secret") {
        const b = await readJson(req);
        secrets.delete(`${b.p_account_id}:${b.p_provider}`);
        return send(res, 204);
      }
      if (table === "connections" && req.method === "PATCH") {
        const key = `${acc}:${eqParam(url, "provider")}`;
        if (connections.has(key)) connections.set(key, { ...connections.get(key), ...(await readJson(req)) });
        return send(res, 204);
      }
      if (table === "data_sources" && req.method === "POST") {
        const b = await readJson(req);
        if (dataSources.has(b.account_id)) return send(res, 409, { code: "23505", message: "duplicate key value violates unique constraint" });
        dataSources.set(b.account_id, { id: `dsrow-${Math.random()}`, created_at: "2026-10-07T00:00:00Z", updated_at: "2026-10-07T00:00:00Z", properties_snapshot: null, properties_synced_at: null, ...b });
        return send(res, 201);
      }
      if (table === "data_sources" && req.method === "PATCH") {
        const row = dataSources.get(acc);
        if (row && row.id === eqParam(url, "id")) dataSources.set(acc, { ...row, ...(await readJson(req)) });
        return send(res, 204);
      }
      if (table === "data_sources" && req.method === "DELETE") {
        dataSources.delete(acc);
        return send(res, 204);
      }
      return send(res, 404, { message: `mock admin: ${req.method} ${table}` });
    }

    // Signed-in customer (publishable key + session): only their own account's rows, like RLS.
    const u = caller(req);
    if (!u) return send(res, 401, { code: "PGRST301", message: "JWT required" });
    const account = accounts.get(u.id);

    if (table === "profiles" && req.method === "GET") {
      return send(res, 200, eqParam(url, "id") === u.id ? [{ id: u.id, full_name: u.full_name, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" }] : []);
    }
    if (table === "profiles" && req.method === "PATCH") {
      const body = await readJson(req);
      if (eqParam(url, "id") === u.id && typeof body.full_name === "string") u.full_name = body.full_name;
      return send(res, 204);
    }
    if (table === "account_members" && req.method === "GET") {
      return send(res, 200, eqParam(url, "user_id") === u.id ? [{ role: "owner", account: { ...account, automation_activated_at: null, automation_deactivated_at: null, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" } }] : []);
    }
    if (table === "accounts" && req.method === "PATCH") {
      const body = await readJson(req);
      if (body.timezone !== undefined && !validTz(body.timezone)) return send(res, 400, { code: "23514", message: "violates check constraint" });
      if (eqParam(url, "id") === account.id) {
        if (body.timezone) account.timezone = body.timezone;
        if (body.timezone_confirmed_at) account.timezone_confirmed_at = body.timezone_confirmed_at;
      }
      return send(res, 204);
    }
    if (table === "connections" && req.method === "GET") {
      return send(res, 200, eqParam(url, "account_id") === account.id ? PROVIDER_LIST.map((p) => connections.get(`${account.id}:${p}`)) : []);
    }
    if (table === "data_sources" && req.method === "GET") {
      const row = dataSources.get(account.id);
      return send(res, 200, eqParam(url, "account_id") === account.id && row ? [row] : []);
    }
  }

  send(res, 404, { code: 404, error_code: "not_found", msg: `mock: ${req.method} ${url.pathname}` });
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock supabase on http://127.0.0.1:${PORT}`));
