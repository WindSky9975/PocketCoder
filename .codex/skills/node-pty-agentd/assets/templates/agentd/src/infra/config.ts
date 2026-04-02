export interface AgentdConfig {
  codexCommand: string;
  relayUrl: string;
}

export function readAgentdConfig(): AgentdConfig {
  return {
    codexCommand: process.env.CODEX_COMMAND ?? "codex",
    relayUrl: process.env.RELAY_URL ?? "ws://127.0.0.1:8787/ws"
  };
}