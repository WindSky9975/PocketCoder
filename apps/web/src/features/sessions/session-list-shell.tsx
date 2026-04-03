"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SessionStatus, SessionSummaryPayload } from "@pocketcoder/protocol";

import { StoredDeviceCard } from "../connection/stored-device-card.tsx";
import {
  formatLocaleTimestamp,
  getSessionStatusLabel,
  translateClientError,
} from "../../lib/i18n/helpers.ts";
import { useLocale } from "../../lib/i18n/provider.tsx";
import { fetchRelaySessionDirectory } from "../../lib/realtime/session-directory.ts";
import type { StoredPairedDevice } from "../../lib/storage/device-store.ts";

function getChipClass(status: SessionStatus): string {
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

export function SessionListShell() {
  const { locale, messages } = useLocale();
  const [pairedDevice, setPairedDevice] = useState<StoredPairedDevice | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionSummaryPayload[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!pairedDevice) {
      setSessions([]);
      setSessionLoadError(null);
      setIsLoadingSessions(false);
      return;
    }

    let cancelled = false;
    const loadSessions = async (showLoading: boolean) => {
      if (showLoading) {
        setIsLoadingSessions(true);
      }

      setSessionLoadError(null);

      try {
        const nextSessions = await fetchRelaySessionDirectory({
          relayOrigin: pairedDevice.relayOrigin,
          deviceId: pairedDevice.deviceId,
        });

        if (!cancelled) {
          setSessions(nextSessions);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionLoadError(error instanceof Error ? error.message : "relay command failed");
        }
      } finally {
        if (!cancelled && showLoading) {
          setIsLoadingSessions(false);
        }
      }
    };

    void loadSessions(true);
    const timer = globalThis.setInterval(() => {
      void loadSessions(false);
    }, 5_000);

    return () => {
      cancelled = true;
      globalThis.clearInterval(timer);
    };
  }, [pairedDevice]);

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">{messages.sessions.heroEyebrow}</p>
        <h1>{messages.sessions.heroTitle}</h1>
        <p className="lede">{messages.sessions.heroLede}</p>
      </section>

      <StoredDeviceCard onDeviceChange={setPairedDevice} />

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.sessions.overviewEyebrow}</p>
          <h2 className="section-title">{messages.sessions.overviewTitle}</h2>
        </div>
        {sessionLoadError ? (
          <p className="status-note status-note--danger" role="alert">
            {translateClientError(messages, sessionLoadError)}
          </p>
        ) : null}
        {isLoadingSessions ? (
          <p className="status-note">{messages.statuses.connection.loading}</p>
        ) : null}
        {!isLoadingSessions && !sessionLoadError && pairedDevice && sessions.length === 0 ? (
          <p className="status-note">{messages.common.noActivityYet}</p>
        ) : null}
        <div className="session-grid">
          {sessions.map((session) => (
            <Link
              key={session.sessionId}
              href={`/sessions/${session.sessionId}`}
              className="session-card"
            >
              <div className="chip-row">
                <span className={getChipClass(session.status)}>
                  {getSessionStatusLabel(messages, session.status)}
                </span>
                <span className="status-chip">
                  {formatLocaleTimestamp(locale, messages, session.lastActivityAt)}
                </span>
              </div>
              <h2>{session.currentTask ?? `${session.provider} / ${session.sessionId}`}</h2>
              <p className="session-meta">{session.provider}</p>
              <div className="metric-row">
                <span>{session.sessionId}</span>
                <span>{messages.sessions.openDetail}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
