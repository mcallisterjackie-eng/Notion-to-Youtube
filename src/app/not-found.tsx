import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/Button";

/** Shown for any URL that does not match a page. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="container section stack gap-6" style={{ minHeight: "50vh", justifyContent: "center" }}>
          <p className="eyebrow">Page not found</p>
          <h1 className="h1">This experiment did not work out</h1>
          <p className="lead">The page you are looking for has moved or never existed.</p>
          <div className="row">
            <Button href="/" variant="primary">Go to the home page</Button>
            <Button href="/#how-it-works" variant="secondary">See how it works</Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
