import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { readSupabaseEnv } from "@/lib/env";
import { IntegrationConfigError } from "@/lib/integrations/config";

/**
 * Trusted server-side Supabase client using the SECRET key: bypasses Row Level
 * Security. Use only for writes customers may not make themselves (connections,
 * tokens), and ALWAYS filter by the account from getCurrentAccount(), never by
 * an ID from the browser. Never import this from client code.
 */
export function createAdminClient() {
  const { url } = readSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new IntegrationConfigError(["SUPABASE_SECRET_KEY"]);
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
