"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNav, site } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { MenuIcon } from "@/components/ui/Icons";

export function Header() {
  const pathname = usePathname();
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="site-logo" aria-label={`${site.name}, home`}>
          <Image src="/brand/tsdl-logo-full.png" alt={site.name} width={480} height={342} priority />
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <MenuIcon open={open} />
        </button>
        <nav id="site-nav" className="site-nav" aria-label="Main" data-open={open}>
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className="nav-link" aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
          <Link href="/login" className="nav-link">Log in</Link>
          <Button href="/#waitlist" variant="secondary" size="sm">
            Get early access
          </Button>
        </nav>
      </div>
    </header>
  );
}
