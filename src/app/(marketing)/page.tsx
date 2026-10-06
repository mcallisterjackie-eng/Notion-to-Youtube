import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/site/PageIntro";
import { CalendarVisual, MappingCard } from "@/components/site/ProductVisuals";
import { VideoCard } from "@/components/site/VideoCard";
import { WaitlistForm } from "@/components/site/WaitlistForm";
import { faqs, mappingPoints, oldWay, product, steps } from "@/content/product";
import { videos } from "@/content/videos";
import { plan } from "@/content/app";
import { AppIcon } from "@/components/app/AppIcons";

export default function HomePage() {
  const latestVideos = videos.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="container hero">
        <div className="hero-copy stack gap-6">
          <div className="row" style={{ gap: "var(--space-3)" }}>
            <Badge tone="product">{product.status}</Badge>
            <p className="eyebrow">{product.name}</p>
          </div>
          <h1 className="display">{product.headline}</h1>
          <p className="lead">{product.lead}</p>
          <div className="row" style={{ paddingTop: "var(--space-2)" }}>
            <Button href="#waitlist" variant="spectrum">Get early access</Button>
            <Button href="#how-it-works" variant="secondary">See how it works</Button>
          </div>
        </div>
        <CalendarVisual />
      </section>

      {/* Old way vs new way */}
      <section className="container section-tight stack gap-8" style={{ paddingBottom: "var(--space-24)" }}>
        <SectionHeading eyebrow="Why it exists" title="Your calendar already knows everything YouTube needs" />
        <div className="compare">
          <div className="compare-col compare-old">
            <p className="eyebrow" style={{ color: "var(--ink-muted)" }}>Every upload, today</p>
            <ol className="old-list">
              {oldWay.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="compare-col compare-new" style={{ justifyContent: "center" }}>
            <p className="eyebrow">With {product.name}</p>
            <p className="h2">Change the status. That&rsquo;s it.</p>
            <p className="muted">Title, description, tags, thumbnail, schedule and the video itself all come from the page you already filled in.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section section-surface" style={{ scrollMarginTop: 100 }}>
        <div className="container stack gap-12">
          <SectionHeading eyebrow="How it works" title="Set it up once, then just plan" />
          <ol className="product-steps">
            {steps.map((s, i) => (
              <li key={s.title} className="product-step">
                <span className="step-num" style={{ background: ["var(--cyan)", "var(--violet)", "var(--orange)"][i], color: i === 1 ? "var(--white)" : "var(--on-warm)" }}>
                  {i + 1}
                </span>
                <h3 className="h4">{s.title}</h3>
                <p className="muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Mapping */}
      <section className="container section row" style={{ gap: "var(--space-16)", alignItems: "center" }}>
        <div className="stack gap-6" style={{ flex: "1 1 420px", minWidth: 0 }}>
          <p className="eyebrow">Field mapping</p>
          <h2 className="h2">Your properties, YouTube&rsquo;s fields</h2>
          <p className="lead">
            Point each YouTube upload field at the Notion property that already holds it. Names, types and layout stay
            the way you like them.
          </p>
          <div className="stack gap-3">
            {mappingPoints.map((p) => (
              <div key={p} className="check-row" style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400, alignItems: "flex-start" }}>
                <span className="check-box" style={{ color: "var(--link)" }}><CheckIcon /></span>
                {p}
              </div>
            ))}
          </div>
        </div>
        <MappingCard />
      </section>

      {/* Videos */}
      <section className="section section-surface">
        <div className="container stack gap-8">
          <div className="split">
            <SectionHeading eyebrow="From the channel" title="Short videos on running content like a system" />
            <Button href="/videos" variant="ghost">See all videos</Button>
          </div>
          <div className="grid-videos">
            {latestVideos.map((v) => (
              <VideoCard key={v.slug} video={v} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container section stack gap-12" style={{ scrollMarginTop: 100, paddingBottom: 0 }}>
        <SectionHeading eyebrow="Pricing" title="One plan. Everything included." />
        <div className="pricing-card">
          <div className="stack gap-4" style={{ flex: "1 1 320px" }}>
            <p className="h4">{product.name}</p>
            <p>
              <span className="plan-price">{plan.priceShort}</span>
              <span className="muted"> / {plan.interval} · {plan.seats}</span>
            </p>
            <p className="muted">Cancel anytime.</p>
            <div className="row" style={{ paddingTop: "var(--space-2)" }}>
              <Button href="#waitlist" variant="primary">Get early access</Button>
            </div>
          </div>
          <ul className="checklist" style={{ flex: "1 1 320px" }}>
            {plan.features.map((f) => (
              <li key={f}><span className="check-done"><AppIcon name="check" size={16} /></span>{f}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="container section two-col">
        <h2 className="h3">Questions</h2>
        <div>
          {faqs.map((f) => (
            <details key={f.q} className="faq-item">
              <summary><span className="h5">{f.q}</span></summary>
              <p className="muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="container section-tight" style={{ paddingBottom: "var(--space-24)", scrollMarginTop: 100 }}>
        <div className="waitlist-dark">
          <div className="waitlist-copy stack gap-4">
            <p className="eyebrow">Early access</p>
            <h2 className="h2">Be first to publish from Notion</h2>
            <p className="lead">
              We are opening {product.name} in small groups. Join the list and we will send your invite when a spot opens.
            </p>
          </div>
          <div className="waitlist-form">
            <WaitlistForm id="home-waitlist-email" />
          </div>
        </div>
      </section>
    </>
  );
}
