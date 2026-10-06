import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { AppIcon, type IconName } from "@/components/app/AppIcons";
import { sampleConnections } from "@/content/app";

export const metadata: Metadata = { title: "Connections" };

/**
 * TODO: "Connect" starts each service's OAuth flow (Notion OAuth; Google OAuth with the
 * YouTube upload scope). "Disconnect" revokes the token and clears it from Supabase.
 */
function ConnectionPanel({
  name,
  icon,
  tint,
  what,
  conn,
  accountLabel,
  extra,
}: {
  name: string;
  icon: IconName;
  tint: string;
  what: string;
  conn: { connected: boolean; account: string; connectedOn: string; database: string | null };
  accountLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <Panel>
      <div className="connection-card">
        <div className="connection-head">
          <span className="connection-icon" style={{ background: tint }}><AppIcon name={icon} size={24} /></span>
          <div className="stack" style={{ flex: 1, minWidth: 0 }}>
            <h2 className="h4">{name}</h2>
            <p className="caption">{what}</p>
          </div>
          {conn.connected ? <Badge tone="action">Connected</Badge> : <Badge>Not connected</Badge>}
        </div>
        {conn.connected ? (
          <dl className="kv">
            <dt>{accountLabel}</dt>
            <dd className="truncate">{conn.account}</dd>
            {conn.database ? (<><dt>Database</dt><dd className="truncate">{conn.database}</dd></>) : null}
            <dt>Connected</dt>
            <dd>{conn.connectedOn}</dd>
          </dl>
        ) : null}
        <div className="row">
          {conn.connected ? (
            <>
              {extra}
              <Button variant="ghost" size="sm">Disconnect</Button>
            </>
          ) : (
            <Button variant="primary">Connect {name}</Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default function ConnectionsPage() {
  return (
    <>
      <AppPageHeader title="Connections" description="The Notion workspace you plan in and the YouTube channel you publish to." />
      <div className="panel-grid">
        <ConnectionPanel
          name="Notion"
          icon="database"
          tint="var(--surface)"
          what="Reads your content calendar database"
          conn={sampleConnections.notion}
          accountLabel="Workspace"
          extra={<Button href="/dashboard/field-mapping" variant="secondary" size="sm">Change database</Button>}
        />
        <ConnectionPanel
          name="YouTube"
          icon="play"
          tint="var(--surface)"
          what="Uploads videos to your channel"
          conn={sampleConnections.youtube}
          accountLabel="Channel"
        />
      </div>
      <Panel title="What we can access" description="We only ask for what the upload needs.">
        <ul className="stack gap-3" style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong style={{ fontWeight: 600 }}>Notion:</strong> <span className="muted">the database you choose and its pages, to read the fields you map.</span></li>
          <li><strong style={{ fontWeight: 600 }}>YouTube:</strong> <span className="muted">permission to upload videos and set their details on your channel.</span></li>
          <li className="muted">[Confirm against the final OAuth scopes before launch.]</li>
        </ul>
      </Panel>
    </>
  );
}
