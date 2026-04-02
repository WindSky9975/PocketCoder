import Link from "next/link";

import { StoredDeviceCard } from "../connection/stored-device-card.tsx";

const sessions = [
  {
    sessionId: "sess-live-241",
    title: "Refactor desktop pairing handshake",
    status: "Live",
    latency: "42 ms relay hop",
    summary: "Realtime output is flowing and a pending approval may arrive at any time.",
  },
  {
    sessionId: "sess-idle-118",
    title: "Tighten relay transport boundaries",
    status: "Idle",
    latency: "Awaiting reconnect",
    summary: "The browser shell should show state clearly without owning reconnection internals.",
  },
  {
    sessionId: "sess-review-309",
    title: "Audit workspace bootstrap files",
    status: "Review",
    latency: "Local cache warm",
    summary: "Use feature composition to show recency, health, and approval snapshots.",
  },
];

export function SessionListShell() {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Sessions</p>
        <h1>Read the session queue on a phone without losing context.</h1>
        <p className="lede">
          This list stays focused on summaries, paired-browser readiness, and navigation. Realtime
          subscriptions and replay behavior remain in feature or lib boundaries.
        </p>
      </section>

      <StoredDeviceCard />

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Overview</p>
          <h2 className="section-title">Current desktop sessions</h2>
        </div>
        <div className="session-grid">
          {sessions.map((session) => (
            <Link
              key={session.sessionId}
              href={`/sessions/${session.sessionId}`}
              className="session-card"
            >
              <div className="chip-row">
                <span className="status-chip status-chip--live">{session.status}</span>
                <span className="status-chip">{session.latency}</span>
              </div>
              <h2>{session.title}</h2>
              <p className="session-meta">{session.summary}</p>
              <div className="metric-row">
                <span>{session.sessionId}</span>
                <span>Open detail</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
