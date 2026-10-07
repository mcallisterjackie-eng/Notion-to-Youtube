"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { confirmTimezoneAction } from "@/app/(app)/dashboard/connections/actions";
import { Button } from "@/components/ui/Button";
import { listTimezones } from "@/lib/profile-validation";

/** Onboarding step: confirm the time zone used to read publish dates (Design Spec §13). */
export function TimezoneConfirm({ timezone, confirmed }: { timezone: string; confirmed: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string; saved?: boolean }>({ busy: false });
  const zones = useMemo(() => {
    const all = listTimezones();
    return all.includes(timezone) ? all : [timezone, ...all];
  }, [timezone]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ busy: true });
    const res = await confirmTimezoneAction(new FormData(e.currentTarget));
    setState(res.ok ? { busy: false, saved: true } : { busy: false, error: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <form className="stack gap-6" onSubmit={onSubmit}>
      <div className="sdl-field">
        <label className="sdl-field-label" htmlFor="setup-timezone">Time zone</label>
        <select id="setup-timezone" name="timezone" className="sdl-input" defaultValue={timezone}>
          {zones.map((tz) => <option key={tz} value={tz}>{tz.replaceAll("_", " ")}</option>)}
        </select>
        <span className="sdl-field-hint">We read the publish dates and times in your Notion calendar in this time zone.</span>
      </div>
      <div className="row">
        <Button type="submit" variant="primary" disabled={state.busy}>{state.busy ? "Saving…" : confirmed ? "Update time zone" : "Confirm time zone"}</Button>
        {state.saved ? <span className="ui" role="status" style={{ color: "var(--link)" }}>Saved</span> : null}
      </div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    </form>
  );
}
