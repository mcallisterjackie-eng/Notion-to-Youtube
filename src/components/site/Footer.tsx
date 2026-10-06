import Image from "next/image";
import Link from "next/link";
import { site, socials } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand stack gap-4">
            <Image src="/brand/tsdl-flask-icon.png" alt="" width={56} height={56} />
            <p className="h4">{site.tagline}</p>
            <p className="ui muted">Software and short videos that take the busywork out of publishing.</p>
          </div>
          <div className="footer-cols">
            <nav className="footer-col" aria-label="Products">
              <p className="eyebrow">Products</p>
              <Link className="foot-link" href="/products">Notion to YouTube</Link>
              <Link className="foot-link" href="/videos">Videos</Link>
              <Link className="foot-link" href="/#waitlist">Early access</Link>
            </nav>
            <nav className="footer-col" aria-label="Company">
              <p className="eyebrow">Company</p>
              <Link className="foot-link" href="/about">About us</Link>
              <Link className="foot-link" href="/contact">Contact</Link>
              <Link className="foot-link" href="/privacy">Privacy policy</Link>
              <Link className="foot-link" href="/terms">Terms of use</Link>
            </nav>
            <nav className="footer-col" aria-label="Social">
              <p className="eyebrow">Follow</p>
              {socials.map((s) => (
                <a key={s.platform} className="foot-link" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.platform}
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="caption">© {year} {site.name}. All rights reserved.</p>
          <a className="caption" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </div>
    </footer>
  );
}
