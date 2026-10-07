import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { getCurrentAccount } from "@/lib/account";
import { configuredProviders, isProvider } from "@/lib/integrations/config";
import { googleAuthorizeUrl } from "@/lib/integrations/google";
import { notionAuthorizeUrl } from "@/lib/integrations/notion";
import { log } from "@/lib/log";
import { newState, seal, STATE_COOKIE, STATE_TTL_SECONDS } from "@/lib/oauth/state";
import { LOGIN_PATH, safeNextPath } from "@/lib/routes";

/**
 * Starts connecting a service: remembers who asked (in an encrypted cookie) and
 * sends the browser to the service's own approval screen.
 *   GET /api/connect/notion/start?returnTo=/dashboard/setup
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const returnTo = safeNextPath(request.nextUrl.searchParams.get("returnTo"), "/dashboard/connections");
  const back = (code: string) => NextResponse.redirect(appUrl(`${returnTo.split("?")[0]}?connectError=${code}&provider=${provider}`, request.url));

  if (!isProvider(provider)) return NextResponse.json({ error: "unknown service" }, { status: 404 });

  const me = await getCurrentAccount();
  if (!me) return NextResponse.redirect(appUrl(`${LOGIN_PATH}?next=${encodeURIComponent(returnTo)}`, request.url));
  if (!configuredProviders()[provider]) return back("not_configured");

  try {
    const state = newState({ provider, userId: me.userId, returnTo });
    const target = provider === "notion" ? notionAuthorizeUrl(state.state) : googleAuthorizeUrl(provider, state.state, state.codeVerifier);
    const res = NextResponse.redirect(target);
    res.cookies.set(STATE_COOKIE, seal(state), {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax", // sent on the top-level redirect back from the service
      path: "/api/connect",
      maxAge: STATE_TTL_SECONDS,
    });
    return res;
  } catch (err) {
    log.error("connect.start", err instanceof Error ? err.message : "unknown error", { provider });
    return back("unknown");
  }
}
