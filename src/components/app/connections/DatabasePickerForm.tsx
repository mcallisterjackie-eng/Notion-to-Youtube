"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { selectDatabaseAction } from "@/app/(app)/dashboard/connections/actions";
import { Button } from "@/components/ui/Button";

export type DatabaseOption = { id: string; name: string; url: string | null };

/** Radio list of the Notion databases shared with the app. */
export function DatabasePickerForm({ options, selectedId }: { options: DatabaseOption[]; selectedId: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string; saved?: boolean }>({ busy: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ busy: true });
    const res = await selectDatabaseAction(new FormData(e.currentTarget));
    setState(res.ok ? { busy: false, saved: true } : { busy: false, error: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <form className="stack gap-6" onSubmit={onSubmit}>
      <fieldset className="db-options">
        <legend className="visually-hidden">Content calendar database</legend>
        {options.map((o) => (
          <label key={o.id} className="db-option">
            <input type="radio" name="dataSourceId" value={o.id} defaultChecked={o.id === selectedId} required />
            <span className="stack" style={{ minWidth: 0 }}>
              <span className="ui truncate">{o.name}</span>
              {o.id === selectedId ? <span className="caption">Currently selected</span> : null}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="row">
        <Button type="submit" variant="primary" disabled={state.busy}>{state.busy ? "Saving…" : "Use this database"}</Button>
        {state.saved ? <span className="ui" role="status" style={{ color: "var(--link)" }}>Saved</span> : null}
      </div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    </form>
  );
}
