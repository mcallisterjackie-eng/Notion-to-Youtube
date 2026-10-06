import "server-only";
import { readSupabaseEnv } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Which external sign-in providers are switched on in Supabase. The
 * "Continue with Google" button only appears once Google is enabled there,
 * so the app never offers a sign-in method that would fail.
 * Cached for five minutes.
 */
export async function getAuthProviders(): Promise<{ google: boolean }> {
  try {
    const { url, publishableKey } = readSupabaseEnv();
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`settings responded ${res.status}`);
    const body = (await res.json()) as { external?: Record<string, boolean> };
    return { google: body.external?.google === true };
  } catch (err) {
    log.warn("auth.providers", err instanceof Error ? err.message : "unknown error");
    return { google: false };
  }
}
