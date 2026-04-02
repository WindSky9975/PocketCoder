"use client";

import { useMessages } from "../../lib/i18n/provider.tsx";

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
  const messages = useMessages();

  return (
    <section className="approval-card">
      <p className="eyebrow">{messages.approval.eyebrow}</p>
      <h2>{prompt}</h2>
      <p className="section-subtitle">
        {messages.approval.approvalId}: {approvalId}
      </p>
      <p className="section-subtitle">
        {messages.approval.issuedAt}: {issuedAt}
      </p>
      <div className="actions-row">
        <button
          type="button"
          className="button-primary"
          onClick={() => onDecision("allow")}
          disabled={disabled}
        >
          {messages.approval.allow}
        </button>
        <button
          type="button"
          className="button-ghost"
          onClick={() => onDecision("deny")}
          disabled={disabled}
        >
          {messages.approval.deny}
        </button>
      </div>
    </section>
  );
}
