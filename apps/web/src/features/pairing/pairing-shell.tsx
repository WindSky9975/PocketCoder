"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { createBrowserDeviceKeyRecord } from "../../lib/crypto/device-keyring.ts";
import { saveStoredPairedDevice } from "../../lib/storage/device-store.ts";
import { startPairing, type PairingStartResult } from "./pairing-controller.ts";

const steps = [
  {
    title: "Show pairing readiness",
    description: "Confirm the handset is online, authenticated, and ready to bind to a desktop peer.",
  },
  {
    title: "Enter or scan the device code",
    description: "Keep token entry in the feature shell while key handling stays behind browser-side boundaries.",
  },
  {
    title: "Persist the paired identity",
    description: "Store only the browser device record locally after the relay accepts the pairing flow.",
  },
];

const notes = [
  "Shared protocol schemas still live in @pocketcoder/protocol only.",
  "The page shell delegates fetch, key, and storage work to feature or lib boundaries.",
  "Pairing success should leave the sessions route ready to open a live session subscription.",
];

const DEFAULT_DEVICE_NAME = "PocketCoder Mobile";

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
  const [relayOrigin, setRelayOrigin] = useState("");
  const [token, setToken] = useState("");
  const [deviceName, setDeviceName] = useState(DEFAULT_DEVICE_NAME);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPairingState("submitting");
    setErrorMessage(null);

    try {
      const keyRecord = createBrowserDeviceKeyRecord(createBrowserDeviceId());
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
        <p className="eyebrow">Pairing</p>
        <h1>Bootstrap a trusted mobile endpoint.</h1>
        <p className="lede">
          The route stays focused on device linking while the feature shell owns relay fetch,
          browser key scaffolding, and local paired-device persistence.
        </p>
        <div className="chip-row">
          <span className="status-chip status-chip--live">HTTP pairing init</span>
          <span className="status-chip">Browser key placeholder</span>
          <span className="status-chip">Local device cache</span>
        </div>
      </section>

      <section className="section-card stack-card">
        <div className="section-head">
          <p className="eyebrow">Start Pairing</p>
          <h2 className="section-title">Bind this phone to a desktop relay identity</h2>
          <p className="section-subtitle">
            Provide the relay origin and one-time token from `agentd auth`, then store the paired
            browser device locally after the relay confirms registration.
          </p>
        </div>

        <form className="field-grid" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="relay-origin">
            Relay origin
            <input
              id="relay-origin"
              className="text-input"
              name="relayOrigin"
              type="url"
              placeholder="https://relay.example.com"
              value={relayOrigin}
              onChange={(event) => setRelayOrigin(event.target.value)}
              required
            />
          </label>

          <label className="field-label" htmlFor="device-name">
            Device name
            <input
              id="device-name"
              className="text-input"
              name="deviceName"
              type="text"
              placeholder={DEFAULT_DEVICE_NAME}
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value)}
              required
            />
          </label>

          <label className="field-label field-label--full" htmlFor="pairing-token">
            Pairing token
            <input
              id="pairing-token"
              className="text-input"
              name="pairingToken"
              type="text"
              placeholder="pair.v1.xxxxx"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
          </label>

          <div className="actions-row">
            <button type="submit" className="button-primary" disabled={pairingState === "submitting"}>
              {pairingState === "submitting" ? "Pairing..." : "Pair this device"}
            </button>
            <Link href="/sessions" className="button-secondary">
              Open sessions
            </Link>
          </div>
        </form>

        <p className="helper-text">
          The paired browser device is stored through `lib/storage` only. Deeper E2EE key lifecycle
          remains a later hardening step.
        </p>

        {errorMessage ? (
          <p className="status-note status-note--danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="section-card stack-card">
          <div className="section-head">
            <p className="eyebrow">Pairing Result</p>
            <h2 className="section-title">Browser device registered</h2>
          </div>
          <dl className="detail-grid">
            <div className="detail-kv">
              <dt>Browser device</dt>
              <dd>{result.pairedDevice.deviceId}</dd>
            </div>
            <div className="detail-kv">
              <dt>Desktop device</dt>
              <dd>{result.desktopDeviceId}</dd>
            </div>
            <div className="detail-kv">
              <dt>Relay origin</dt>
              <dd>{result.pairedDevice.relayOrigin}</dd>
            </div>
            <div className="detail-kv">
              <dt>Registered at</dt>
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
              Continue to sessions
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section-card">
        <div className="section-head">
          <p className="eyebrow">Flow</p>
          <h2 className="section-title">What the pairing feature coordinates</h2>
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
          <h2 className="section-title">Keep the feature boundary honest</h2>
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
