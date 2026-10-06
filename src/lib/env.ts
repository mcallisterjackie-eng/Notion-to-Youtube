/**
 * Environment configuration. Every variable the app reads is listed in
 * .env.example. NEXT_PUBLIC_ values must be read with their full literal name
 * (process.env.NEXT_PUBLIC_...) so Next.js can inline them into the browser bundle.
 */

export type SupabaseEnv = { url: string; publishableKey: string };

export class MissingEnvError extends Error {
  constructor(names: string[]) {
    super(`Missing environment variable${names.length > 1 ? "s" : ""}: ${names.join(", ")}. See .env.example.`);
    this.name = "MissingEnvError";
  }
}

/** The Supabase project URL and publishable key, or a clear error naming what is missing. */
export function readSupabaseEnv(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
): SupabaseEnv {
  const missing = [
    !url?.trim() && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey?.trim() && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((n): n is string => Boolean(n));
  if (missing.length) throw new MissingEnvError(missing);
  return { url: url!.trim(), publishableKey: publishableKey!.trim() };
}
