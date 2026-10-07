import "server-only";
import { cache } from "react";
import type { Tables } from "@/lib/database.types";
import { log } from "@/lib/log";
import { getSessionClaims } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in person and the account they act on, for server code.
 *
 * SECURITY RULE (Design Spec §25): the account is always derived here, from the
 * verified session, and read through Row Level Security. Never accept an
 * account ID from the browser (form field, URL, header) to decide whose data to
 * read or change.
 */
export type CurrentAccount = {
  userId: string;
  email: string;
  /** Sign-in methods on this login, e.g. ["email"], ["google"] or both. */
  providers: string[];
  /** True when the person can sign in with a password (so "change password" applies). */
  hasPassword: boolean;
  profile: Tables<"profiles">;
  account: Tables<"accounts">;
  role: Tables<"account_members">["role"];
};

export const getCurrentAccount = cache(async (): Promise<CurrentAccount | null> => {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: membership, error: memberError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", claims.sub).maybeSingle(),
    // MVP: one account per person. With team accounts this picks the active one.
    supabase.from("account_members").select("role, account:accounts(*)").eq("user_id", claims.sub).limit(1).maybeSingle(),
  ]);

  if (profileError || memberError) {
    log.error("account.load", (profileError ?? memberError)!.message, { user: claims.sub });
    throw new Error("Could not load your account.");
  }
  if (!profile || !membership?.account) {
    // Every sign-up gets an account from a database trigger; reaching this means that failed.
    log.error("account.missing", "signed-in user has no profile or account", { user: claims.sub });
    return null;
  }

  const appMeta = (claims.app_metadata ?? {}) as { providers?: unknown };
  const providers = Array.isArray(appMeta.providers) ? appMeta.providers.filter((p): p is string => typeof p === "string") : [];

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    providers,
    hasPassword: providers.includes("email"),
    profile,
    account: membership.account,
    role: membership.role,
  };
});
