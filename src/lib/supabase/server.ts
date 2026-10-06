import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions,
 * acting as the signed-in user (their session cookie). Create one per request.
 */
export async function createClient() {
  const { url, publishableKey } = readSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which cannot write cookies.
          // Safe to ignore: src/proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
