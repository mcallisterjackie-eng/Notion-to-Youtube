/**
 * A tiny stand-in for the Supabase Auth API, used ONLY by the Playwright tests
 * so the sign-in flow can be tested end to end without a real project or network.
 * It implements just the endpoints the app calls. Never used in the app itself.
 *
 *   node tests/e2e/mock-supabase.mjs   (port from MOCK_SUPABASE_PORT, default 54399)
 *
 * Test account: creator@example.com / correct-horse-battery
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54399);
export const TEST_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "creator@example.com",
  password: "correct-horse-battery",
  full_name: "Riley Morgan",
};

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

function user() {
  return {
    id: TEST_USER.id,
    aud: "authenticated",
    role: "authenticated",
    email: TEST_USER.email,
    email_confirmed_at: "2026-10-01T00:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: TEST_USER.full_name },
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };
}

const validTokens = new Set();

function session() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: TEST_USER.id, aud: "authenticated", role: "authenticated", email: TEST_USER.email,
    user_metadata: { full_name: TEST_USER.full_name }, iat: now, exp: now + 3600, session_id: `s-${now}`,
  };
  // HS256 with no kid: supabase-js verifies such tokens by calling GET /auth/v1/user, which we control.
  const access_token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.mock-signature`;
  validTokens.add(access_token);
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: `r-${now}-${Math.random()}`, user: user() };
}

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "*",
};

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", ...cors });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") return send(res, 204);

  if (url.pathname === "/auth/v1/settings") {
    return send(res, 200, { external: { email: true, google: process.env.MOCK_GOOGLE === "1" }, disable_signup: false });
  }

  if (url.pathname === "/auth/v1/token" && req.method === "POST") {
    const grant = url.searchParams.get("grant_type");
    const body = await readJson(req);
    if (grant === "password") {
      if (body.email === TEST_USER.email && body.password === TEST_USER.password) return send(res, 200, session());
      return send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
    }
    if (grant === "refresh_token") return send(res, 200, session());
    return send(res, 400, { code: 400, error_code: "validation_failed", msg: "unsupported grant" });
  }

  if (url.pathname === "/auth/v1/user" && req.method === "GET") {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    if (validTokens.has(token)) return send(res, 200, user());
    return send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  }

  if (url.pathname === "/auth/v1/logout") {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    validTokens.delete(token);
    return send(res, 204);
  }

  if (url.pathname === "/auth/v1/signup" && req.method === "POST") {
    const body = await readJson(req);
    // Email confirmation is on (the Supabase default): a user comes back, no session.
    return send(res, 200, { ...user(), id: "00000000-0000-4000-8000-000000000002", email: body.email, email_confirmed_at: null, user_metadata: body.data ?? {} });
  }

  if (url.pathname === "/auth/v1/recover" && req.method === "POST") return send(res, 200, {});

  send(res, 404, { code: 404, error_code: "not_found", msg: `mock: ${req.method} ${url.pathname}` });
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock supabase on http://127.0.0.1:${PORT}`));
