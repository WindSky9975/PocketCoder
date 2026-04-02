"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useMessages } from "../../lib/i18n/provider.tsx";
import { LanguageToggle } from "./language-toggle.tsx";

export function AppShellFrame({ children }: { children: ReactNode }) {
  const messages = useMessages();
  const navItems = [
    { href: "/pair", label: messages.nav.pair },
    { href: "/sessions", label: messages.nav.sessions },
    { href: "/connection-error", label: messages.nav.recovery },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-heading">
          <p className="eyebrow">{messages.common.brand}</p>
          <p className="brand-title">{messages.common.brandTitle}</p>
        </div>
        <div className="topbar-actions">
          <LanguageToggle />
          <nav className="nav-row" aria-label={messages.nav.ariaLabel}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-chip">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
