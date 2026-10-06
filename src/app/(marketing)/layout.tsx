import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/**
 * Layout for the public marketing site. The future SaaS app can live in its
 * own route group, e.g. src/app/(app)/dashboard, with a separate layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
