import type { Metadata } from "next";
import { AppPageHeader } from "@/components/app/AppShell";
import { ProfileForms } from "@/components/app/ProfileForms";
import { getCurrentAccount } from "@/lib/account";
import { toDisplayUser } from "@/lib/user";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const me = await getCurrentAccount();
  if (!me) throw new Error("Your account could not be loaded.");
  const user = toDisplayUser({ email: me.email, user_metadata: { full_name: me.profile.full_name } });
  return (
    <>
      <AppPageHeader title="My Profile" description="Your account details, password and preferences." />
      <ProfileForms name={me.profile.full_name || user.name} email={me.email} initials={user.initials} timezone={me.account.timezone} hasPassword={me.hasPassword} />
    </>
  );
}
