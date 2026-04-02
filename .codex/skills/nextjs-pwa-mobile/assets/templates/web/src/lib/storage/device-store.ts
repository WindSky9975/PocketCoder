export interface StoredPairedDevice {
  deviceId: string;
  pairedAt: string;
  relayOrigin: string;
  accessScope: string[];
}

export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const DEFAULT_SCOPE = "default";
const STORAGE_KEY_PREFIX = "pocketcoder.paired-device";

export function createStoredPairedDevice(
  deviceId: string,
  relayOrigin: string,
  accessScope = ["session:read", "session:write"],
): StoredPairedDevice {
  return {
    deviceId,
    pairedAt: new Date().toISOString(),
    relayOrigin,
    accessScope,
  };
}

export function getStoredPairedDeviceKey(scope = DEFAULT_SCOPE): string {
  return `${STORAGE_KEY_PREFIX}:${scope}`;
}

export function saveStoredPairedDevice(
  device: StoredPairedDevice,
  options: {
    scope?: string;
    storage?: BrowserStorageLike;
  } = {},
): void {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return;
  }

  storage.setItem(getStoredPairedDeviceKey(options.scope), JSON.stringify(device));
}

export function loadStoredPairedDevice(
  options: {
    scope?: string;
    storage?: BrowserStorageLike;
  } = {},
): StoredPairedDevice | null {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(getStoredPairedDeviceKey(options.scope));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPairedDevice>;
    if (
      typeof parsed.deviceId !== "string" ||
      typeof parsed.pairedAt !== "string" ||
      typeof parsed.relayOrigin !== "string" ||
      !Array.isArray(parsed.accessScope) ||
      parsed.accessScope.some((scope) => typeof scope !== "string")
    ) {
      return null;
    }

    return {
      deviceId: parsed.deviceId,
      pairedAt: parsed.pairedAt,
      relayOrigin: parsed.relayOrigin,
      accessScope: parsed.accessScope,
    };
  } catch {
    return null;
  }
}

export function clearStoredPairedDevice(
  options: {
    scope?: string;
    storage?: BrowserStorageLike;
  } = {},
): void {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return;
  }

  storage.removeItem(getStoredPairedDeviceKey(options.scope));
}

function resolveStorage(storage?: BrowserStorageLike): BrowserStorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
