import type { Metadata } from "next";
import { AuthFrame } from "@/components/app/AuthFrame";
import { SignupForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignupPage() {
  return (
    <AuthFrame>
      <SignupForm />
    </AuthFrame>
  );
}
