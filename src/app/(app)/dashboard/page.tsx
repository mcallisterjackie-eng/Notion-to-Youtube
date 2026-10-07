import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/account";
import { toDisplayUser } from "@/lib/user";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { AppIcon } from "@/components/app/AppIcons";
import { StatTile, StatusBadge } from "@/components/app/StatusBadge";
import { describeFilter, sampleAutomation, sampleStats, sampleUploads, youtubeFields } from "@/content/app";
import { STATUS_LABELS } from "@/lib/connection-messages";
import { getConnections, getDataSource } from "@/lib/connections";
import { setupProgress } from "@/lib/setup";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const me = await getCurrentAccount();
  if (!me) throw new Error("Your account could not be loaded.");
  const first = toDisplayUser({ email: me.email, user_metadata: { full_name: me.profile.full_name } }).name.split(" ")[0];
  const [connections, dataSource] = await Promise.all([getConnections(me.account.id), getDataSource(me.account.id)]);
  const progress = setupProgress(connections, Boolean(dataSource), Boolean(me.account.timezone_confirmed_at));
  // SAMPLE until Phases 4–5: mapping and trigger settings.
  const auto = sampleAutomation;
  const mappedFields = youtubeFields.filter((f) => auto.mapping[f.id]);
  const setup = [
    { key: "notion", label: "Connect Notion", done: progress.steps.notion },
    { key: "youtube", label: "Connect YouTube", done: progress.steps.youtube },
    { key: "google_drive", label: "Connect Google Drive", done: progress.steps.google_drive },
    { key: "database", label: "Choose your content calendar", done: progress.steps.database },
    { key: "timezone", label: "Confirm your time zone", done: progress.steps.timezone },
  ];
  const connectionLabel = (p: "notion" | "youtube" | "google_drive") => {
    const c = connections[p];
    if (!c || c.status === "not_connected") return "Not connected";
    if (c.status !== "connected") return STATUS_LABELS[c.status];
    return c.external_account_name ?? STATUS_LABELS.connected;
  };

  return (
    <>
      <AppPageHeader
        title={`Welcome back, ${first}`}
        description="Here is what is happening between your content calendar and your channel."
        actions={<Button href="/dashboard/field-mapping" variant="secondary">Edit field mapping</Button>}
      />

      <div className="panel-grid">
        <Panel title="Automation" description="Your current settings. Videos upload when a page matches all of these.">
          <div className="auto-group">
            <div className="split" style={{ alignItems: "center" }}>
              <p className="eyebrow" style={{ color: "var(--ink-muted)" }}>From Connections</p>
              <Link href="/dashboard/connections" className="ui">Edit</Link>
            </div>
            <dl className="kv">
              <dt>Notion</dt>
              <dd>{connectionLabel("notion")}</dd>
              <dt>YouTube</dt>
              <dd>{connectionLabel("youtube")}</dd>
              <dt>Google Drive</dt>
              <dd>{connectionLabel("google_drive")}</dd>
            </dl>
          </div>
          <div className="auto-group">
            <div className="split" style={{ alignItems: "center" }}>
              <p className="eyebrow" style={{ color: "var(--ink-muted)" }}>From Field Mapping (sample)</p>
              <Link href="/dashboard/field-mapping" className="ui">Edit</Link>
            </div>
            <dl className="kv">
              <dt>Database</dt>
              <dd>{auto.database}</dd>
              <dt>Pages</dt>
              <dd>{describeFilter(auto.filter)}</dd>
              <dt>Uploads when</dt>
              <dd><span className="status-pill" style={{ fontSize: 12, lineHeight: "16px", padding: "4px 10px" }}>{auto.trigger.property} is {auto.trigger.value}</span></dd>
              <dt>After upload</dt>
              <dd>
                {auto.trigger.doneValue ? `${auto.trigger.property} set to ${auto.trigger.doneValue}` : "Status left unchanged"}
                {[auto.trigger.scheduledValue && `${auto.trigger.scheduledValue} if scheduled`, auto.trigger.failedValue && `${auto.trigger.failedValue} if it fails`].filter(Boolean).length
                  ? ` (${[auto.trigger.scheduledValue && `${auto.trigger.scheduledValue} if scheduled`, auto.trigger.failedValue && `${auto.trigger.failedValue} if it fails`].filter(Boolean).join(", ")})`
                  : ""}
              </dd>
              <dt>Fields mapped</dt>
              <dd>{mappedFields.length} of {youtubeFields.length}: {mappedFields.map((f) => f.label).join(", ")}</dd>
            </dl>
          </div>
        </Panel>

        {!progress.complete ? (
          <Panel title="Setup" description="A few steps to get your first upload going." actions={<Button href="/dashboard/setup" variant="secondary" size="sm">Continue setup</Button>}>
            <Progress label="Setup progress" value={progress.done} max={progress.total} />
            <ul className="checklist">
              {setup.map((s) => (
                <li key={s.key}>
                  {s.done ? (
                    <span className="check-done"><AppIcon name="check" size={16} /></span>
                  ) : (
                    <span className="check-todo" aria-hidden="true" />
                  )}
                  <span className={s.done ? "muted" : undefined}>
                    {s.done ? <span className="visually-hidden">Done: </span> : null}
                    {s.done ? s.label : <Link href={`/dashboard/setup?step=${s.key}`}>{s.label}</Link>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>

      <div className="stat-grid">
        <StatTile label="Uploaded this month" value={sampleStats.uploadedThisMonth} />
        <StatTile label="Scheduled" value={sampleStats.scheduled} note="Uploaded, waiting to go live" />
        <StatTile label="Needs attention" value={sampleStats.needsAttention} note="Uploads that did not go through" />
      </div>

      <Panel title="Recent uploads" actions={<Button href="/dashboard/analytics" variant="ghost" size="sm">See all</Button>}>
        <div className="list">
          {sampleUploads.slice(0, 4).map((u) => (
            <div key={u.title} className="list-row">
              <div className="stack" style={{ minWidth: 0, flex: "1 1 260px" }}>
                <span className="ui">{u.title}</span>
                <span className="caption">{u.date} · {u.detail}</span>
              </div>
              <StatusBadge status={u.status} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
