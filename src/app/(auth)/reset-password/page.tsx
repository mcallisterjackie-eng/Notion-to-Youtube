import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/components/app/AuthFrame";
import { ResetPasswordForm } from "@/components/app/AuthForms";
import { getSessionClaims } from "@/lib/session";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Reached from the password-reset email via /auth/callback, which signs the person in first. */
export default async function ResetPasswordPage() {
  const claims = await getSessionClaims();
  return (
    <AuthFrame>
      {claims ? (
        <ResetPasswordForm />
      ) : (
        <div className="stack gap-8">
          <div className="stack gap-2">
            <h1 className="h2">This link has expired</h1>
            <p className="muted">Password reset links work once and expire after a short time. Request a new one to continue.</p>
          </div>
          <p className="ui muted" style={{ fontWeight: 400 }}>
            <Link href="/forgot-password">Send a new reset link</Link>
          </p>
        </div>
      )}
    </AuthFrame>
  );
}
