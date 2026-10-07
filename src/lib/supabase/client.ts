import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { readSupabaseEnv } from "@/lib/env";

/** Supabase client for Client Components. Uses only the publishable key. */
export function createClient() {
  const { url, publishableKey } = readSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
