"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkConnectionAction, disconnectAction } from "@/app/(app)/dashboard/connections/actions";
import { Button } from "@/components/ui/Button";
import type { ProviderKey } from "@/lib/connection-messages";

/** Check now / Disconnect (with a confirm step) for a connected service. */
export function ConnectionActions({ provider, name, disconnectWarning }: { provider: ProviderKey; name: string; disconnectWarning?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "check" | "disconnect">(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "check" | "disconnect") {
    setBusy(kind);
    setError(null);
    const res = kind === "check" ? await checkConnectionAction(provider) : await disconnectAction(provider);
    setBusy(null);
    setConfirming(false);
    if (!res.ok) setError(res.error);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="stack gap-3" role="group" aria-label={`Disconnect ${name}`}>
        <p className="ui" style={{ fontWeight: 400 }}>
          Disconnect {name}? We will remove our access and delete the stored connection.{disconnectWarning ? ` ${disconnectWarning}` : ""}
        </p>
        <div className="row">
          <Button variant="secondary" size="sm" onClick={() => run("disconnect")} disabled={busy !== null}>
            {busy === "disconnect" ? "Disconnecting…" : `Yes, disconnect ${name}`}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy !== null}>Keep connected</Button>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="stack gap-2">
      <div className="row">
        <Button variant="secondary" size="sm" onClick={() => run("check")} disabled={busy !== null}>
          {busy === "check" ? "Checking…" : "Check connection"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} disabled={busy !== null}>Disconnect</Button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
