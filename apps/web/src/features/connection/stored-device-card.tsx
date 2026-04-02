"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  clearStoredPairedDevice,
  loadStoredPairedDevice,
  type StoredPairedDevice,
} from "../../lib/storage/device-store.ts";
import { useMessages } from "../../lib/i18n/provider.tsx";

export function StoredDeviceCard(props: {
  onDeviceChange?: (device: StoredPairedDevice | null) => void;
}) {
  const { onDeviceChange } = props;
  const [pairedDevice, setPairedDevice] = useState<StoredPairedDevice | null | undefined>(undefined);
  const messages = useMessages();

  useEffect(() => {
    const device = loadStoredPairedDevice();
    setPairedDevice(device);
    onDeviceChange?.(device);
  }, [onDeviceChange]);

  function handleForgetPairing() {
    clearStoredPairedDevice();
    setPairedDevice(null);
    onDeviceChange?.(null);
  }

  if (pairedDevice === undefined) {
    return (
      <section className="section-card stack-card">
        <p className="eyebrow">{messages.storedDevice.eyebrow}</p>
        <p className="muted">{messages.storedDevice.checking}</p>
      </section>
    );
  }

  if (!pairedDevice) {
    return (
      <section className="empty-card stack-card">
        <p className="eyebrow">{messages.storedDevice.eyebrow}</p>
        <h2>{messages.storedDevice.emptyTitle}</h2>
        <p className="muted">{messages.storedDevice.emptyDescription}</p>
        <div className="actions-row">
          <Link href="/pair" className="button-primary">
            {messages.storedDevice.pairPhone}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card stack-card">
      <div className="section-head">
        <p className="eyebrow">{messages.storedDevice.sectionEyebrow}</p>
        <h2 className="section-title">{messages.storedDevice.sectionTitle}</h2>
      </div>
      <dl className="detail-grid">
        <div className="detail-kv">
          <dt>{messages.storedDevice.deviceId}</dt>
          <dd>{pairedDevice.deviceId}</dd>
        </div>
        <div className="detail-kv">
          <dt>{messages.storedDevice.relayOrigin}</dt>
          <dd>{pairedDevice.relayOrigin}</dd>
        </div>
        <div className="detail-kv">
          <dt>{messages.storedDevice.pairedAt}</dt>
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
          {messages.storedDevice.refreshPairing}
        </Link>
        <button type="button" className="button-ghost" onClick={handleForgetPairing}>
          {messages.storedDevice.forgetPairing}
        </button>
      </div>
    </section>
  );
}
