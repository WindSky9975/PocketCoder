import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clearStoredPairedDevice,
  createStoredPairedDevice,
  getStoredPairedDeviceKey,
  loadStoredPairedDevice,
  saveStoredPairedDevice,
  type BrowserStorageLike,
} from "../../lib/storage/device-store.ts";

function createMemoryStorage(): BrowserStorageLike {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe("device store boundary", () => {
  it("persists paired devices under a scoped storage key", () => {
    const storage = createMemoryStorage();
    const pairedDevice = createStoredPairedDevice("browser-1", "https://relay.example", [
      "session:read",
    ]);

    saveStoredPairedDevice(pairedDevice, {
      scope: "pairing",
      storage,
    });

    assert.deepEqual(
      loadStoredPairedDevice({
        scope: "pairing",
        storage,
      }),
      pairedDevice,
    );
    assert.equal(getStoredPairedDeviceKey("pairing"), "pocketcoder.paired-device:pairing");
  });

  it("clears stored pairing records without affecting other scopes", () => {
    const storage = createMemoryStorage();
    saveStoredPairedDevice(createStoredPairedDevice("browser-a", "https://relay-a.example"), {
      scope: "desktop-a",
      storage,
    });
    saveStoredPairedDevice(createStoredPairedDevice("browser-b", "https://relay-b.example"), {
      scope: "desktop-b",
      storage,
    });

    clearStoredPairedDevice({
      scope: "desktop-a",
      storage,
    });

    assert.equal(
      loadStoredPairedDevice({
        scope: "desktop-a",
        storage,
      }),
      null,
    );
    assert.equal(
      loadStoredPairedDevice({
        scope: "desktop-b",
        storage,
      })?.deviceId,
      "browser-b",
    );
  });
});
