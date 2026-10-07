"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { updateName, updateTimezone, type ActionResult } from "@/app/(app)/dashboard/profile/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changeEmail, changePassword } from "@/lib/auth";
import { checkEmail, listTimezones } from "@/lib/profile-validation";
import { Panel } from "./AppShell";

export type ProfileFormsProps = {
  name: string;
  email: string;
  initials: string;
  timezone: string;
  /** False for people who only sign in with Google: there is no password to change. */
  hasPassword: boolean;
};

type Status = { busy: boolean; message?: string; error?: string };

/** One form's busy / saved / error state. */
function useStatus() {
  const [status, setStatus] = useState<Status>({ busy: false });
  return {
    status,
    start: () => setStatus({ busy: true }),
    done: (res: ActionResult, message = "Saved") => setStatus(res.ok ? { busy: false, message } : { busy: false, error: res.error }),
  };
}

function StatusNote({ status }: { status: Status }) {
  if (status.error) return <p className="form-error" role="alert">{status.error}</p>;
  return <span className="ui" role="status" style={{ color: "var(--link)" }}>{status.message ?? ""}</span>;
}

export function ProfileForms({ name, email, initials, timezone, hasPassword }: ProfileFormsProps) {
  const router = useRouter();
  const details = useStatus();
  const password = useStatus();
  const prefs = useStatus();
  const timezones = useMemo(() => {
    const all = listTimezones();
    return all.includes(timezone) ? all : [timezone, ...all];
  }, [timezone]);

  async function onDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    details.start();

    const nameResult = await updateName(data);
    if (!nameResult.ok) return details.done(nameResult);

    const newEmail = String(data.get("email") ?? "").trim();
    if (newEmail.toLowerCase() !== email.toLowerCase()) {
      const checked = checkEmail(newEmail);
      if (!checked.ok) return details.done(checked);
      const emailResult = await changeEmail(checked.value);
      if (!emailResult.ok) return details.done(emailResult);
      router.refresh();
      return details.done({ ok: true }, `Check ${checked.value} for a confirmation link. Your email changes once you open it.`);
    }
    router.refresh();
    details.done({ ok: true });
  }

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    password.start();
    const res = await changePassword(email, String(data.get("current") ?? ""), String(data.get("new") ?? ""));
    if (res.ok) form.reset();
    password.done(res, "Password updated");
  }

  async function onPrefs(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    prefs.start();
    const res = await updateTimezone(new FormData(e.currentTarget));
    if (res.ok) router.refresh();
    prefs.done(res);
  }

  return (
    <>
      <Panel title="Personal details">
        <div className="row" style={{ gap: "var(--space-4)" }}>
          <span className="avatar avatar-lg" aria-hidden="true">{initials}</span>
          <div className="stack">
            <span className="h5">{name}</span>
            <span className="caption">{email}</span>
          </div>
        </div>
        <form className="stack gap-6" onSubmit={onDetails}>
          <div className="form-grid">
            <Input name="name" label="Name" defaultValue={name} autoComplete="name" maxLength={200} required />
            <Input name="email" type="email" label="Email" defaultValue={email} autoComplete="email" hint="We will send a confirmation link if you change it." required />
          </div>
          <div className="row">
            <Button type="submit" variant="primary" disabled={details.status.busy}>{details.status.busy ? "Saving…" : "Save changes"}</Button>
            <StatusNote status={details.status} />
          </div>
        </form>
      </Panel>

      <div className="panel-grid">
        <Panel title="Password">
          {hasPassword ? (
            <form className="stack gap-6" onSubmit={onPassword}>
              <Input name="current" type="password" label="Current password" autoComplete="current-password" required />
              <Input name="new" type="password" label="New password" hint="At least 8 characters" autoComplete="new-password" minLength={8} required />
              <div className="row">
                <Button type="submit" variant="secondary" disabled={password.status.busy}>{password.status.busy ? "Updating…" : "Update password"}</Button>
                <StatusNote status={password.status} />
              </div>
            </form>
          ) : (
            <p className="muted">You sign in with Google, so there is no password to manage here. Google keeps your sign-in secure.</p>
          )}
        </Panel>

        <Panel title="Preferences">
          <form className="stack gap-6" onSubmit={onPrefs}>
            <div className="sdl-field">
              <label className="sdl-field-label" htmlFor="timezone">Time zone</label>
              <select id="timezone" name="timezone" className="sdl-input" defaultValue={timezone}>
                {timezones.map((tz) => <option key={tz} value={tz}>{tz.replaceAll("_", " ")}</option>)}
              </select>
              <span className="sdl-field-hint">Used to read the publish dates and times in your Notion calendar.</span>
            </div>
            <label className="check-field" aria-disabled="true" style={{ opacity: 0.45 }}>
              <input type="checkbox" name="notifyFailures" disabled />
              <span>Email me when an upload does not go through (not available yet)</span>
            </label>
            <div className="row">
              <Button type="submit" variant="secondary" disabled={prefs.status.busy}>{prefs.status.busy ? "Saving…" : "Save preferences"}</Button>
              <StatusNote status={prefs.status} />
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Delete account" description="Removes your account, connections and mappings. Videos already on YouTube stay there. This cannot be undone.">
        <div className="stack gap-2">
          <div><Button variant="secondary" disabled>Delete account</Button></div>
          <p className="caption">Account deletion will be available before launch.</p>
        </div>
      </Panel>
    </>
  );
}
