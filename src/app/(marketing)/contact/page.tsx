import type { Metadata } from "next";
import { MailIcon } from "@/components/ui/Icons";
import { ContactForm } from "@/components/site/ContactForm";
import { PageIntro } from "@/components/site/PageIntro";
import { PlatformLinks } from "@/components/site/PlatformLinks";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about Notion to YouTube, early access or a video collaboration? Get in touch.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact" title="Let's talk systems">
        Questions about Notion to YouTube, early access or a video collaboration? Send a note and we will get back to you.
      </PageIntro>

      <section className="container section-tight contact-layout" style={{ paddingBottom: "var(--space-24)" }}>
        <ContactForm />
        <aside className="stack gap-6">
          <div className="info-card">
            <div className="row">
              <MailIcon />
              <h2 className="h4" style={{ fontWeight: 600 }}>Email us directly</h2>
            </div>
            <a href={`mailto:${site.email}`} style={{ fontWeight: 500 }}>{site.email}</a>
          </div>
          <div className="info-card" style={{ gap: "var(--space-3)" }}>
            <h2 className="h4" style={{ fontWeight: 600 }}>Find us on</h2>
            <PlatformLinks />
          </div>
          <div className="info-card">
            <h2 className="h4" style={{ fontWeight: 600 }}>Already on the early access list?</h2>
            <p className="muted">
              Invites go out in small groups by email. To change the address you signed up with, choose &ldquo;Early
              access&rdquo; and include both addresses.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
