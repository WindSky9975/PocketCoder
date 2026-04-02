"use client";

import Link from "next/link";

import { useMessages } from "../lib/i18n/provider.tsx";

export default function HomePage() {
  const messages = useMessages();

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">{messages.home.eyebrow}</p>
        <h1>{messages.home.title}</h1>
        <p className="lede">{messages.home.lede}</p>
        <div className="button-row">
          <Link href="/pair" className="button-primary">
            {messages.home.primaryAction}
          </Link>
          <Link href="/sessions" className="button-secondary">
            {messages.home.secondaryAction}
          </Link>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.home.routeMapEyebrow}</p>
          <h2 className="section-title">{messages.home.routeMapTitle}</h2>
          <p className="section-subtitle">{messages.home.routeMapSubtitle}</p>
        </div>
        <div className="route-grid">
          {messages.home.routes.map((route) => (
            <Link key={route.href} href={route.href} className="route-card">
              <h2>{route.title}</h2>
              <p>{route.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.home.architectureEyebrow}</p>
          <h2 className="section-title">{messages.home.architectureTitle}</h2>
        </div>
        <ul className="list">
          {messages.home.principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
