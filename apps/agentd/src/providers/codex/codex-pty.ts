export interface CodexPtyProcess {
  start(): Promise<void>;
  write(input: string): Promise<void>;
  stop(): Promise<void>;
}

export function createCodexPtyProcess(command: string): CodexPtyProcess {
  return {
    async start() {
      console.log("[agentd] start codex PTY", { command });
    },
    async write(input) {
      console.log("[agentd] write to codex PTY", { input });
    },
    async stop() {
      console.log("[agentd] stop codex PTY");
    }
  };
}