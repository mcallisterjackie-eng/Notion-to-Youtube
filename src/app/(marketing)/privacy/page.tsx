import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Privacy policy" };

// PLACEHOLDER: have this reviewed before launch. It is an outline, not legal advice.
export default function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="Legal" title="Privacy policy">Last updated: [date]</PageIntro>
      <section className="container section-tight" style={{ paddingBottom: "var(--space-24)" }}>
        <div className="prose">
          <h2>What we collect</h2>
          <p>[The details people give us through the contact form and waitlist (name, email, message). For Notion to YouTube users: what we access in their connected Notion workspace and YouTube channel, and why.]</p>
          <h2>How we use it</h2>
          <p>[To reply to messages, run Notion to YouTube for connected accounts, and send early access invites. We do not sell personal information.]</p>
          <h2>Services we use</h2>
          <p>[Hosting, analytics, email and payment providers, with links to their policies.]</p>
          <h2>Your choices</h2>
          <p>[How to unsubscribe, request a copy of your data, or ask us to delete it.]</p>
          <h2>Contact</h2>
          <p>Questions about this policy: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
        </div>
      </section>
    </>
  );
}
