import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlayIcon } from "@/components/ui/Icons";
import { PageIntro } from "@/components/site/PageIntro";
import { PlatformLinks } from "@/components/site/PlatformLinks";
import { VideoLibrary } from "@/components/site/VideoLibrary";
import { featuredVideo as v } from "@/content/videos";

export const metadata: Metadata = {
  title: "Videos",
  description: "Short videos that tackle one messy process at a time and show the fix.",
};

function FeaturedMedia() {
  if (v.youtubeId) {
    return (
      <div className="featured-media">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <a className="featured-media" href={v.url} aria-label={`Watch ${v.title} on ${v.platform}`}>
      <span className="module" style={{ right: 32, top: 32, width: 56, height: 56, borderRadius: 14, background: "var(--cyan)" }} />
      <span className="module" style={{ right: 104, top: 72, width: 36, height: 36, borderRadius: 9, background: "var(--violet)" }} />
      <span className="module" style={{ right: 48, top: 104, width: 28, height: 28, borderRadius: 7, background: "var(--orange)" }} />
      <span className="play-button" style={{ color: "var(--charcoal)" }}><PlayIcon size={28} /></span>
    </a>
  );
}

export default function VideosPage() {
  return (
    <>
      <PageIntro eyebrow="Videos" title="Short videos, real systems">
        Every video tackles one messy process and shows the fix. Watch here, or follow along on the platform you already
        use.
      </PageIntro>

      <section className="container section-tight" aria-label="Featured video">
        <div className="featured-video">
          <FeaturedMedia />
          <div className="featured-copy stack gap-4">
            <div className="row" style={{ gap: "var(--space-2)" }}>
              <Badge tone="action">Featured</Badge>
              <Badge>{v.platform}</Badge>
            </div>
            <h2 className="h3">{v.title}</h2>
            {v.summary ? <p className="muted">{v.summary}</p> : null}
            <div className="row" style={{ paddingTop: "var(--space-2)" }}>
              <Button href={v.url} variant="primary">Watch on {v.platform}</Button>
              <Button href="/#waitlist" variant="ghost">Get early access</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-tight" aria-label="All videos">
        <VideoLibrary />
      </section>

      <section className="container section-tight" style={{ paddingBottom: "var(--space-24)" }}>
        <div className="split" style={{ alignItems: "center", border: "1px solid var(--line)", borderRadius: "var(--radius-xl)", padding: "var(--space-12)" }}>
          <div className="stack gap-2" style={{ flex: "1 1 340px" }}>
            <h2 className="h3">Never miss a system</h2>
            <p className="muted">New videos land on every platform at the same time. Follow wherever you scroll.</p>
          </div>
          <PlatformLinks />
        </div>
      </section>
    </>
  );
}
