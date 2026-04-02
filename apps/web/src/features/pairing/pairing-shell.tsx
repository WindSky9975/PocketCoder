"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { loadOrCreateBrowserDeviceKeyRecord } from "../../lib/crypto/device-keyring.ts";
import { translateClientError } from "../../lib/i18n/helpers.ts";
import { useMessages } from "../../lib/i18n/provider.tsx";
import { saveStoredPairedDevice } from "../../lib/storage/device-store.ts";
import { startPairing, type PairingStartResult } from "./pairing-controller.ts";

function createBrowserDeviceId(): string {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && globalThis.crypto?.randomUUID) {
    return `browser-${globalThis.crypto.randomUUID()}`;
  }

  return `browser-${Date.now().toString(36)}`;
}

function buildDefaultRelayOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_RELAY_ORIGIN ?? "";
  }

  return process.env.NEXT_PUBLIC_RELAY_ORIGIN ?? window.location.origin;
}

export function PairingShell() {
  const messages = useMessages();
  const defaultDeviceName = messages.pairing.deviceNameDefault;
  const previousDefaultDeviceNameRef = useRef(defaultDeviceName);
  const [relayOrigin, setRelayOrigin] = useState("");
  const [token, setToken] = useState("");
  const [deviceName, setDeviceName] = useState(defaultDeviceName);
  const [pairingState, setPairingState] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PairingStartResult | null>(null);

  useEffect(() => {
    setRelayOrigin(buildDefaultRelayOrigin());

    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const sharedToken = search.get("token");
    if (sharedToken) {
      setToken(sharedToken);
    }
  }, []);

  useEffect(() => {
    const previousDefaultDeviceName = previousDefaultDeviceNameRef.current;
    if (deviceName === previousDefaultDeviceName) {
      setDeviceName(defaultDeviceName);
    }

    previousDefaultDeviceNameRef.current = defaultDeviceName;
  }, [defaultDeviceName, deviceName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPairingState("submitting");
    setErrorMessage(null);

    try {
      const keyRecord = await loadOrCreateBrowserDeviceKeyRecord({
        deviceId: createBrowserDeviceId(),
      });
      const pairingResult = await startPairing({
        relayOrigin: relayOrigin.trim(),
        token: token.trim(),
        deviceName: deviceName.trim(),
        keyRecord,
      });

      saveStoredPairedDevice(pairingResult.pairedDevice);
      setResult(pairingResult);
      setPairingState("success");
    } catch (error) {
      setPairingState("error");
      setErrorMessage(error instanceof Error ? error.message : "pairing failed");
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">{messages.pairing.heroEyebrow}</p>
        <h1>{messages.pairing.heroTitle}</h1>
        <p className="lede">{messages.pairing.heroLede}</p>
        <div className="chip-row">
          {messages.pairing.chips.map((chip, index) => (
            <span
              key={chip}
              className={index === 0 ? "status-chip status-chip--live" : "status-chip"}
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="section-card stack-card">
        <div className="section-head">
          <p className="eyebrow">{messages.pairing.formEyebrow}</p>
          <h2 className="section-title">{messages.pairing.formTitle}</h2>
          <p className="section-subtitle">{messages.pairing.formSubtitle}</p>
        </div>

        <form className="field-grid" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="relay-origin">
            {messages.pairing.relayOriginLabel}
            <input
              id="relay-origin"
              className="text-input"
              name="relayOrigin"
              type="url"
              placeholder={messages.pairing.relayOriginPlaceholder}
              value={relayOrigin}
              onChange={(event) => setRelayOrigin(event.target.value)}
              required
            />
          </label>

          <label className="field-label" htmlFor="device-name">
            {messages.pairing.deviceNameLabel}
            <input
              id="device-name"
              className="text-input"
              name="deviceName"
              type="text"
              placeholder={messages.pairing.deviceNamePlaceholder}
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value)}
              required
            />
          </label>

          <label className="field-label field-label--full" htmlFor="pairing-token">
            {messages.pairing.tokenLabel}
            <input
              id="pairing-token"
              className="text-input"
              name="pairingToken"
              type="text"
              placeholder={messages.pairing.tokenPlaceholder}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
          </label>

          <div className="actions-row">
            <button type="submit" className="button-primary" disabled={pairingState === "submitting"}>
              {pairingState === "submitting"
                ? messages.pairing.submitSubmitting
                : messages.pairing.submitIdle}
            </button>
            <Link href="/sessions" className="button-secondary">
              {messages.pairing.openSessions}
            </Link>
          </div>
        </form>

        <p className="helper-text">{messages.pairing.helperText}</p>

        {errorMessage ? (
          <p className="status-note status-note--danger" role="alert">
            {translateClientError(messages, errorMessage)}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="section-card stack-card">
          <div className="section-head">
            <p className="eyebrow">{messages.pairing.resultEyebrow}</p>
            <h2 className="section-title">{messages.pairing.resultTitle}</h2>
          </div>
          <dl className="detail-grid">
            <div className="detail-kv">
              <dt>{messages.pairing.browserDeviceLabel}</dt>
              <dd>{result.pairedDevice.deviceId}</dd>
            </div>
            <div className="detail-kv">
              <dt>{messages.pairing.desktopDeviceLabel}</dt>
              <dd>{result.desktopDeviceId}</dd>
            </div>
            <div className="detail-kv">
              <dt>{messages.pairing.relayOriginResultLabel}</dt>
              <dd>{result.pairedDevice.relayOrigin}</dd>
            </div>
            <div className="detail-kv">
              <dt>{messages.pairing.registeredAtLabel}</dt>
              <dd>{result.registrationEnvelope.payload.registeredAt}</dd>
            </div>
          </dl>
          <div className="pill-list">
            {result.grantedScopes.map((scope) => (
              <span key={scope} className="pill">
                {scope}
              </span>
            ))}
          </div>
          <div className="actions-row">
            <Link href="/sessions" className="button-primary">
              {messages.pairing.continueToSessions}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">{messages.pairing.flowEyebrow}</p>
          <h2 className="section-title">{messages.pairing.flowTitle}</h2>
        </div>
        <ol className="timeline">
          {messages.pairing.steps.map((step, index) => (
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
          <p className="eyebrow">{messages.pairing.guardrailsEyebrow}</p>
          <h2 className="section-title">{messages.pairing.guardrailsTitle}</h2>
        </div>
        <ul className="list">
          {messages.pairing.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
