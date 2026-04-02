"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ApprovalRequestedPayload, SessionStatus } from "@pocketcoder/protocol";

import { ApprovalRequestCard } from "../approvals/approval-request-card.tsx";
import {
  formatLocaleTimestamp,
  getConnectionStateLabel,
  getDecisionLabel,
  getSessionStatusLabel,
  getStreamLabel,
  translateClientError,
  type ConnectionState,
} from "../../lib/i18n/helpers.ts";
import { useLocale } from "../../lib/i18n/provider.tsx";
import {
  createBrowserRelayClient,
  resolveRelayWebSocketUrl,
  type BrowserRelayClient,
  type RelayInboundMessage,
} from "../../lib/realtime/relay-client.ts";
import { loadStoredPairedDevice, type StoredPairedDevice } from "../../lib/storage/device-store.ts";

function statusChipClass(status: SessionStatus | "disconnected"): string {
  if (status === "running") {
    return "status-chip status-chip--live";
  }

  if (status === "waiting_approval" || status === "waiting_input") {
    return "status-chip status-chip--warn";
  }

  if (status === "error" || status === "disconnected") {
    return "status-chip status-chip--danger";
  }

  return "status-chip";
}

function appendOutputLine(current: string[], nextLine: string): string[] {
  const next = [...current, nextLine];
  return next.slice(Math.max(0, next.length - 60));
}

