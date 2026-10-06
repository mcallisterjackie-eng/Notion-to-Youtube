import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/site/PageIntro";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About us",
  description: `${site.name} turns complex workflows into simple, usable products.`,
};

const principles = [
  { title: "Simple first", body: "We remove noise before we add anything. If a step does not earn its place, it goes.", fill: "var(--cyan)" },
  { title: "Systems, not clutter", body: "Everything we build makes it obvious what happens next and who owns it.", fill: "var(--blue)" },
  { title: "Energy with restraint", body: "Fun to use, never busy. The important thing is always the easiest to find.", fill: "var(--violet)" },
  { title: "Build for reuse", body: "What works for one team should work for the next one with a few edits.", fill: "var(--magenta)" },
  { title: "Professional and approachable", body: "Credible to business owners, easy for the people doing the work.", fill: "var(--orange)" },
];

export default function AboutPage() {
  return (
    <>
      <section className="container hero" style={{ paddingBottom: "var(--space-16)" }}>
        <div className="stack gap-6" style={{ flex: "3 1 460px", minWidth: 0 }}>
          <p className="eyebrow">About us</p>
          <h1 className="h1">We build systems people actually use</h1>
          <p className="lead" style={{ maxWidth: 600 }}>
            {site.name} turns complex workflows into simple, usable products. We share what works in short videos
            and build software that takes the busywork off your plate, starting with publishing to YouTube from Notion.
          </p>
        </div>
        <div style={{ flex: "2 1 300px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 320, height: 320, maxWidth: "100%", background: "var(--surface)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/brand/tsdl-flask-icon.png" alt="" width={240} height={240} style={{ borderRadius: 24 }} />
          </div>
        </div>
      </section>

      {/* TODO: replace the bracketed placeholders with your story. */}
      <section className="container section-tight two-col" style={{ paddingBottom: "var(--space-24)" }}>
        <h2 className="h3">Why we started</h2>
        <div className="stack gap-4">
          <p>[Your story: the moment you realised most teams were not short on tools, just on systems that hold together. Two or three short paragraphs work best.]</p>
          <p>[What you do differently: you test every system on a real business before you share it, and you keep it as simple as the job allows.]</p>
          <p>[Where you are headed: Notion to YouTube is the first tool; what comes after it.]</p>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container stack gap-12">
          <SectionHeading eyebrow="How we work" title="Five rules we build by" />
          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {principles.map((p) => (
              <div key={p.title} className="principle">
                <span className="swatch" style={{ background: p.fill }} aria-hidden="true" />
                <h3 className="h4">{p.title}</h3>
                <p className="muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="split" style={{ alignItems: "center" }}>
          <h2 className="h3" style={{ maxWidth: 640 }}>Have a workflow that needs untangling? Tell us about it.</h2>
          <Button href="/contact" variant="primary">Get in touch</Button>
        </div>
      </section>
    </>
  );
}
