import type { Metadata } from "next";
import { AppPageHeader } from "@/components/app/AppShell";
import { ProfileForms } from "@/components/app/ProfileForms";
import { getSessionClaims } from "@/lib/session";
import { toDisplayUser } from "@/lib/user";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = toDisplayUser(await getSessionClaims());
  return (
    <>
      <AppPageHeader title="My Profile" description="Your account details, password and preferences." />
      <ProfileForms user={user} />
    </>
  );
}
