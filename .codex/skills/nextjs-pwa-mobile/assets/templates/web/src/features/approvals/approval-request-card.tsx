export interface ApprovalRequestCardProps {
  approvalId: string;
  prompt: string;
  issuedAt: string;
  disabled?: boolean;
  onDecision: (decision: "allow" | "deny") => void;
}

export function ApprovalRequestCard({
  approvalId,
  prompt,
  issuedAt,
  disabled = false,
  onDecision,
}: ApprovalRequestCardProps) {
  return (
    <section className="approval-card">
      <p className="eyebrow">Approval</p>
      <h2>{prompt}</h2>
      <p className="section-subtitle">Approval id: {approvalId}</p>
      <p className="section-subtitle">Issued at: {issuedAt}</p>
      <div className="actions-row">
        <button
          type="button"
          className="button-primary"
          onClick={() => onDecision("allow")}
          disabled={disabled}
        >
          Allow
        </button>
        <button
          type="button"
          className="button-ghost"
          onClick={() => onDecision("deny")}
          disabled={disabled}
        >
          Deny
        </button>
      </div>
    </section>
  );
}
