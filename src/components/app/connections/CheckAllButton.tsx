"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkConnectionAction } from "@/app/(app)/dashboard/connections/actions";
import { Button } from "@/components/ui/Button";

/** Runs a live health check on every connected service (Design Spec §20 setup validation). */
export function CheckAllButton() {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string; done?: boolean }>({ busy: false });
  async function run() {
    setState({ busy: true });
    const res = await checkConnectionAction();
    setState(res.ok ? { busy: false, done: true } : { busy: false, error: res.error });
    router.refresh();
  }
  return (
    <div className="stack gap-2">
      <div className="row">
        <Button variant="primary" onClick={run} disabled={state.busy}>{state.busy ? "Checking…" : "Check my connections"}</Button>
        {state.done ? <span className="ui" role="status" style={{ color: "var(--link)" }}>Checked just now</span> : null}
      </div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    </div>
  );
}
