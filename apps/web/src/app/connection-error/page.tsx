"use client";

import Link from "next/link";

import { useMessages } from "../../lib/i18n/provider.tsx";

export default function ConnectionErrorPage() {
  const messages = useMessages();

  return (
    <div className="page-stack">
      <section className="empty-card">
        <p className="eyebrow">{messages.connectionError.eyebrow}</p>
        <h1>{messages.connectionError.title}</h1>
        <p className="lede">{messages.connectionError.lede}</p>
        <div className="actions-row">
          <button type="button" className="button-primary" onClick={() => window.location.reload()}>
            {messages.connectionError.retry}
          </button>
          <Link href="/pair" className="button-ghost">
            {messages.connectionError.openPairing}
          </Link>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.connectionError.recoveryEyebrow}</p>
          <h2 className="section-title">{messages.connectionError.recoveryTitle}</h2>
        </div>
        <ul className="list">
          {messages.connectionError.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
