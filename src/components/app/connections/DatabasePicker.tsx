import { listNotionDatabases, type DataSource } from "@/lib/connections";
import { ProviderError } from "@/lib/integrations/http";
import { log } from "@/lib/log";
import { connectionErrorMessage } from "@/lib/connection-messages";
import { DatabasePickerForm } from "./DatabasePickerForm";

/**
 * Lets the customer choose the content calendar (Design Spec §2, Phase 3 step 5).
 * Lists only what they shared with the app in Notion, read live from Notion.
 */
export async function DatabasePicker({ accountId, current, notionConnected }: { accountId: string; current: DataSource | null; notionConnected: boolean }) {
  if (!notionConnected) {
    return <p className="muted">Connect Notion first. Then choose the database you plan your videos in.</p>;
  }

  let options: { id: string; name: string; url: string | null }[] = [];
  let problem: string | null = null;
  try {
    options = await listNotionDatabases(accountId);
  } catch (err) {
    log.warn("setup.listDatabases", err instanceof Error ? err.message : "unknown error");
    problem = err instanceof ProviderError && err.kind === "auth" ? connectionErrorMessage("reconnect_required", "notion") : connectionErrorMessage("service_unavailable", "notion");
  }

  return (
    <div className="stack gap-6">
      {current ? (
        <p className="ui" style={{ fontWeight: 400 }}>
          Selected: <strong style={{ fontWeight: 600 }}>{current.name ?? "Untitled"}</strong>
          {current.url ? <> · <a href={current.url} target="_blank" rel="noopener noreferrer">Open in Notion</a></> : null}
        </p>
      ) : null}
      {problem ? (
        <p className="notice notice-problem" role="status">{problem}</p>
      ) : options.length === 0 ? (
        <div className="stack gap-2">
          <p className="ui">No databases are shared with the app yet.</p>
          <p className="muted">In Notion, open your content calendar, choose ••• then Connections, and add this app. Then refresh this page.</p>
        </div>
      ) : (
        <>
          <DatabasePickerForm options={options} selectedId={current?.external_id ?? null} />
          <p className="caption">Not in the list? In Notion, open the database, choose ••• then Connections, and add this app. Then refresh this page.</p>
        </>
      )}
    </div>
  );
}
