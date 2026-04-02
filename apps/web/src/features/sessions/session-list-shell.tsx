"use client";

import Link from "next/link";

import { StoredDeviceCard } from "../connection/stored-device-card.tsx";
import { useMessages } from "../../lib/i18n/provider.tsx";

function getChipClass(tone: "live" | "warn" | "default"): string {
  if (tone === "live") {
    return "status-chip status-chip--live";
  }

  if (tone === "warn") {
    return "status-chip status-chip--warn";
  }

  return "status-chip";
}

export function SessionListShell() {
  const messages = useMessages();

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">{messages.sessions.heroEyebrow}</p>
        <h1>{messages.sessions.heroTitle}</h1>
        <p className="lede">{messages.sessions.heroLede}</p>
      </section>

      <StoredDeviceCard />

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.sessions.overviewEyebrow}</p>
          <h2 className="section-title">{messages.sessions.overviewTitle}</h2>
        </div>
        <div className="session-grid">
          {messages.sessions.mockSessions.map((session) => (
            <Link
              key={session.sessionId}
              href={`/sessions/${session.sessionId}`}
              className="session-card"
            >
              <div className="chip-row">
                <span className={getChipClass(session.tone)}>{session.status}</span>
                <span className="status-chip">{session.latency}</span>
              </div>
              <h2>{session.title}</h2>
              <p className="session-meta">{session.summary}</p>
              <div className="metric-row">
                <span>{session.sessionId}</span>
                <span>{messages.sessions.openDetail}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
