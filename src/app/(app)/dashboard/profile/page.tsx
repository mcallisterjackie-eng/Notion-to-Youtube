import type { Metadata } from "next";
import { AppPageHeader } from "@/components/app/AppShell";
import { ProfileForms } from "@/components/app/ProfileForms";

export const metadata: Metadata = { title: "My Profile" };

export default function ProfilePage() {
  return (
    <>
      <AppPageHeader title="My Profile" description="Your account details, password and preferences." />
      <ProfileForms />
    </>
  );
}
