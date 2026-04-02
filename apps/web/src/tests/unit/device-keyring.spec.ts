import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBrowserDeviceKeyRecord,
  loadOrCreateBrowserDeviceKeyRecord,
  type BrowserKeyStorageLike,
} from "../../lib/crypto/device-keyring.ts";

function createMemoryStorage(): BrowserKeyStorageLike {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

describe("browser keyring boundary", () => {
  it("keeps a deterministic test helper for protocol-facing unit tests", () => {
    const record = createBrowserDeviceKeyRecord("browser-test");

    assert.equal(record.deviceId, "browser-test");
    assert.equal(record.publicKeyAlgorithm, "ecdsa-p256");
  });

  it("persists a generated browser identity and reuses it on subsequent loads", async () => {
    const storage = createMemoryStorage();

    const first = await loadOrCreateBrowserDeviceKeyRecord({
      deviceId: "browser-a",
      storage,
    });
    const second = await loadOrCreateBrowserDeviceKeyRecord({
      deviceId: "browser-b",
      storage,
    });

    assert.equal(first.deviceId, "browser-a");
    assert.equal(second.deviceId, "browser-a");
    assert.equal(first.publicKey, second.publicKey);
    assert.equal(first.publicKeyAlgorithm, "ecdsa-p256");
  });
});
