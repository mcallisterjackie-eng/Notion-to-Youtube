import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/app/AuthFrame";
import { LoginForm } from "@/components/app/AuthForms";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthFrame>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
