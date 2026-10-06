"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { log } from "@/lib/log";

/**
 * What people see when a page fails to render. Shows a plain message and a
 * reference code; the technical detail goes to the log, never to the screen.
 */
export function ErrorState({ error, reset, homeHref = "/" }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  useEffect(() => {
    log.error("ui.error-boundary", error.message, { digest: error.digest });
  }, [error]);

  return (
    <section className="stack gap-6" style={{ paddingBlock: "var(--space-12)", maxWidth: 560 }} aria-labelledby="error-title">
      <p className="eyebrow">Something went wrong</p>
      <h1 id="error-title" className="h2">This page did not load</h1>
      <p className="muted">Try again. If it keeps happening, contact us and include the reference below.</p>
      {error.digest ? <p className="caption">Reference: {error.digest}</p> : null}
      <div className="row">
        <Button variant="primary" onClick={reset}>Try again</Button>
        <Button href={homeHref} variant="secondary">Go back</Button>
      </div>
    </section>
  );
}
