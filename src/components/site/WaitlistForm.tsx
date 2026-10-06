"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Status = "idle" | "sending" | "done" | "error";

/** Email capture for the SaaS waitlist. Posts to /api/waitlist. */
export function WaitlistForm({ layout = "inline", id = "waitlist-email" }: { layout?: "inline" | "stacked"; id?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email");
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="form-status" role="status">
        You are on the list. We will be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={layout === "inline" ? "inline-form" : "stack gap-6"} noValidate={false}>
      <Input
        id={id}
        name="email"
        type="email"
        label="Email address"
        placeholder="you@company.com"
        hint="One email when early access opens. No spam."
        autoComplete="email"
        required
      />
      <Button type="submit" variant="primary" disabled={status === "sending"} style={layout === "inline" ? { marginBottom: 24 } : undefined}>
        {status === "sending" ? "Joining…" : "Join the waitlist"}
      </Button>
      {status === "error" ? (
        <p className="form-error" role="alert" style={{ flexBasis: "100%" }}>
          That did not go through. Check the address and try again.
        </p>
      ) : null}
    </form>
  );
}
