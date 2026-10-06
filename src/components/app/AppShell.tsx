"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { appNav } from "@/content/app";
import { product } from "@/content/product";
import { signOut } from "@/lib/auth";
import type { DisplayUser } from "@/lib/user";
import { MenuIcon } from "@/components/ui/Icons";
import { AppIcon } from "./AppIcons";

/** Logged-in layout: left navigation panel, user block, log out, and the page. */
export function AppShell({ user, children }: { user: DisplayUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [leaving, setLeaving] = useState(false);


  async function onLogout() {
    setLeaving(true);
    await signOut();
    router.replace("/login?signedOut=1");
    router.refresh();
  }

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">Skip to content</a>

      <div className="app-topbar">
        <Link href="/dashboard" className="app-brand" aria-label="Dashboard home">
          <Image src="/brand/tsdl-flask-icon.png" alt="" width={36} height={36} />
          <span className="h5">{product.name}</span>
        </Link>
        <button type="button" className="menu-toggle" style={{ display: "inline-flex" }} aria-expanded={open} aria-controls="app-sidebar" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpenOn(open ? null : pathname)}>
          <MenuIcon open={open} />
        </button>
      </div>

      <aside id="app-sidebar" className="app-sidebar" data-open={open}>
        <Link href="/dashboard" className="app-brand app-brand-side" aria-label="Dashboard home">
          <Image src="/brand/tsdl-flask-icon.png" alt="" width={40} height={40} />
          <span className="stack">
            <span className="h5">{product.name}</span>
            <span className="caption">The Systems Design Lab</span>
          </span>
        </Link>

        <nav aria-label="Dashboard" className="app-nav">
          {appNav.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="app-nav-link" aria-current={active ? "page" : undefined}>
                <AppIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="app-user">
          <div className="row" style={{ gap: "var(--space-3)", flexWrap: "nowrap" }}>
            <span className="avatar" aria-hidden="true">{user.initials}</span>
            <span className="stack" style={{ minWidth: 0 }}>
              <span className="ui truncate">{user.name}</span>
              <span className="caption truncate">{user.email}</span>
            </span>
          </div>
          <button type="button" className="app-logout" onClick={onLogout} disabled={leaving}>
            <AppIcon name="logout" />
            {leaving ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>

      <main id="app-main" className="app-main">
        {/* Phase 1: everything below the header is sample data. Remove once real data is wired (Phases 2–8). */}
        <p className="notice sample-banner" role="note">
          <strong>Preview.</strong> The numbers, uploads and settings on these pages are sample data. Connections and automation are not live yet.
        </p>
        {children}
      </main>
    </div>
  );
}

/** Title row at the top of each dashboard page. */
export function AppPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="app-page-header">
      <div className="stack gap-2" style={{ minWidth: 0 }}>
        <h1 className="h3" style={{ fontSize: 32, lineHeight: "40px", fontWeight: 800 }}>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}

/** A titled white panel inside a dashboard page. */
export function Panel({ title, description, actions, children, id }: { title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section className="panel" id={id} aria-label={title}>
      {title || actions ? (
        <div className="panel-head">
          <div className="stack gap-1" style={{ minWidth: 0 }}>
            {title ? <h2 className="h4">{title}</h2> : null}
            {description ? <p className="ui muted" style={{ fontWeight: 400 }}>{description}</p> : null}
          </div>
          {actions ? <div className="row">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
