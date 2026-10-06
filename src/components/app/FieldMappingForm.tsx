"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckIcon } from "@/components/ui/Icons";
import { Panel } from "./AppShell";
import { sampleAutomation, sampleNotionProperties, sampleOptionValues, sampleStatusOptions, youtubeFields } from "@/content/app";

const NONE = "";

/** Accepts notion.so / notion.site links that contain a 32-character database ID. */
function isNotionUrl(value: string) {
  try {
    const u = new URL(value.trim());
    const hostOk = /(^|\.)notion\.(so|site)$/.test(u.hostname);
    return hostOk && /[0-9a-f]{32}/i.test(u.pathname.replace(/-/g, ""));
  } catch {
    return false;
  }
}

export function FieldMappingForm() {
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(youtubeFields.map((f) => [f.id, sampleAutomation.mapping[f.id] ?? NONE])),
  );
  const [statusProp, setStatusProp] = useState(sampleAutomation.trigger.property);
  const [statusValue, setStatusValue] = useState(sampleAutomation.trigger.value);
  const [doneValue, setDoneValue] = useState(sampleAutomation.trigger.doneValue);
  const [scheduledValue, setScheduledValue] = useState(sampleAutomation.trigger.scheduledValue);
  const [failedValue, setFailedValue] = useState(sampleAutomation.trigger.failedValue);
  const [dbUrl, setDbUrl] = useState(sampleAutomation.databaseUrl);
  const [dbCheck, setDbCheck] = useState<"idle" | "found" | "invalid">(sampleAutomation.databaseUrl ? "found" : "idle");

  // TODO: on a valid link, ask the backend to read the database through the user's Notion
  // connection and return its name and properties (then fill the dropdowns below from them).
  function checkDatabase() {
    if (!dbUrl) return setDbCheck("idle");
    setDbCheck(isNotionUrl(dbUrl) ? "found" : "invalid");
  }

  const [defaultPrivacy, setDefaultPrivacy] = useState<string>(sampleAutomation.defaultPrivacy);
  // Which pages are for YouTube: everything, or only pages where a property says so.
  const [scope, setScope] = useState<"all" | "filtered">(sampleAutomation.filter ? "filtered" : "all");
  const [filterProp, setFilterProp] = useState(sampleAutomation.filter?.property ?? "Platform");
  const [filterValue, setFilterValue] = useState(sampleAutomation.filter?.value ?? "YouTube");
  const [saved, setSaved] = useState<"idle" | "saved" | "missing">("idle");

  const missing = youtubeFields.filter((f) => f.required && !mapping[f.id]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (missing.length) {
      setSaved("missing");
      return;
    }
    // Saves every setting on the page (database, page filter, trigger, field mapping).
    // TODO: save to Supabase:
    // { mapping, defaultPrivacy, trigger: { property: statusProp, value: statusValue, doneValue, scheduledValue, failedValue },
    //   filter: scope === "all" ? null : { property: filterProp, type: filterType, value: filterType === "Checkbox" ? true : filterValue } }
    setSaved("saved");
    setTimeout(() => setSaved("idle"), 2500);
  }

  const statusProps = sampleNotionProperties.filter((p) => p.type === "Status" || p.type === "Select");
  const filterProps = sampleNotionProperties.filter((p) => ["Select", "Multi-select", "Checkbox"].includes(p.type) && p.name !== "Visibility");
  const filterType = sampleNotionProperties.find((p) => p.name === filterProp)?.type ?? "Select";
  const filterOptions = sampleOptionValues[filterProp] ?? [];
  const verb = filterType === "Multi-select" ? "includes" : filterType === "Checkbox" ? "is checked" : "is";

  function pickFilterProp(name: string) {
    setFilterProp(name);
    const opts = sampleOptionValues[name] ?? [];
    setFilterValue(opts.find((o) => /youtube/i.test(o)) ?? opts[0] ?? "");
  }

  const statusRows = [
    { id: "statusValue", label: "Start the upload", hint: "When a page reaches this status", value: statusValue, set: setStatusValue, allowUnchanged: false },
    { id: "doneValue", label: "Uploaded", hint: "After the video goes live", value: doneValue, set: setDoneValue, allowUnchanged: true },
    { id: "scheduledValue", label: "Scheduled", hint: "After upload, if it has a later publish time", value: scheduledValue, set: setScheduledValue, allowUnchanged: true },
    { id: "failedValue", label: "Failed", hint: "If the upload doesn\u2019t go through", value: failedValue, set: setFailedValue, allowUnchanged: true },
  ];


  return (
    <form id="field-mapping-form" onSubmit={onSubmit} className="stack gap-8">
      <Panel title="Content calendar" description="The Notion database we watch, which pages in it are for YouTube, and the status that starts an upload.">
        <div className="stack gap-3" style={{ maxWidth: 720 }}>
          <Input
            id="database-url"
            name="databaseUrl"
            type="url"
            label="Notion database URL"
            placeholder="https://www.notion.so/your-workspace/Content-calendar-1a2b3c4d…"
            hint="In Notion, open the database as a full page, click Share, then Copy link, and paste it here."
            value={dbUrl}
            onChange={(e) => { setDbUrl(e.target.value); setDbCheck("idle"); }}
            onBlur={checkDatabase}
            required
          />
          <p className="ui" role="status" style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 20 }}>
            {dbCheck === "found" ? (
              <>
                <span className="check-done" style={{ width: 20, height: 20 }}><CheckIcon size={12} /></span>
                <span>Found <strong style={{ fontWeight: 600 }}>{sampleAutomation.database}</strong> · {sampleNotionProperties.length} properties</span>
              </>
            ) : dbCheck === "invalid" ? (
              <span>That doesn&rsquo;t look like a Notion database link. It should start with https://www.notion.so/ or end in .notion.site.</span>
            ) : null}
          </p>
        </div>
        <div className="subpanel">
          <div className="stack gap-1">
            <h3 className="h5">Which pages are for YouTube</h3>
            <p className="ui muted" style={{ fontWeight: 400 }}>Plan Instagram, TikTok or other posts in the same calendar? Tell us how to spot the YouTube ones and we will ignore the rest.</p>
          </div>
          <fieldset className="stack gap-3" style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="visually-hidden">Which pages to upload</legend>
            <label className="check-field">
              <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} />
              <span>Every page in this database <span className="caption" style={{ display: "block" }}>For a YouTube-only calendar</span></span>
            </label>
            <label className="check-field">
              <input type="radio" name="scope" value="filtered" checked={scope === "filtered"} onChange={() => setScope("filtered")} />
              <span>Only pages marked for YouTube <span className="caption" style={{ display: "block" }}>For a calendar shared across platforms</span></span>
            </label>
          </fieldset>
          {scope === "filtered" ? (
            <div className="form-grid">
              <div className="sdl-field">
                <label className="sdl-field-label" htmlFor="filterProp">Platform property</label>
                <select id="filterProp" className="sdl-input" value={filterProp} onChange={(e) => pickFilterProp(e.target.value)}>
                  {filterProps.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.type})</option>)}
                </select>
                <span className="sdl-field-hint">The column that says where a post is going.</span>
              </div>
              {filterType === "Checkbox" ? (
                <div className="sdl-field">
                  <span className="sdl-field-label">Upload when</span>
                  <p className="sdl-input" style={{ margin: 0, background: "var(--surface)", borderColor: "var(--line)" }}>The box is checked</p>
                </div>
              ) : (
                <div className="sdl-field">
                  <label className="sdl-field-label" htmlFor="filterValue">{filterType === "Multi-select" ? "Upload when it includes" : "Upload when it is"}</label>
                  <select id="filterValue" className="sdl-input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                    {filterOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="subpanel">
          <div className="stack gap-1">
            <h3 className="h5">Upload trigger and status updates</h3>
            <p className="ui muted" style={{ fontWeight: 400 }}>Which status starts an upload, and what we change it to afterwards.</p>
          </div>
          <div className="sdl-field" style={{ maxWidth: 420 }}>
            <label className="sdl-field-label" htmlFor="statusProp">Status property</label>
            <select id="statusProp" className="sdl-input" value={statusProp} onChange={(e) => setStatusProp(e.target.value)}>
              {statusProps.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.type})</option>)}
            </select>
          </div>
          <div className="status-table" role="group" aria-label="Status options">
            <div className="status-row status-head caption" aria-hidden="true">
              <span>Trigger</span>
              <span>Status option</span>
            </div>
            {statusRows.map((r) => (
              <div key={r.id} className="status-row">
                <div className="map-field">
                  <label htmlFor={r.id} className="ui">{r.label}</label>
                  <span className="caption">{r.hint}</span>
                </div>
                <select id={r.id} className="sdl-input" value={r.value} onChange={(e) => r.set(e.target.value)}>
                  {r.allowUnchanged ? <option value="">Leave it unchanged</option> : null}
                  {sampleStatusOptions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <p className="result-note">
            <strong>Result:</strong> When a page&rsquo;s{" "}
            {scope === "filtered" ? (
              <>
                <b>{filterProp}</b> {verb}
                {filterType !== "Checkbox" ? <> <b>{filterValue}</b></> : null} and its{" "}
              </>
            ) : null}
            <b>{statusProp}</b> changes to{" "}
            <span className="status-pill" style={{ fontSize: 12, lineHeight: "16px", padding: "2px 10px" }}>{statusValue}</span>, its video uploads to YouTube
            {doneValue ? <> and the {statusProp} changes to <b>{doneValue}</b></> : null}
            {scheduledValue || failedValue ? (
              <>
                {" "}(
                {[
                  scheduledValue ? <span key="s"><b>{scheduledValue}</b> if it has a later publish time</span> : null,
                  failedValue ? <span key="f"><b>{failedValue}</b> if the upload doesn&rsquo;t go through</span> : null,
                ].filter(Boolean).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])}
                )
              </>
            ) : null}
            .{scope === "filtered" ? " Other pages are left alone." : null}
          </p>
        </div>
      </Panel>

      <Panel title="Field mapping" description="Choose the Notion property that fills each YouTube upload field." actions={<Badge tone="action">{sampleNotionProperties.length} properties found</Badge>}>
        <div className="map-table" role="group" aria-label="YouTube field to Notion property">
          <div className="map-row map-head caption" aria-hidden="true">
            <span>Notion property</span>
            <span />
            <span>YouTube field</span>
          </div>
          {youtubeFields.map((f) => {
            const options = sampleNotionProperties.filter((p) => f.accepts.includes(p.type));
            const id = `map-${f.id}`;
            return (
              <div key={f.id} className="map-row">
                <select
                  id={id}
                  className="sdl-input"
                  value={mapping[f.id]}
                  required={f.required}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.id]: e.target.value }))}
                >
                  <option value={NONE}>{f.required ? "Choose a property" : "Don\u2019t use"}</option>
                  {options.map((p) => (
                    <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
                  ))}
                </select>
                <span className="map-arrow" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M14 6l6 6-6 6" /></svg>
                </span>
                <div className="map-field">
                  <label htmlFor={id} className="ui">
                    {f.label} {f.required ? <span className="req" aria-label="required">*</span> : null}
                  </label>
                  <span className="caption">{f.hint}</span>
                </div>
              </div>
            );
          })}
        </div>
        {!mapping.privacy ? (
          <div className="sdl-field" style={{ maxWidth: 420 }}>
            <label className="sdl-field-label" htmlFor="defaultPrivacy">Default visibility</label>
            <select id="defaultPrivacy" className="sdl-input" value={defaultPrivacy} onChange={(e) => setDefaultPrivacy(e.target.value)}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
            <span className="sdl-field-hint">Used when no visibility property is mapped.</span>
          </div>
        ) : null}
      </Panel>

      <div className="save-bar">
        <span className="ui" role="status" style={{ fontWeight: 400 }}>
          {saved === "saved" ? "All settings on this page are saved." : saved === "missing" ? `Choose a property for: ${missing.map((m) => m.label).join(", ")}.` : "Saves everything on this page. Fields marked * are required."}
        </span>
        <Button type="submit" variant="primary">Save</Button>
      </div>
    </form>
  );
}
