import type { Metadata } from "next";
import { AuthFrame } from "@/components/app/AuthFrame";
import { ForgotPasswordForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthFrame>
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
