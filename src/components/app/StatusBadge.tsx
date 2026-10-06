import type { UploadStatus } from "@/content/app";
import { AppIcon } from "./AppIcons";

/** Upload status: always an icon plus a label, never colour alone. */
export function StatusBadge({ status }: { status: UploadStatus }) {
  const map = {
    Uploaded: { cls: "status-ok", icon: "check" as const },
    Scheduled: { cls: "status-scheduled", icon: "clock" as const },
    Failed: { cls: "status-failed", icon: "alert" as const },
  }[status];
  return (
    <span className={`status-badge ${map.cls}`}>
      <AppIcon name={map.icon} size={14} />
      {status}
    </span>
  );
}

/** Small stat tile: label, value, optional note. */
export function StatTile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="stat-tile">
      <p className="ui muted">{label}</p>
      <p className="stat-value">{value}</p>
      {note ? <p className="caption">{note}</p> : null}
    </div>
  );
}
