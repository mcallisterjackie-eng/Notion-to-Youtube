import Image from "next/image";
import Link from "next/link";
import { plan } from "@/content/app";
import { product } from "@/content/product";
import { CheckIcon } from "@/components/ui/Icons";

/** Two-column frame for sign-in pages: the form on the left, the product on the right. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-form-side">
        <Link href="/" className="site-logo" aria-label="The Systems Design Lab, home" style={{ alignSelf: "flex-start" }}>
          <Image src="/brand/tsdl-logo-full.png" alt="The Systems Design Lab" width={480} height={342} style={{ height: 64, width: "auto" }} priority />
        </Link>
        <main className="auth-form-wrap" id="main">{children}</main>
      </div>
      <aside className="auth-aside" aria-label={`About ${product.name}`}>
        <div className="auth-aside-inner">
          <p className="eyebrow">{product.name}</p>
          <p className="h2">Change the status. Your video uploads itself.</p>
          <div className="stack gap-3">
            {plan.features.map((f) => (
              <div key={f} className="check-row" style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400 }}>
                <span className="check-box" style={{ color: "var(--link)" }}><CheckIcon /></span>
                {f}
              </div>
            ))}
          </div>
          <p className="ui muted">
            {plan.priceShort} a {plan.interval}, {plan.seats}. Cancel anytime.
          </p>
        </div>
      </aside>
    </div>
  );
}
