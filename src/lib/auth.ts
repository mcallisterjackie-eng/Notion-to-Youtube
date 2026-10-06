/**
 * Auth placeholders. The UI calls these; swap each body for the Supabase call
 * when the backend is ready. Nothing here talks to a server yet.
 *
 *   import { createBrowserClient } from "@supabase/ssr";
 *   const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
 *
 * Protecting /dashboard: once Supabase is in, check the session in
 * src/app/(app)/dashboard/layout.tsx (server side) and redirect to /login when
 * there is none. See README "Dashboard and sign-in".
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function signIn(email: string, password: string): Promise<AuthResult> {
  // TODO: supabase.auth.signInWithPassword({ email, password })
  await wait(400);
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  return { ok: true };
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  // TODO: supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
  await wait(400);
  if (!name || !email || password.length < 8) return { ok: false, error: "Check your details and try again." };
  return { ok: true };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  // TODO: supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` })
  await wait(400);
  if (!email) return { ok: false, error: "Enter your email address." };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  // TODO: supabase.auth.signOut()
  await wait(200);
}
