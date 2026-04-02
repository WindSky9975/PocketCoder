const steps = [
  {
    title: "Show pairing readiness",
    description: "Confirm the handset is online, authenticated, and ready to bind to a desktop peer.",
  },
  {
    title: "Enter or scan the device code",
    description: "Expose only the pairing surface here. Keep key exchange and storage policy in dedicated browser libraries.",
  },
  {
    title: "Persist the paired identity later",
    description: "Store durable device state through lib/storage after the protocol flow succeeds.",
  },
];

const notes = [
  "Do not place shared schema definitions inside the page layer.",
  "Do not let the route own local key management or approval logic.",
  "Keep the page small enough that repair work stays predictable.",
];

export default function PairPage() {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Pairing</p>
        <h1>Bootstrap a trusted mobile endpoint.</h1>
        <p className="lede">
          The page sets the scene for device linking, but the actual crypto and protocol work
          belongs behind browser-side boundaries.
        </p>
        <div className="pair-code" aria-label="Example device code">
          PC-7429
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Flow</p>
          <h2 className="section-title">What the route should coordinate</h2>
        </div>
        <ol className="timeline">
          {steps.map((step, index) => (
            <li key={step.title} className="timeline-step">
              <span className="timeline-index">{index + 1}</span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Guardrails</p>
          <h2 className="section-title">Keep the page shell honest</h2>
        </div>
        <ul className="list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}