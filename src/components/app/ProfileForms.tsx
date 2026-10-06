"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "./AppShell";
import { sampleUser } from "@/content/app";

const timezones = ["America/Vancouver", "America/Edmonton", "America/Chicago", "America/Toronto", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Australia/Sydney"];

function useSaved() {
  const [saved, setSaved] = useState(false);
  return {
    saved,
    // TODO: write to Supabase (profiles table / auth.updateUser) before confirming.
    onSubmit: (e: FormEvent) => {
      e.preventDefault();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  };
}

function SavedNote({ show, text = "Saved" }: { show: boolean; text?: string }) {
  return <span className="ui" role="status" style={{ color: "var(--link)" }}>{show ? text : ""}</span>;
}

export function ProfileForms() {
  const details = useSaved();
  const password = useSaved();
  const prefs = useSaved();
  const user = sampleUser; // TODO: signed-in user

  return (
    <>
      <Panel title="Personal details">
        <div className="row" style={{ gap: "var(--space-4)" }}>
          <span className="avatar avatar-lg" aria-hidden="true">{user.initials}</span>
          <div className="stack">
            <span className="h5">{user.name}</span>
            <span className="caption">{user.email}</span>
          </div>
        </div>
        <form className="stack gap-6" onSubmit={details.onSubmit}>
          <div className="form-grid">
            <Input name="name" label="Name" defaultValue={user.name} autoComplete="name" required />
            <Input name="email" type="email" label="Email" defaultValue={user.email} autoComplete="email" hint="We will send a confirmation link if you change it." required />
          </div>
          <div className="row">
            <Button type="submit" variant="primary">Save changes</Button>
            <SavedNote show={details.saved} />
          </div>
        </form>
      </Panel>

      <div className="panel-grid">
        <Panel title="Password">
          <form className="stack gap-6" onSubmit={password.onSubmit}>
            <Input name="current" type="password" label="Current password" autoComplete="current-password" required />
            <Input name="new" type="password" label="New password" hint="At least 8 characters" autoComplete="new-password" minLength={8} required />
            <div className="row">
              <Button type="submit" variant="secondary">Update password</Button>
              <SavedNote show={password.saved} text="Password updated" />
            </div>
          </form>
        </Panel>

        <Panel title="Preferences">
          <form className="stack gap-6" onSubmit={prefs.onSubmit}>
            <div className="sdl-field">
              <label className="sdl-field-label" htmlFor="timezone">Time zone</label>
              <select id="timezone" name="timezone" className="sdl-input" defaultValue={user.timezone}>
                {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
              </select>
              <span className="sdl-field-hint">Used for scheduled publish times.</span>
            </div>
            <label className="check-field">
              <input type="checkbox" name="notifyFailures" defaultChecked />
              <span>Email me when an upload does not go through</span>
            </label>
            <div className="row">
              <Button type="submit" variant="secondary">Save preferences</Button>
              <SavedNote show={prefs.saved} />
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Delete account" description="Removes your account, connections and mappings. Videos already on YouTube stay there. This cannot be undone.">
        <div><Button variant="secondary">Delete account</Button></div>
      </Panel>
    </>
  );
}
