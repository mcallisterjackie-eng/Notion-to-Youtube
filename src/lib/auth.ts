"use client";

/**
 * Sign-in actions used by the forms in src/components/app/AuthForms.tsx.
 * All calls go to Supabase Auth with the publishable key; the session is kept
 * in cookies so the server (src/proxy.ts, the dashboard layout) can read it.
 */

import { friendlyAuthError } from "@/lib/auth-errors";
import { log } from "@/lib/log";
import { HOME_PATH, safeNextPath, SETUP_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export type AuthResult = { ok: true } | { ok: false; error: string };
export type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; error: string };

/** The link Supabase sends people back to after email confirmation, password reset or Google. */
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
}

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function fail(event: string, err: unknown): { ok: false; error: string } {
  const e = err as { code?: string; name?: string; message?: string; status?: number };
  log.warn(event, e?.message ?? "unknown error", { code: e?.code, status: e?.status });
  return { ok: false, error: friendlyAuthError(e) };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  try {
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    return error ? fail("auth.signIn", error) : { ok: true };
  } catch (err) {
    return fail("auth.signIn", err);
  }
}

export async function signUp(name: string, email: string, password: string): Promise<SignUpResult> {
  if (!name.trim() || !email || password.length < 8) return { ok: false, error: "Check your details and try again." };
  try {
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      // The time zone seeds the account setting (Design Spec §13); the database validates it.
      options: { data: { full_name: name.trim(), timezone: browserTimezone() }, emailRedirectTo: callbackUrl(SETUP_PATH) },
    });
    if (error) return fail("auth.signUp", error);
    // With email confirmation on (the Supabase default) there is no session until the link is clicked.
    return { ok: true, needsConfirmation: !data.session };
  } catch (err) {
    return fail("auth.signUp", err);
  }
}

/** Sends the browser to Google; it comes back through /auth/callback. */
export async function signInWithGoogle(next: string = HOME_PATH): Promise<AuthResult> {
  try {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      // Sign-in only needs the basic profile. YouTube and Drive access are requested separately in Phase 3.
      options: { redirectTo: callbackUrl(next), scopes: "openid email profile" },
    });
    return error ? fail("auth.google", error) : { ok: true };
  } catch (err) {
    return fail("auth.google", err);
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!email) return { ok: false, error: "Enter your email address." };
  try {
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/reset-password") });
    return error ? fail("auth.reset", error) : { ok: true };
  } catch (err) {
    return fail("auth.reset", err);
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };
  try {
    const { error } = await createClient().auth.updateUser({ password });
    return error ? fail("auth.updatePassword", error) : { ok: true };
  } catch (err) {
    return fail("auth.updatePassword", err);
  }
}

/**
 * Start an email change. Supabase sends a confirmation link (to both the old and
 * new address when "Secure email change" is on); nothing changes until it is clicked.
 */
export async function changeEmail(newEmail: string): Promise<AuthResult> {
  try {
    const { error } = await createClient().auth.updateUser({ email: newEmail }, { emailRedirectTo: callbackUrl("/dashboard/profile") });
    return error ? fail("auth.changeEmail", error) : { ok: true };
  } catch (err) {
    return fail("auth.changeEmail", err);
  }
}

/** Change password after confirming the current one, so an unattended session cannot be taken over. */
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
  if (newPassword.length < 8) return { ok: false, error: "Use at least 8 characters." };
  if (newPassword === currentPassword) return { ok: false, error: "Choose a password you have not used before." };
  try {
    const supabase = createClient();
    const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (check.error) {
      return check.error.code === "invalid_credentials" ? { ok: false, error: "Your current password is not right." } : fail("auth.changePassword", check.error);
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? fail("auth.changePassword", error) : { ok: true };
  } catch (err) {
    return fail("auth.changePassword", err);
  }
}

export async function signOut(): Promise<void> {
  try {
    await createClient().auth.signOut();
  } catch (err) {
    fail("auth.signOut", err);
  }
}
