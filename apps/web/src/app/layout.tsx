import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const navItems = [
  { href: "/pair", label: "Pair" },
  { href: "/sessions", label: "Sessions" },
  { href: "/connection-error", label: "Recovery" },
];

export const metadata: Metadata = {
  title: "PocketCoder",
  description: "Mobile-first paired coding shell for PocketCoder.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">PocketCoder</p>
              <p className="brand-title">Mobile-first coding control</p>
            </div>
            <nav className="nav-row" aria-label="Primary">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-chip">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="page-shell">{children}</main>
        </div>
      </body>
    </html>
  );
}