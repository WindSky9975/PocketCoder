import { execFile } from "node:child_process";
import { promisify } from "node:util";

export interface LocalInputSignal {
  sessionId: string;
  detectedAt: string;
  kind: "keyboard";
}

export interface InputDetector {
  subscribe(onInput: (signal: LocalInputSignal) => void): () => void;
  watchSession(sessionId: string): void;
  unwatchSession(sessionId: string): void;
  dispose(): void;
}

type LastInputMarker = string;
type LastInputReader = () => Promise<LastInputMarker | null>;

interface SessionWatch {
  baseline: LastInputMarker | null;
}

const execFileAsync = promisify(execFile);
const WINDOWS_LAST_INPUT_SCRIPT = [
  "$signature = @'",
  "using System;",
  "using System.Runtime.InteropServices;",
  "public static class PocketCoderLastInput {",
  "  [StructLayout(LayoutKind.Sequential)]",
  "  public struct LASTINPUTINFO {",
  "    public uint cbSize;",
  "    public uint dwTime;",
  "  }",
  "  [DllImport(\"user32.dll\")]",
  "  public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);",
  "}",
  "'@;",
  "Add-Type -TypeDefinition $signature;",
  "$info = New-Object PocketCoderLastInput+LASTINPUTINFO;",
  "$info.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($info);",
  "if (-not [PocketCoderLastInput]::GetLastInputInfo([ref]$info)) { exit 1 }",
  "Write-Output $info.dwTime",
].join(" ");

export async function readWindowsLastInputMarker(): Promise<LastInputMarker | null> {
  try {
    const { stdout } = await execFileAsync("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      WINDOWS_LAST_INPUT_SCRIPT,
    ]);
    const marker = stdout.trim();
    return marker.length > 0 ? marker : null;
  } catch {
    return null;
  }
}

function createNoopInputDetector(): InputDetector {
  return {
    subscribe() {
      return () => undefined;
    },
    watchSession() {
      return undefined;
    },
    unwatchSession() {
      return undefined;
    },
    dispose() {
      return undefined;
    },
  };
}

export function createInputDetector(args: {
  pollIntervalMs?: number;
  lastInputReader?: LastInputReader;
  platform?: NodeJS.Platform;
} = {}): InputDetector {
  const platform = args.platform ?? process.platform;
  if (platform !== "win32") {
    return createNoopInputDetector();
  }

  const listeners = new Set<(signal: LocalInputSignal) => void>();
  const watches = new Map<string, SessionWatch>();
  const pollIntervalMs = Math.max(250, args.pollIntervalMs ?? 1_000);
  const readLastInputMarker = args.lastInputReader ?? readWindowsLastInputMarker;
  let lastObservedMarker: LastInputMarker | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let polling = false;

  function stopPollingIfIdle() {
    if (watches.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function poll(): Promise<void> {
    if (disposed || polling) {
      return;
    }

    polling = true;
    try {
      const marker = await readLastInputMarker();
      if (disposed || marker === null) {
        return;
      }

      lastObservedMarker = marker;
      for (const [sessionId, watch] of watches) {
        if (watch.baseline === null) {
          watch.baseline = marker;
          continue;
        }

        if (watch.baseline === marker) {
          continue;
        }

        watch.baseline = marker;
        const signal: LocalInputSignal = {
          sessionId,
          detectedAt: new Date().toISOString(),
          kind: "keyboard",
        };
        for (const listener of listeners) {
          listener(signal);
        }
      }
    } finally {
      polling = false;
    }
  }

  function ensurePolling() {
    if (disposed || timer !== null || watches.size === 0) {
      return;
    }

    timer = setInterval(() => {
      void poll();
    }, pollIntervalMs);
    void poll();
  }

  return {
    subscribe(onInput) {
      listeners.add(onInput);
      return () => {
        listeners.delete(onInput);
      };
    },
    watchSession(sessionId) {
      watches.set(sessionId, {
        baseline: lastObservedMarker,
      });
      ensurePolling();
    },
    unwatchSession(sessionId) {
      watches.delete(sessionId);
      stopPollingIfIdle();
    },
    dispose() {
      disposed = true;
      watches.clear();
      listeners.clear();
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}

export interface ManualInputDetector extends InputDetector {
  emit(signal: LocalInputSignal): void;
}

export function createManualInputDetector(): ManualInputDetector {
  const listeners = new Set<(signal: LocalInputSignal) => void>();

  return {
    subscribe(onInput) {
      listeners.add(onInput);
      return () => {
        listeners.delete(onInput);
      };
    },
    watchSession() {
      return undefined;
    },
    unwatchSession() {
      return undefined;
    },
    dispose() {
      listeners.clear();
    },
    emit(signal) {
      for (const listener of listeners) {
        listener(signal);
      }
    },
  };
}