export function SessionDetailShell({ sessionId }: { sessionId: string }) {
  const { locale, messages } = useLocale();
  const [pairedDevice, setPairedDevice] = useState<StoredPairedDevice | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [transportError, setTransportError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | "disconnected">("disconnected");
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestedPayload[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const clientRef = useRef<BrowserRelayClient | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const storedDevice = loadStoredPairedDevice();
    if (!storedDevice) {
      setConnectionState("missing_pairing");
      return;
    }

    setPairedDevice(storedDevice);
  }, []);

  useEffect(() => {
    if (!pairedDevice) {
      return;
    }

    let closed = false;

    function handleInboundMessage(message: RelayInboundMessage) {
      if (message.type === "connected") {
        setConnectionState("connected");
        setTransportError(null);
        return;
      }

      switch (message.type) {
        case "SessionSummary":
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          setSessionStatus(message.payload.status);
          setCurrentTask(
            message.payload.currentTask ?? messagesRef.current.sessionDetail.currentTaskConnected,
          );
          setLastActivityAt(message.payload.lastActivityAt);
          break;
        case "SessionOutputDelta":
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          setOutputLines((current) =>
            appendOutputLine(
              current,
              `[${getStreamLabel(messagesRef.current, message.payload.stream)}] ${message.payload.delta}`,
            ),
          );
          break;
        case "SessionStateChanged":
        {
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          const reason = message.payload.reason;
          setSessionStatus(message.payload.status);
          setLastActivityAt(new Date().toISOString());
          if (reason) {
            setOutputLines((current) =>
              appendOutputLine(
                current,
                messagesRef.current.sessionDetail.outputStateReason(reason),
              ),
            );
          }
          break;
        }
        case "ApprovalRequested":
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          setApprovalRequests((current) => {
            if (current.some((request) => request.approvalId === message.payload.approvalId)) {
              return current;
            }

            return [...current, message.payload];
          });
          setSessionStatus("waiting_approval");
          break;
        case "Ack":
          setTransportError(null);
          break;
        case "ErrorEnvelope":
          setTransportError(message.payload.message);
          setConnectionState("error");
          break;
        default:
          break;
      }
    }

    const relayClient = createBrowserRelayClient({
      relayUrl: resolveRelayWebSocketUrl(pairedDevice.relayOrigin),
      deviceId: pairedDevice.deviceId,
      onMessage(message) {
        if (!closed) {
          handleInboundMessage(message);
        }
      },
    });

    clientRef.current = relayClient;
    setConnectionState("connecting");
    setTransportError(null);

    void relayClient
      .connect()
      .then(async () => {
        if (closed) {
          return;
        }

        setConnectionState("connected");
        await relayClient.subscribe(sessionId);
        setOutputLines((current) =>
          appendOutputLine(current, messagesRef.current.sessionDetail.outputSubscribed(sessionId)),
        );
      })
      .catch((error: unknown) => {
        if (closed) {
          return;
        }

        setConnectionState("error");
        setTransportError(error instanceof Error ? error.message : "failed to connect to relay");
      });

    return () => {
      closed = true;
      clientRef.current = null;
      void relayClient.disconnect();
    };
  }, [pairedDevice, sessionId]);

  async function runTransportAction(action: () => Promise<void>, successNote: string) {
    const relayClient = clientRef.current;
    if (!relayClient) {
      setTransportError("relay connection is not ready");
      return;
    }

    setIsSending(true);
    setTransportError(null);

    try {
      await action();
      setLastActivityAt(new Date().toISOString());
      setOutputLines((current) => appendOutputLine(current, successNote));
    } catch (error) {
      setTransportError(error instanceof Error ? error.message : "relay command failed");
    } finally {
      setIsSending(false);
    }
  }

  async function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    await runTransportAction(
      () => clientRef.current!.sendPrompt(sessionId, trimmedPrompt),
      messages.sessionDetail.outputPromptQueued(trimmedPrompt),
    );
    setPrompt("");
  }

  async function handleApprovalDecision(approvalId: string, decision: "allow" | "deny") {
    await runTransportAction(
      () => clientRef.current!.respondToApproval(sessionId, approvalId, decision),
      messages.sessionDetail.outputApprovalDecision(
        approvalId,
        getDecisionLabel(messages, decision),
      ),
    );

    setApprovalRequests((current) => current.filter((request) => request.approvalId !== approvalId));
  }

  async function handleResumeDesktopControl() {
    await runTransportAction(
      () => clientRef.current!.resumeDesktopControl(sessionId),
      messages.sessionDetail.outputResumeControl,
    );
  }

  async function handleInterruptSession() {
    await runTransportAction(
      () => clientRef.current!.interruptSession(sessionId, messages.sessionDetail.interruptReason),
      messages.sessionDetail.outputInterrupt,
    );
  }

  if (connectionState === "missing_pairing") {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <p className="eyebrow">{messages.sessionDetail.heroEyebrow}</p>
          <h1>{sessionId}</h1>
          <p className="lede">{messages.sessionDetail.missingPairingLede}</p>
        </section>

        <section className="empty-card stack-card">
          <h2>{messages.sessionDetail.missingPairingTitle}</h2>
          <p className="muted">{messages.sessionDetail.missingPairingDescription}</p>
          <div className="actions-row">
            <Link href="/pair" className="button-primary">
              {messages.sessionDetail.goToPair}
            </Link>
            <Link href="/sessions" className="button-secondary">
              {messages.sessionDetail.backToSessions}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">{messages.sessionDetail.heroEyebrow}</p>
        <h1>{sessionId}</h1>
        <p className="lede">{messages.sessionDetail.heroLede}</p>
        <div className="chip-row">
          <span className={statusChipClass(sessionStatus)}>
            {getSessionStatusLabel(messages, sessionStatus)}
          </span>
          <span className={connectionState === "connected" ? "status-chip status-chip--live" : "status-chip"}>
            {getConnectionStateLabel(messages, connectionState)}
          </span>
          {pairedDevice ? <span className="status-chip">{pairedDevice.deviceId}</span> : null}
        </div>
      </section>

      <section className="section-card stack-card">
        <div className="section-head">
          <p className="eyebrow">{messages.sessionDetail.stateEyebrow}</p>
          <h2 className="section-title">
            {currentTask ?? messages.sessionDetail.currentTaskWaitingSummary}
          </h2>
          <p className="section-subtitle">
            {messages.sessionDetail.lastActivityLabel}:{" "}
            {formatLocaleTimestamp(locale, messages, lastActivityAt)}
          </p>
        </div>
        {transportError ? (
          <p className="status-note status-note--danger" role="alert">
            {translateClientError(messages, transportError)}
          </p>
        ) : (
          <p className="status-note">
            {messages.sessionDetail.relayOriginLabel}:{" "}
            {pairedDevice?.relayOrigin ?? messages.common.waitingPairedDevice}
          </p>
        )}
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleResumeDesktopControl}
            disabled={isSending || connectionState !== "connected"}
          >
            {messages.sessionDetail.returnControl}
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={handleInterruptSession}
            disabled={isSending || connectionState !== "connected"}
          >
            {messages.sessionDetail.interruptSession}
          </button>
        </div>
      </section>

      <section className="terminal-panel">
        <div className="section-head">
          <p className="eyebrow">{messages.sessionDetail.outputEyebrow}</p>
          <h2 className="section-title">{messages.sessionDetail.outputTitle}</h2>
          <p className="terminal-note">{messages.sessionDetail.outputNote}</p>
        </div>
        <div className="terminal-output" aria-label={messages.sessionDetail.outputAriaLabel}>
          {(outputLines.length === 0 ? [messages.sessionDetail.outputWaiting] : outputLines).map(
            (line, index) => (
            <p key={`${line}-${index}`} className="terminal-line">
              {line}
            </p>
          ),
          )}
        </div>
      </section>

      {approvalRequests.length > 0 ? (
        <div className="page-stack">
          {approvalRequests.map((request) => (
            <ApprovalRequestCard
              key={request.approvalId}
              approvalId={request.approvalId}
              prompt={request.prompt}
              issuedAt={request.issuedAt}
              disabled={isSending || connectionState !== "connected"}
              onDecision={(decision) => {
                void handleApprovalDecision(request.approvalId, decision);
              }}
            />
          ))}
        </div>
      ) : (
        <section className="section-card stack-card">
          <p className="eyebrow">{messages.sessionDetail.approvalsEyebrow}</p>
          <p className="muted">{messages.sessionDetail.noApprovals}</p>
        </section>
      )}

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.sessionDetail.boundariesEyebrow}</p>
          <h2 className="section-title">{messages.sessionDetail.boundariesTitle}</h2>
        </div>
        <dl className="detail-grid">
          {messages.sessionDetail.facts.map((fact) => (
            <div key={fact.label} className="detail-kv">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form className="prompt-bar" onSubmit={handlePromptSubmit}>
        <label className="prompt-label" htmlFor="prompt">
          {messages.sessionDetail.promptLabel}
        </label>
        <div className="prompt-row">
          <input
            id="prompt"
            name="prompt"
            className="prompt-input"
            type="text"
            placeholder={messages.sessionDetail.promptPlaceholder}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            type="submit"
            className="button-primary"
            disabled={isSending || connectionState !== "connected"}
          >
            {messages.sessionDetail.sendPrompt}
          </button>
        </div>
      </form>
    </div>
  );
}
