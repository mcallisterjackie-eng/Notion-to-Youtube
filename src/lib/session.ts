import "server-only";
import { cache } from "react";
import { MissingEnvError } from "@/lib/env";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user's verified session claims, or null. getClaims() checks the
 * token's signature, so this is safe for authorization decisions on the server
 * (unlike getSession(), whose contents come straight from the cookie).
 * Cached per request.
 *
 * Only a missing configuration is caught (treated as signed out). Anything else
 * is rethrown: Next.js uses thrown signals from cookies() to know the page is per-user.
 */
export const getSessionClaims = cache(async () => {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    if (!(err instanceof MissingEnvError)) throw err;
    log.error("session.config", err.message);
    return null;
  }
  const { data, error } = await supabase.auth.getClaims();
  if (error) log.warn("session.getClaims", error.message);
  return data?.claims?.sub ? data.claims : null;
});
