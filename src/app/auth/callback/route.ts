import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { log } from "@/lib/log";
import { LOGIN_PATH, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase sends people back after confirming their email, opening a
 * password-reset link or signing in with Google. Swaps the one-time code for
 * a session cookie, then continues to `next` (same-site paths only).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    log.warn("auth.callback", providerError, { error_code: searchParams.get("error_code") });
    return NextResponse.redirect(appUrl(`${LOGIN_PATH}?error=callback`, request.url));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(appUrl(next, request.url));
    log.warn("auth.callback", error.message, { code: error.code });
  }

  return NextResponse.redirect(appUrl(`${LOGIN_PATH}?error=callback`, request.url));
}
