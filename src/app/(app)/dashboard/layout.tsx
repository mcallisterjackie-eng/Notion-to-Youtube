import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
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
  const claims = await getSessionClaims();
  if (!claims) redirect(LOGIN_PATH);
  return <AppShell user={toDisplayUser(claims)}>{children}</AppShell>;
}
