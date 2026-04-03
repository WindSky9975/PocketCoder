export interface LocalInputSignal {
  sessionId: string;
  detectedAt: string;
  kind: "keyboard";
}

export interface InputDetector {
  subscribe(onInput: (signal: LocalInputSignal) => void): () => void;
}

export function createInputDetector(): InputDetector {
  const listeners = new Set<(signal: LocalInputSignal) => void>();

  return {
    subscribe(onInput) {
      listeners.add(onInput);
      return () => {
        listeners.delete(onInput);
      };
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
    emit(signal) {
      for (const listener of listeners) {
        listener(signal);
      }
    },
  };
}
