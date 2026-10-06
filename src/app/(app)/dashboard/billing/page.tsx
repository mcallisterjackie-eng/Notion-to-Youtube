import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { AppIcon } from "@/components/app/AppIcons";
import { plan, sampleSubscription as sub } from "@/content/app";
import { product } from "@/content/product";

export const metadata: Metadata = { title: "Billing" };

/**
 * Billing is handled by Stripe.
 * TODO: "Subscribe" → create a Stripe Checkout Session for the $12/month price (Phase 9).
 * TODO: "Manage subscription" / "Update payment method" → open the Stripe Customer Portal.
 * Both are usually a POST to your backend that returns a Stripe URL to redirect to.
 */
export default function BillingPage() {
  const active = sub.status === "active";

  return (
    <>
      <AppPageHeader title="Billing" description="Your plan, payment method and invoices. Payments are processed securely by Stripe." />

      <div className="panel-grid">
        <Panel>
          <div className="split" style={{ alignItems: "flex-start" }}>
            <div className="stack gap-1">
              <p className="eyebrow">Your plan</p>
              <h2 className="h3">{product.name} · {plan.name}</h2>
            </div>
            {active ? <Badge tone="action">Active</Badge> : <Badge>No subscription</Badge>}
          </div>
          <p>
            <span className="plan-price">{plan.price}</span>
            <span className="muted"> / {plan.interval} · {plan.seats}</span>
          </p>
          <ul className="checklist">
            {plan.features.map((f) => (
              <li key={f}><span className="check-done"><AppIcon name="check" size={16} /></span>{f}</li>
            ))}
          </ul>
          <hr className="panel-divider" />
          {active ? (
            <div className="split" style={{ alignItems: "center" }}>
              <p className="ui muted" style={{ fontWeight: 400 }}>Renews on <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{sub.renewsOn}</strong></p>
              <Button variant="secondary">Manage subscription</Button>
            </div>
          ) : (
            <Button variant="primary">Subscribe for {plan.priceShort}/{plan.interval}</Button>
          )}
        </Panel>

        <Panel title="Payment method">
          {active ? (
            <>
              <div className="row" style={{ gap: "var(--space-4)", flexWrap: "nowrap" }}>
                <span className="connection-icon" style={{ background: "var(--surface)" }}><AppIcon name="card" size={24} /></span>
                <div className="stack">
                  <span className="ui">{sub.card.brand} ending in {sub.card.last4}</span>
                  <span className="caption">Expires {sub.card.expires}</span>
                </div>
              </div>
              <div><Button variant="secondary" size="sm">Update payment method</Button></div>
            </>
          ) : (
            <p className="muted">No payment method on file. You will add one when you subscribe.</p>
          )}
        </Panel>
      </div>

      <Panel title="Invoices">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Download</span></th>
              </tr>
            </thead>
            <tbody>
              {sub.invoices.map((inv) => (
                <tr key={inv.date}>
                  <td style={{ whiteSpace: "nowrap" }}>{inv.date}</td>
                  <td>{product.name} · {plan.name}</td>
                  <td className="num">{inv.amount}</td>
                  <td><span className="status-badge status-ok"><AppIcon name="check" size={14} />{inv.status}</span></td>
                  <td style={{ textAlign: "right" }}><a href="#" className="ui">Download<span className="visually-hidden"> invoice from {inv.date}</span></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Cancel subscription" description="Uploads stop at the end of your current billing period. Your Notion calendar and YouTube videos are not touched.">
        <div><Button variant="secondary">Cancel subscription</Button></div>
      </Panel>
    </>
  );
}
