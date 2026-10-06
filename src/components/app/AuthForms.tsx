"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPasswordReset, signIn, signUp } from "@/lib/auth";

type State = { busy: boolean; error?: string; done?: boolean };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ busy: true });
    const res = await signIn(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    if (res.ok) router.push("/dashboard");
    else setState({ busy: false, error: res.error });
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Log in</h1>
        <p className="muted">Welcome back. Your uploads have been running while you were away.</p>
      </div>
      {params.get("signedOut") ? <p className="notice" role="status">You have been logged out.</p> : null}
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

export function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ busy: true });
    const res = await signUp(String(data.get("name") ?? ""), String(data.get("email") ?? ""), String(data.get("password") ?? ""));
    // TODO: after sign-up, send new users to Stripe Checkout (or /dashboard/billing) to start the subscription.
    if (res.ok) router.push("/dashboard");
    else setState({ busy: false, error: res.error });
  }

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h1 className="h2">Create your account</h1>
        <p className="muted">Connect Notion and YouTube in a few minutes.</p>
      </div>
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
