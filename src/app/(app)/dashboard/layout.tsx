import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { getCurrentAccount } from "@/lib/account";
import { LOGIN_PATH } from "@/lib/routes";
import { getSessionClaims } from "@/lib/session";
import { toDisplayUser } from "@/lib/user";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard" },
  robots: { index: false, follow: false },
};

/**
 * Everything under /dashboard is for signed-in users. src/proxy.ts already
 * redirects signed-out visitors; this server-side check is the second line of defence.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSessionClaims())) redirect(LOGIN_PATH);
  const me = await getCurrentAccount();
  // Signed in but no account: the sign-up trigger failed. Show the error page rather than an empty app.
  if (!me) throw new Error("Your account could not be loaded.");
  const user = toDisplayUser({ email: me.email, user_metadata: { full_name: me.profile.full_name } });
  return <AppShell user={user}>{children}</AppShell>;
}
