import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MissingEnvError, readSupabaseEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { decideRoute, isProtectedPath, LOGIN_PATH } from "@/lib/routes";

/**
 * Runs before every page request (see src/proxy.ts):
 * 1. refreshes the Supabase session cookie so Server Components see a valid session;
 * 2. sends signed-out visitors away from protected pages, and signed-in
 *    visitors away from the sign-in pages.
 */
export async function updateSession(request: NextRequest) {
  let env;
  try {
    env = readSupabaseEnv();
  } catch (err) {
    if (!(err instanceof MissingEnvError)) throw err;
    log.error("proxy.config", err.message);
    // Fail closed: without auth configured, nobody reaches a protected page.
    if (isProtectedPath(request.nextUrl.pathname)) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nothing may run between createServerClient and getClaims(), or sessions
  // can fail to refresh and users get logged out at random (Supabase guidance).
  const { data, error } = await supabase.auth.getClaims();
  if (error) log.warn("proxy.getClaims", error.message);
  const signedIn = Boolean(data?.claims?.sub);

  const decision = decideRoute(request.nextUrl.pathname, request.nextUrl.search, signedIn);
  if (decision) {
    const redirect = NextResponse.redirect(new URL(decision.redirect, request.url));
    // Keep any refreshed session cookies on the redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
