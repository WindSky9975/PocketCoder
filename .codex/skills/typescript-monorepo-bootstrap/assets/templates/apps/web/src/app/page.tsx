const workspaces = [
  "apps/web",
  "apps/agentd",
  "apps/relay",
  "packages/protocol"
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">PocketCoder bootstrap</p>
        <h1>Monorepo scaffold ready for implementation</h1>
        <p className="lede">
          This workspace is the mobile-first shell. Pairing, sessions, approvals, and realtime flows
          belong in later implementation skills.
        </p>
      </section>

      <section className="panel">
        <h2>Fixed workspaces</h2>
        <ul>
          {workspaces.map((workspace) => (
            <li key={workspace}>{workspace}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}