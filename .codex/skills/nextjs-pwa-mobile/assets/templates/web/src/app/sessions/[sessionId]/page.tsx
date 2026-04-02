const outputLines = [
  "[relay] websocket subscription restored for paired handset",
  "[agentd] streaming terminal output to the active mobile observer",
  "[protocol] approval request buffered for browser display only",
  "[ui] page shell keeps transport details out of the route file",
];

const sessionFacts = [
  { label: "Ownership", value: "Desktop remains the source of execution" },
  { label: "Realtime", value: "WebSocket stream enters through lib/realtime" },
  { label: "Storage", value: "Session hints may persist through lib/storage only" },
  { label: "Protocol", value: "Shared contract types come from @pocketcoder/protocol" },
];

type SessionDetailPageProps = {
  params: {
    sessionId: string;
  };
};

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Session Detail</p>
        <h1>{params.sessionId}</h1>
        <p className="lede">
          The route renders a mobile-readable session shell: output stream, approval surface,
          prompt composer, and an explicit way to hand control back to the desktop side.
        </p>
        <div className="chip-row">
          <span className="status-chip status-chip--live">Live output</span>
          <span className="status-chip status-chip--warn">Approval pending</span>
          <span className="status-chip">Control can be released</span>
        </div>
      </section>

      <section className="terminal-panel">
        <div className="section-head">
          <p className="eyebrow">Realtime Output</p>
          <h2 className="section-title">Stream shell</h2>
          <p className="terminal-note">
            Render transport output here, but keep socket ownership and parsing logic outside the route.
          </p>
        </div>
        <div className="terminal-output" aria-label="Session output stream">
          {outputLines.map((line) => (
            <p key={line} className="terminal-line">
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className="approval-card">
        <p className="eyebrow">Approval</p>
        <h2>Allow workspace write access?</h2>
        <p className="section-subtitle">
          Approval cards should stay obvious on a small screen and should not hide the option to deny.
        </p>
        <div className="actions-row">
          <button type="button" className="button-primary">
            Allow
          </button>
          <button type="button" className="button-ghost">
            Deny
          </button>
          <button type="button" className="button-secondary">
            Return control to desktop
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Boundaries</p>
          <h2 className="section-title">What stays out of the page layer</h2>
        </div>
        <dl className="detail-grid">
          {sessionFacts.map((fact) => (
            <div key={fact.label} className="detail-kv">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form className="prompt-bar">
        <label className="prompt-label" htmlFor="prompt">
          Queue the next instruction for the desktop session.
        </label>
        <div className="prompt-row">
          <input
            id="prompt"
            name="prompt"
            className="prompt-input"
            type="text"
            placeholder="Ask the desktop side to inspect the next file..."
          />
          <button type="submit" className="button-primary">
            Send prompt
          </button>
        </div>
      </form>
    </div>
  );
}