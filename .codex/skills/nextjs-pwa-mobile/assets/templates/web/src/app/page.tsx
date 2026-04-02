import Link from "next/link";

const routes = [
  {
    href: "/pair",
    title: "Pair a device",
    description: "Open the pairing surface without dragging key exchange or storage policy into the route.",
  },
  {
    href: "/sessions",
    title: "Review live sessions",
    description: "Browse active or queued coding sessions with mobile-readable status summaries.",
  },
  {
    href: "/connection-error",
    title: "Plan recovery",
    description: "Keep degraded connection states readable and actionable on a small screen.",
  },
];

const principles = [
  "Keep App Router pages thin and composition-focused.",
  "Route protocol, realtime, crypto, and storage work through dedicated boundaries.",
  "Leave the shell install-ready from day one instead of bolting PWA support on later.",
];

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">V1 Web Shell</p>
        <h1>Pair fast, read output clearly, release control explicitly.</h1>
        <p className="lede">
          This template keeps the browser focused on mobile session UX while deeper transport,
          protocol, and desktop responsibilities stay outside the page layer.
        </p>
        <div className="button-row">
          <Link href="/pair" className="button-primary">
            Start pairing
          </Link>
          <Link href="/sessions" className="button-secondary">
            View sessions
          </Link>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Route Map</p>
          <h2 className="section-title">Fixed page set for PocketCoder V1</h2>
          <p className="section-subtitle">
            The root route may guide the user, but the core flow stays anchored to pairing,
            session browsing, session detail, and recovery.
          </p>
        </div>
        <div className="route-grid">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="route-card">
              <h2>{route.title}</h2>
              <p>{route.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Architecture</p>
          <h2 className="section-title">High cohesion, low coupling</h2>
        </div>
        <ul className="list">
          {principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}