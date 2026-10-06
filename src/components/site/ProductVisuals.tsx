import { Badge } from "@/components/ui/Badge";
import { CheckIcon, PlayIcon } from "@/components/ui/Icons";
import { calendarRows, mappings } from "@/content/product";

/** Hero illustration: a Notion content calendar, one row Ready to Upload, and the YouTube result. */
export function CalendarVisual() {
  return (
    <figure className="hero-visual calendar-visual" aria-label="Illustration: a video set to Ready to Upload in a Notion content calendar is uploaded to YouTube">
      <div className="backdrop" aria-hidden="true" />
      <span className="module" aria-hidden="true" style={{ right: 32, top: 24, width: 56, height: 56, borderRadius: 14, background: "var(--cyan)" }} />
      <span className="module" aria-hidden="true" style={{ right: 104, top: 64, width: 36, height: 36, borderRadius: 9, background: "var(--violet)" }} />
      <span className="module" aria-hidden="true" style={{ right: 40, top: 96, width: 30, height: 30, borderRadius: 8, background: "var(--orange)" }} />

      <div className="calendar-card">
        <div className="calendar-head">
          <p className="h5">Content calendar</p>
          <span className="caption">Notion database</span>
        </div>
        <div className="calendar-table">
          <div className="calendar-row calendar-cols caption">
            <span>Name</span>
            <span>Publish</span>
            <span>Status</span>
          </div>
          {calendarRows.map((r) => (
            <div key={r.title} className={`calendar-row${r.ready ? " is-ready" : ""}`}>
              <span className="truncate ui">{r.title}</span>
              <span className="caption">{r.date}</span>
              <span className={r.ready ? "status-pill" : "status-pill is-neutral"}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="upload-card">
        <span className="result-dot"><CheckIcon size={14} /></span>
        <div className="stack" style={{ minWidth: 0 }}>
          <span className="ui truncate">Uploaded to YouTube</span>
          <span className="caption">Scheduled for Oct 16, 9:00 AM</span>
        </div>
        <span className="play-dot" style={{ color: "var(--white)", marginLeft: "auto" }}><PlayIcon size={14} /></span>
      </div>
    </figure>
  );
}

function ArrowRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--line-strong)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

/** Illustration of the field-mapping screen. */
export function MappingCard() {
  return (
    <figure className="mapping-card" aria-label="Illustration: Notion properties mapped to YouTube upload fields">
      <div className="split" style={{ alignItems: "center" }}>
        <div className="stack" style={{ gap: 2 }}>
          <p className="h5">Field mapping</p>
          <p className="caption">Content calendar to YouTube upload</p>
        </div>
        <Badge tone="action">Connected</Badge>
      </div>
      <div className="mapping-grid">
        <div className="mapping-row">
          <p className="eyebrow mapping-head">Notion</p>
          <span aria-hidden="true" />
          <p className="eyebrow mapping-head">YouTube</p>
        </div>
        {mappings.map((m) => (
          <div className="mapping-row" key={m.from}>
            <div className="mapping-from">
              <span className="truncate">{m.from}</span>
              <span className="caption">{m.type}</span>
            </div>
            <ArrowRight />
            <span className="visually-hidden">maps to</span>
            <div className="mapping-to truncate">{m.to}</div>
          </div>
        ))}
      </div>
      <div className="mapping-trigger">
        <span className="ui muted">Upload when Status is</span>
        <span className="status-pill">Ready to Upload</span>
      </div>
    </figure>
  );
}
