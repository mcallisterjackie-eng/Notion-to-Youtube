"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckIcon } from "@/components/ui/Icons";
import { site } from "@/content/site";

export const contactTopics = [
  "A question about Notion to YouTube",
  "Early access",
  "Video collaboration or sponsorship",
  "Something else",
] as const;

type Status = "idle" | "sending" | "done" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="form-card stack gap-3" role="status">
        <span className="check-box" style={{ width: 48, height: 48, borderRadius: 12, color: "var(--link)" }}>
          <CheckIcon size={24} />
        </span>
        <h2 className="h3">Message sent</h2>
        <p className="muted">Thanks for reaching out. We will reply to the email you gave us.</p>
      </div>
    );
  }

  return (
    <form className="form-card stack gap-6" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input name="name" label="Name" placeholder="Alex Rivera" autoComplete="name" required />
        <Input name="email" type="email" label="Email" placeholder="alex@company.com" autoComplete="email" required />
      </div>
      <div className="sdl-field">
        <label className="sdl-field-label" htmlFor="topic">What is this about?</label>
        <select id="topic" name="topic" className="sdl-input" defaultValue={contactTopics[0]}>
          {contactTopics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="sdl-field">
        <label className="sdl-field-label" htmlFor="message">Message</label>
        <textarea id="message" name="message" className="sdl-input" rows={6} required placeholder="Tell us what you are working on." style={{ resize: "vertical" }} />
      </div>
      {/* Honeypot: hidden from people, catches simple spam bots. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="company-website">Leave this empty</label>
        <input id="company-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="row" style={{ gap: "var(--space-4)" }}>
        <Button type="submit" variant="primary" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </Button>
        <span className="caption">We reply within {site.replyTime}.</span>
      </div>
      {status === "error" ? (
        <p className="form-error" role="alert">
          Something went wrong. Try again, or email us at <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      ) : null}
    </form>
  );
}
