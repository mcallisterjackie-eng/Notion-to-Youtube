import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/app/AuthFrame";
import { LoginForm } from "@/components/app/AuthForms";
import { getAuthProviders } from "@/lib/auth-providers";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage() {
  const { google } = await getAuthProviders();
  return (
    <AuthFrame>
      <Suspense>
        <LoginForm googleEnabled={google} />
      </Suspense>
    </AuthFrame>
  );
}
