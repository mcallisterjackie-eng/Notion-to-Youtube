import type { ReactNode } from "react";

/** The eyebrow + title + lead block at the top of each inner page. */
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="container page-intro stack gap-6">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h1">{title}</h1>
      {children ? <p className="lead">{children}</p> : null}
    </section>
  );
}

/** Eyebrow + heading (+ optional lead) used to open a section. */
export function SectionHeading({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="stack gap-2 measure">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="h2">{title}</h2>
      {lead ? <p className="lead" style={{ marginTop: "var(--space-2)" }}>{lead}</p> : null}
    </div>
  );
}
