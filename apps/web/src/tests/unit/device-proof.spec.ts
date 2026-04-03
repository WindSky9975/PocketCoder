import assert from "node:assert/strict";
import { createPublicKey, verify } from "node:crypto";
import { describe, it } from "node:test";

import { createBrowserDeviceProof } from "../../lib/crypto/device-proof.ts";
import {
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

describe("browser device proof", () => {
  it("signs a browser identity proof with the persisted device key", async () => {
    const storage = createMemoryStorage();
    const keyRecord = await loadOrCreateBrowserDeviceKeyRecord({
      deviceId: "browser-proof",
      storage,
    });

    const proof = await createBrowserDeviceProof({
      deviceId: "browser-registered",
      storage,
    });

    assert.equal(typeof proof.timestamp, "string");
    assert.equal(typeof proof.signature, "string");
    assert.equal(proof.signature.length > 16, true);
    assert.equal(
      verify(
        "sha256",
        Buffer.from(
          JSON.stringify({
            deviceId: "browser-registered",
            role: "browser",
            timestamp: proof.timestamp,
          }),
          "utf8",
        ),
        {
          key: createPublicKey({
            key: Buffer.from(keyRecord.publicKey, "base64"),
            format: "der",
            type: "spki",
          }),
          dsaEncoding: "ieee-p1363",
        },
        Buffer.from(proof.signature, "base64url"),
      ),
      true,
    );
  });
});
