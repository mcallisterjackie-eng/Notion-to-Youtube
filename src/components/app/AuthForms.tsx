"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPasswordReset, signIn, signInWithGoogle, signUp, updatePassword } from "@/lib/auth";
import { safeNextPath } from "@/lib/routes";

type State = { busy: boolean; error?: string; done?: boolean };

/** Google's "G" mark, as Google's sign-in branding rules require on the button. */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

/** "Continue with Google" plus an "or" divider. Rendered only when Google sign-in is switched on in Supabase. */
function GoogleSignIn({ next }: { next?: string }) {
  const [state, setState] = useState<State>({ busy: false });

  async function onClick() {
    setState({ busy: true });
    const res = await signInWithGoogle(next);
    // On success the browser is already on its way to Google.
    if (!res.ok) setState({ busy: false, error: res.error });
  }

  return (
    <div className="stack gap-6">
      <div className="stack gap-2">
        <Button variant="secondary" onClick={onClick} disabled={state.busy} style={{ width: "100%", gap: "var(--space-3)" }}>
          <GoogleMark />
          {state.busy ? "Opening Google…" : "Continue with Google"}
        </Button>
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      </div>
      <div className="auth-divider" role="separator"><span>or</span></div>
    </div>
  );
}

export function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [state, setState] = useState<State>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ busy: true });
    const res = await signIn(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    if (res.ok) {
      router.replace(next);
      router.refresh();
    } else setState({ busy: false, error: res.error });
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Log in</h1>
        <p className="muted">Welcome back. Your uploads have been running while you were away.</p>
      </div>
      {params.get("signedOut") ? <p className="notice" role="status">You have been logged out.</p> : null}
      {params.get("error") === "callback" ? (
        <p className="form-error" role="alert">That link has expired or was already used. Try again, or request a new link.</p>
      ) : null}
      {googleEnabled ? <GoogleSignIn next={next} /> : null}
      <form className="stack gap-6" onSubmit={onSubmit}>
        <Input name="email" type="email" label="Email" placeholder="you@company.com" autoComplete="email" required />
        <div className="stack gap-2">
          <Input name="password" type="password" label="Password" autoComplete="current-password" required />
          <Link href="/forgot-password" className="ui" style={{ alignSelf: "flex-end" }}>Forgot your password?</Link>
        </div>
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        <Button type="submit" variant="primary" disabled={state.busy} style={{ width: "100%" }}>
          {state.busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="ui muted" style={{ fontWeight: 400 }}>
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}

export function SignupForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<State & { email?: string }>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    setState({ busy: true });
    const res = await signUp(String(data.get("name") ?? ""), email, String(data.get("password") ?? ""));
    if (!res.ok) return setState({ busy: false, error: res.error });
    if (res.needsConfirmation) return setState({ busy: false, done: true, email });
    router.replace("/dashboard/setup");
    router.refresh();
  }

  if (state.done) {
    return (
      <div className="stack gap-8">
        <div className="stack gap-2">
          <h1 className="h2">Check your inbox</h1>
          <p className="muted">
            We sent a confirmation link to <strong style={{ color: "var(--ink)" }}>{state.email}</strong>. Open it to finish creating your account.
          </p>
        </div>
        <p className="notice" role="status">No email after a few minutes? Check your spam folder, or sign up again with the same address.</p>
        <p className="ui muted" style={{ fontWeight: 400 }}>
          Already confirmed? <Link href="/login">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Create your account</h1>
        <p className="muted">Connect Notion and YouTube in a few minutes.</p>
      </div>
      {googleEnabled ? <GoogleSignIn /> : null}
      <form className="stack gap-6" onSubmit={onSubmit}>
        <Input name="name" label="Name" placeholder="Jordan Lee" autoComplete="name" required />
        <Input name="email" type="email" label="Email" placeholder="you@company.com" autoComplete="email" required />
        <Input name="password" type="password" label="Password" hint="At least 8 characters" autoComplete="new-password" minLength={8} required />
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        <Button type="submit" variant="primary" disabled={state.busy} style={{ width: "100%" }}>
          {state.busy ? "Creating account…" : "Create account"}
        </Button>
        <p className="caption">
          By creating an account you agree to the <Link href="/terms">terms of use</Link> and <Link href="/privacy">privacy policy</Link>.
        </p>
      </form>
      <p className="ui muted" style={{ fontWeight: 400 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, setState] = useState<State>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ busy: true });
    const res = await sendPasswordReset(String(data.get("email") ?? ""));
    setState(res.ok ? { busy: false, done: true } : { busy: false, error: res.error });
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Reset your password</h1>
        <p className="muted">Enter the email you signed up with and we will send you a link to set a new password.</p>
      </div>
      {state.done ? (
        <p className="notice" role="status">Check your inbox. If an account exists for that email, a reset link is on its way.</p>
      ) : (
        <form className="stack gap-6" onSubmit={onSubmit}>
          <Input name="email" type="email" label="Email" placeholder="you@company.com" autoComplete="email" required />
          {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
          <Button type="submit" variant="primary" disabled={state.busy} style={{ width: "100%" }}>
            {state.busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="ui muted" style={{ fontWeight: 400 }}>
        <Link href="/login">Back to log in</Link>
      </p>
    </div>
  );
}

/** Set a new password. Reached from the reset link, which signs the person in for this one step. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm") ?? "")) return setState({ busy: false, error: "The two passwords do not match." });
    setState({ busy: true });
    const res = await updatePassword(password);
    if (!res.ok) return setState({ busy: false, error: res.error });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Choose a new password</h1>
        <p className="muted">Use at least 8 characters. You will stay logged in on this device.</p>
      </div>
      <form className="stack gap-6" onSubmit={onSubmit}>
        <Input name="password" type="password" label="New password" autoComplete="new-password" minLength={8} required />
        <Input name="confirm" type="password" label="Confirm new password" autoComplete="new-password" minLength={8} required />
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        <Button type="submit" variant="primary" disabled={state.busy} style={{ width: "100%" }}>
          {state.busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
