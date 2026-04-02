const recoverySteps = [
  "Check whether the desktop relay connection is still active.",
  "Retry the WebSocket subscription through the realtime boundary.",
  "Reconnect with the paired identity instead of re-running the whole pairing flow.",
  "Escalate to desktop recovery only after the mobile shell reports the degraded state clearly.",
];

export default function ConnectionErrorPage() {
  return (
    <div className="page-stack">
      <section className="empty-card">
        <p className="eyebrow">Connection Error</p>
        <h1>Keep recovery clear when the live link degrades.</h1>
        <p className="lede">
          This screen explains the current failure, offers the next safe action, and avoids hiding
          transport concerns inside the page component.
        </p>
        <div className="actions-row">
          <button type="button" className="button-primary">
            Retry connection
          </button>
          <button type="button" className="button-ghost">
            Open pairing page
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Recovery</p>
          <h2 className="section-title">Suggested next actions</h2>
        </div>
        <ul className="list">
          {recoverySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}