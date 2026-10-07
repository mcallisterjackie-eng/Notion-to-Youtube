import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/account";
import { completeConnection } from "@/lib/connections";
import { isProvider } from "@/lib/integrations/config";
import { log } from "@/lib/log";
import { STATE_COOKIE, verifyState } from "@/lib/oauth/state";
import { LOGIN_PATH, safeNextPath } from "@/lib/routes";

/**
 * Where Notion / Google send the customer back. Accepts the code only when the
 * encrypted state cookie matches, is fresh, and belongs to the person signed in;
 * then stores the tokens and records the connection.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) return NextResponse.json({ error: "unknown service" }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const sealed = request.cookies.get(STATE_COOKIE)?.value;

  const finish = (returnTo: string, outcome: { connected: true } | { error: string }) => {
    const url = new URL(safeNextPath(returnTo, "/dashboard/connections").split("?")[0], request.url);
    if ("connected" in outcome) url.searchParams.set("connected", provider);
    else {
      url.searchParams.set("connectError", outcome.error);
      url.searchParams.set("provider", provider);
    }
    const res = NextResponse.redirect(url);
    res.cookies.set(STATE_COOKIE, "", { path: "/api/connect", maxAge: 0 }); // one use only
    return res;
  };

  const me = await getCurrentAccount();
  if (!me) return NextResponse.redirect(new URL(`${LOGIN_PATH}?next=/dashboard/connections`, request.url));

  const check = verifyState(sealed, { provider, state: sp.get("state"), userId: me.userId });
  if (!check.ok) {
    log.warn("connect.callback.state", check.reason, { provider });
    return finish("/dashboard/connections", { error: "link_expired" });
  }
  const { returnTo, codeVerifier } = check.state;

  // The customer pressed "Cancel" / "Deny" on the service's screen.
  const providerError = sp.get("error");
  if (providerError) {
    log.info("connect.callback.denied", providerError, { provider });
    return finish(returnTo, { error: providerError === "access_denied" ? "access_denied" : "unknown" });
  }

  const code = sp.get("code");
  if (!code) return finish(returnTo, { error: "unknown" });

  const result = await completeConnection(me.account.id, provider, code, codeVerifier);
  return finish(returnTo, result.ok ? { connected: true } : { error: result.code });
}
