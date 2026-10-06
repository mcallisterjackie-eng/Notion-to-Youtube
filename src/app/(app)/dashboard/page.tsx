import type { Metadata } from "next";
import { getSessionClaims } from "@/lib/session";
import { toDisplayUser } from "@/lib/user";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { AppIcon } from "@/components/app/AppIcons";
import { StatTile, StatusBadge } from "@/components/app/StatusBadge";
import { describeFilter, sampleAutomation, sampleConnections, sampleSetup, sampleStats, sampleUploads, youtubeFields } from "@/content/app";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const first = toDisplayUser(await getSessionClaims()).name.split(" ")[0];
  // The Automation card reads the same saved settings that Connections and Field Mapping edit.
  const auto = sampleAutomation;
  const { notion, youtube } = sampleConnections;
  const mappedFields = youtubeFields.filter((f) => auto.mapping[f.id]);
  // SAMPLE: derive these from the user's real setup state.
  const setup = [
    { label: "Connect Notion", done: sampleConnections.notion.connected, href: "/dashboard/connections" },
    { label: "Connect YouTube", done: sampleConnections.youtube.connected, href: "/dashboard/connections" },
    { label: "Map your fields", done: true, href: "/dashboard/field-mapping" },
    { label: "Upload your first video", done: false, href: "/dashboard/field-mapping" },
  ];
  const doneCount = setup.filter((s) => s.done).length;
  const allDone = doneCount === setup.length;

  // The Setup card shows until every step is done. It stays for the rest of the session in
  // which setup finishes, then is hidden from the next login on.
  // TODO (Supabase): store profiles.setup_completed_at when the last step finishes, and compare
  // it with the current session's start time: completed before this session began → hide.
  const completedBeforeThisSession = sampleSetup.completedBeforeThisSession;
  const showSetup = !(allDone && completedBeforeThisSession);

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
              <dd>{notion.connected ? notion.account : "Not connected"}</dd>
              <dt>YouTube</dt>
              <dd>{youtube.connected ? youtube.account : "Not connected"}</dd>
            </dl>
          </div>
          <div className="auto-group">
            <div className="split" style={{ alignItems: "center" }}>
              <p className="eyebrow" style={{ color: "var(--ink-muted)" }}>From Field Mapping</p>
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

        {showSetup ? (
        <Panel title="Setup" description={allDone ? "All set. This card will not appear next time you log in." : "A few steps to get your first upload going."}>
          <Progress label="Setup progress" value={doneCount} max={setup.length} />
          <ul className="checklist">
            {setup.map((s) => (
              <li key={s.label}>
                {s.done ? (
                  <span className="check-done"><AppIcon name="check" size={16} /></span>
                ) : (
                  <span className="check-todo" aria-hidden="true" />
                )}
                <span className={s.done ? "muted" : undefined}>
                  {s.done ? <span className="visually-hidden">Done: </span> : null}
                  {s.done ? s.label : <Link href={s.href}>{s.label}</Link>}
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
