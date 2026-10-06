import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageIntro } from "@/components/site/PageIntro";
import { MappingCard } from "@/components/site/ProductVisuals";
import { WaitlistForm } from "@/components/site/WaitlistForm";
import { product, steps } from "@/content/product";

export const metadata: Metadata = {
  title: "Products",
  description: `${product.name}: publish to YouTube straight from your Notion content calendar.`,
};

export default function ProductsPage() {
  return (
    <>
      <PageIntro eyebrow="Products" title="Software that does the busywork">
        We build small, focused tools that connect the apps you already use, so the repetitive steps run themselves.
      </PageIntro>

      <section className="container section-tight" style={{ paddingBottom: "var(--space-16)" }}>
        <article className="product-feature">
          <div className="stack gap-6" style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div className="row" style={{ gap: "var(--space-2)" }}>
              <Badge tone="product">{product.status}</Badge>
            </div>
            <h2 className="h2">{product.name}</h2>
            <p className="lead">{product.lead}</p>
            <ol className="stack gap-3" style={{ margin: 0, paddingLeft: 20 }}>
              {steps.map((s) => (
                <li key={s.title}>
                  <strong style={{ fontWeight: 600 }}>{s.title}.</strong> <span className="muted">{s.body}</span>
                </li>
              ))}
            </ol>
            <div className="row" style={{ paddingTop: "var(--space-2)" }}>
              <Button href="#waitlist" variant="primary">Get early access</Button>
              <Button href="/#how-it-works" variant="ghost">See how it works</Button>
            </div>
          </div>
          <MappingCard />
        </article>
      </section>

      <section className="container section-tight" style={{ paddingBottom: "var(--space-16)" }}>
        <div className="info-card" style={{ padding: "var(--space-8)" }}>
          <h2 className="h4">More on the way</h2>
          <p className="muted">We are working on the next tool now. Join the list below and you will hear about it first.</p>
        </div>
      </section>

      <section id="waitlist" className="section section-surface" style={{ scrollMarginTop: 100 }}>
        <div className="container row" style={{ gap: "var(--space-16)", alignItems: "center" }}>
          <div className="stack gap-4" style={{ flex: "1 1 400px", minWidth: 0 }}>
            <p className="eyebrow">Early access</p>
            <h2 className="h2">Be first to publish from Notion</h2>
            <p className="lead">We are opening {product.name} in small groups. Join the list and we will send your invite when a spot opens.</p>
          </div>
          <div className="waitlist-panel">
            <WaitlistForm layout="stacked" id="products-waitlist-email" />
          </div>
        </div>
      </section>
    </>
  );
}
