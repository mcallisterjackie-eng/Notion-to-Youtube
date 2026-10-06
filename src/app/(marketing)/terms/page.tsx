import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Terms of use" };

// PLACEHOLDER: have this reviewed before launch. It is an outline, not legal advice.
export default function TermsPage() {
  return (
    <>
      <PageIntro eyebrow="Legal" title="Terms of use">Last updated: [date]</PageIntro>
      <section className="container section-tight" style={{ paddingBottom: "var(--space-24)" }}>
        <div className="prose">
          <h2>Using this site</h2>
          <p>[General terms for using the website and its content.]</p>
          <h2>Notion to YouTube</h2>
          <p>[How the service works, your responsibility for content you upload, and connecting or disconnecting your Notion and YouTube accounts.]</p>
          <h2>Billing and refunds</h2>
          <p>[Subscription, billing and refund terms, once pricing is set.]</p>
          <h2>Contact</h2>
          <p>Questions about these terms: <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
        </div>
      </section>
    </>
  );
}
