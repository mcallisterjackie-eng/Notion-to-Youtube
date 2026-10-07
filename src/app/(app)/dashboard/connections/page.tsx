import type { Metadata } from "next";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { ConnectionCard, toCardData } from "@/components/app/connections/ConnectionCard";
import { ConnectNotice } from "@/components/app/connections/ConnectNotice";
import { DatabasePicker } from "@/components/app/connections/DatabasePicker";
import { getCurrentAccount } from "@/lib/account";
import { PROVIDER_ACCESS, PROVIDER_NAMES } from "@/lib/connection-messages";
import { configuredProviders, getConnections, getDataSource } from "@/lib/connections";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentAccount();
  if (!me) throw new Error("Your account could not be loaded.");
  const [connections, dataSource] = await Promise.all([getConnections(me.account.id), getDataSource(me.account.id)]);
  const available = configuredProviders();
  const tz = me.account.timezone;
  const returnTo = "/dashboard/connections";

  return (
    <>
      <AppPageHeader title="Connections" description="The Notion workspace you plan in, the YouTube channel you publish to, and the Google Drive your videos live in." />
      <ConnectNotice searchParams={await searchParams} />

      <div className="panel-grid">
        <ConnectionCard
          provider="notion"
          data={toCardData(connections.notion)}
          available={available.notion}
          returnTo={returnTo}
          timeZone={tz}
          disconnectWarning="Your chosen database will be cleared."
        />
        <ConnectionCard provider="youtube" data={toCardData(connections.youtube)} available={available.youtube} returnTo={returnTo} timeZone={tz} />
        <ConnectionCard provider="google_drive" data={toCardData(connections.google_drive)} available={available.google_drive} returnTo={returnTo} timeZone={tz} />
      </div>

      <Panel title="Content calendar" description="The Notion database you plan your videos in.">
        <DatabasePicker accountId={me.account.id} current={dataSource} notionConnected={connections.notion?.status === "connected"} />
      </Panel>

      <Panel title="What we can access" description="We only ask for what uploading needs. You can disconnect at any time.">
        <ul className="stack gap-3" style={{ margin: 0, paddingLeft: 20 }}>
          {(["notion", "youtube", "google_drive"] as const).map((p) => (
            <li key={p}>
              <strong style={{ fontWeight: 600 }}>{PROVIDER_NAMES[p]}:</strong> <span className="muted">{PROVIDER_ACCESS[p]}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
