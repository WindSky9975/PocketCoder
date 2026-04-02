"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ApprovalRequestedPayload, SessionStatus } from "@pocketcoder/protocol";

import { ApprovalRequestCard } from "../approvals/approval-request-card.tsx";
import {
  createBrowserRelayClient,
  resolveRelayWebSocketUrl,
  type BrowserRelayClient,
  type RelayInboundMessage,
} from "../../lib/realtime/relay-client.ts";
import { loadStoredPairedDevice, type StoredPairedDevice } from "../../lib/storage/device-store.ts";

type ConnectionState = "loading" | "missing_pairing" | "connecting" | "connected" | "error";

const sessionFacts = [
  { label: "Ownership", value: "Desktop remains the source of execution" },
  { label: "Realtime", value: "WebSocket stream enters through lib/realtime" },
  { label: "Storage", value: "Session hints may persist through lib/storage only" },
  { label: "Protocol", value: "Shared contract types come from @pocketcoder/protocol" },
];

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

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "No activity received yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function appendOutputLine(current: string[], nextLine: string): string[] {
  const next = [...current, nextLine];
  return next.slice(Math.max(0, next.length - 60));
}

export function SessionDetailShell({ sessionId }: { sessionId: string }) {
  const [pairedDevice, setPairedDevice] = useState<StoredPairedDevice | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [transportError, setTransportError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | "disconnected">("disconnected");
  const [currentTask, setCurrentTask] = useState("Awaiting the first session summary from relay.");
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [outputLines, setOutputLines] = useState<string[]>([
    "[browser] waiting for relay subscription...",
  ]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestedPayload[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const clientRef = useRef<BrowserRelayClient | null>(null);

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
          setCurrentTask(message.payload.currentTask ?? "Desktop session is connected.");
          setLastActivityAt(message.payload.lastActivityAt);
          break;
        case "SessionOutputDelta":
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          setOutputLines((current) =>
            appendOutputLine(
              current,
              `${message.payload.stream === "stderr" ? "[stderr]" : "[stdout]"} ${message.payload.delta}`,
            ),
          );
          break;
        case "SessionStateChanged":
          if (message.payload.sessionId !== sessionId) {
            return;
          }

          setSessionStatus(message.payload.status);
          setLastActivityAt(new Date().toISOString());
          if (message.payload.reason) {
            setOutputLines((current) => appendOutputLine(current, `[state] ${message.payload.reason}`));
          }
          break;
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
        setOutputLines((current) => appendOutputLine(current, `[browser] subscribed to ${sessionId}`));
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
      `[browser] prompt queued: ${trimmedPrompt}`,
    );
    setPrompt("");
  }

  async function handleApprovalDecision(approvalId: string, decision: "allow" | "deny") {
    await runTransportAction(
      () => clientRef.current!.respondToApproval(sessionId, approvalId, decision),
      `[browser] approval ${approvalId} -> ${decision}`,
    );

    setApprovalRequests((current) => current.filter((request) => request.approvalId !== approvalId));
  }

  async function handleResumeDesktopControl() {
    await runTransportAction(
      () => clientRef.current!.resumeDesktopControl(sessionId),
      "[browser] requested desktop control handoff",
    );
  }

  async function handleInterruptSession() {
    await runTransportAction(
      () => clientRef.current!.interruptSession(sessionId, "mobile operator interrupt"),
      "[browser] interrupt requested for the active session",
    );
  }

  if (connectionState === "missing_pairing") {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <p className="eyebrow">Session Detail</p>
          <h1>{sessionId}</h1>
          <p className="lede">
            This route is ready for realtime subscription, but the browser has no paired device id
            in local storage yet.
          </p>
        </section>

        <section className="empty-card stack-card">
          <h2>Pair this phone before subscribing</h2>
          <p className="muted">
            The session-detail shell only opens relay WebSocket traffic with a paired browser
            identity. Start from the pair route, then return here.
          </p>
          <div className="actions-row">
            <Link href="/pair" className="button-primary">
              Go to pair
            </Link>
            <Link href="/sessions" className="button-secondary">
              Back to sessions
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Session Detail</p>
        <h1>{sessionId}</h1>
        <p className="lede">
          The feature shell owns subscription setup, prompt submission, approval responses, and the
          explicit return-control command while the route stays composition-only.
        </p>
        <div className="chip-row">
          <span className={statusChipClass(sessionStatus)}>{sessionStatus}</span>
          <span className={connectionState === "connected" ? "status-chip status-chip--live" : "status-chip"}>
            {connectionState}
          </span>
          {pairedDevice ? <span className="status-chip">{pairedDevice.deviceId}</span> : null}
        </div>
      </section>

      <section className="section-card stack-card">
        <div className="section-head">
          <p className="eyebrow">Session State</p>
          <h2 className="section-title">{currentTask}</h2>
          <p className="section-subtitle">Last activity: {formatTimestamp(lastActivityAt)}</p>
        </div>
        {transportError ? (
          <p className="status-note status-note--danger" role="alert">
            {transportError}
          </p>
        ) : (
          <p className="status-note">
            Relay origin: {pairedDevice?.relayOrigin ?? "waiting for paired device"}
          </p>
        )}
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleResumeDesktopControl}
            disabled={isSending || connectionState !== "connected"}
          >
            Return control to desktop
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={handleInterruptSession}
            disabled={isSending || connectionState !== "connected"}
          >
            Interrupt session
          </button>
        </div>
      </section>

      <section className="terminal-panel">
        <div className="section-head">
          <p className="eyebrow">Realtime Output</p>
          <h2 className="section-title">Stream shell</h2>
          <p className="terminal-note">
            Transport ownership stays under `lib/realtime`; the feature renders a mobile-readable
            feed from the parsed protocol envelopes.
          </p>
        </div>
        <div className="terminal-output" aria-label="Session output stream">
          {outputLines.map((line, index) => (
            <p key={`${line}-${index}`} className="terminal-line">
              {line}
            </p>
          ))}
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
          <p className="eyebrow">Approvals</p>
          <p className="muted">
            No approval request is currently queued for this browser. When the desktop side pauses
            for approval, the request will surface here.
          </p>
        </section>
      )}

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

      <form className="prompt-bar" onSubmit={handlePromptSubmit}>
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
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            type="submit"
            className="button-primary"
            disabled={isSending || connectionState !== "connected"}
          >
            Send prompt
          </button>
        </div>
      </form>
    </div>
  );
}
