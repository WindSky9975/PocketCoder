"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  clearStoredPairedDevice,
  loadStoredPairedDevice,
  type StoredPairedDevice,
} from "../../lib/storage/device-store.ts";

export function StoredDeviceCard() {
  const [pairedDevice, setPairedDevice] = useState<StoredPairedDevice | null | undefined>(undefined);

  useEffect(() => {
    setPairedDevice(loadStoredPairedDevice());
  }, []);

  function handleForgetPairing() {
    clearStoredPairedDevice();
    setPairedDevice(null);
  }

  if (pairedDevice === undefined) {
    return (
      <section className="section-card stack-card">
        <p className="eyebrow">Pairing Cache</p>
        <p className="muted">Checking browser storage for an existing paired device...</p>
      </section>
    );
  }

  if (!pairedDevice) {
    return (
      <section className="empty-card stack-card">
        <p className="eyebrow">Pairing Cache</p>
        <h2>No paired browser device yet</h2>
        <p className="muted">
          Pair this phone first so the session detail route can open a relay subscription with a
          registered browser device id.
        </p>
        <div className="actions-row">
          <Link href="/pair" className="button-primary">
            Pair this phone
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card stack-card">
      <div className="section-head">
        <p className="eyebrow">Paired Browser Device</p>
        <h2 className="section-title">Local relay identity is ready</h2>
      </div>
      <dl className="detail-grid">
        <div className="detail-kv">
          <dt>Device id</dt>
          <dd>{pairedDevice.deviceId}</dd>
        </div>
        <div className="detail-kv">
          <dt>Relay origin</dt>
          <dd>{pairedDevice.relayOrigin}</dd>
        </div>
        <div className="detail-kv">
          <dt>Paired at</dt>
          <dd>{pairedDevice.pairedAt}</dd>
        </div>
      </dl>
      <div className="pill-list">
        {pairedDevice.accessScope.map((scope) => (
          <span key={scope} className="pill">
            {scope}
          </span>
        ))}
      </div>
      <div className="actions-row">
        <Link href="/pair" className="button-secondary">
          Refresh pairing
        </Link>
        <button type="button" className="button-ghost" onClick={handleForgetPairing}>
          Forget local pairing
        </button>
      </div>
    </section>
  );
}
