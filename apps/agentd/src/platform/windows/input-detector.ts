export interface LocalInputSignal {
  sessionId: string;
  detectedAt: string;
  kind: "keyboard";
}

export interface InputDetector {
  subscribe(onInput: (signal: LocalInputSignal) => void): () => void;
}

export function createInputDetector(): InputDetector {
  return {
    subscribe(onInput) {
      void onInput;
      return () => undefined;
    },
  };
}