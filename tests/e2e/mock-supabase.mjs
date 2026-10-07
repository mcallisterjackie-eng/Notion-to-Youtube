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
];
const accounts = new Map(USERS.map((u) => [u.id, { id: `acc-${u.id}`, name: u.full_name, timezone: u.timezone, automation_status: "inactive" }]));

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

  // ---- REST (only the caller's rows, like RLS) ----
  if (url.pathname.startsWith("/rest/v1/")) {
    const u = caller(req);
    if (!u) return send(res, 401, { code: "PGRST301", message: "JWT required" });
    const table = url.pathname.slice("/rest/v1/".length);
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
      if (eqParam(url, "id") === account.id && body.timezone) account.timezone = body.timezone;
      return send(res, 204);
    }
  }

  send(res, 404, { code: 404, error_code: "not_found", msg: `mock: ${req.method} ${url.pathname}` });
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock supabase on http://127.0.0.1:${PORT}`));
