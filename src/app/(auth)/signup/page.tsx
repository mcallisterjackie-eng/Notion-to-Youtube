import type { Metadata } from "next";
import { AuthFrame } from "@/components/app/AuthFrame";
import { SignupForm } from "@/components/app/AuthForms";
import { getAuthProviders } from "@/lib/auth-providers";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function SignupPage() {
  const { google } = await getAuthProviders();
  return (
    <AuthFrame>
      <SignupForm googleEnabled={google} />
    </AuthFrame>
  );
}
