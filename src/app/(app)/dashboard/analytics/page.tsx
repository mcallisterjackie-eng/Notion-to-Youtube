import type { Metadata } from "next";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { StatTile, StatusBadge } from "@/components/app/StatusBadge";
import { UploadsChart } from "@/components/app/UploadsChart";
import { sampleStats, sampleUploads, sampleWeekly } from "@/content/app";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const total = sampleWeekly.reduce((n, w) => n + w.uploads, 0);

  return (
    <>
      <AppPageHeader title="Analytics" description="How your uploads are going, from the moment a status changes in Notion." />

      <div className="stat-grid">
        <StatTile label="Uploads, last 8 weeks" value={total} />
        <StatTile label="Uploaded this month" value={sampleStats.uploadedThisMonth} />
        <StatTile label="Scheduled" value={sampleStats.scheduled} />
        <StatTile label="Needs attention" value={sampleStats.needsAttention} />
      </div>

      <Panel title="Uploads per week" description="Last 8 weeks">
        <UploadsChart data={sampleWeekly} />
      </Panel>

      <Panel title="Upload history">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Video</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {sampleUploads.map((u) => (
                <tr key={u.title}>
                  <td style={{ fontWeight: 500, minWidth: 220 }}>{u.title}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>{u.date}</td>
                  <td className="muted" style={{ minWidth: 220 }}>{u.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
