export interface AgentdConfig {
  codexCommand: string;
  relayUrl: string;
  relayConnectRetries: number;
  relayRetryDelayMs: number;
}

export function readAgentdConfig(): AgentdConfig {
  return {
    codexCommand: process.env.CODEX_COMMAND ?? "codex",
    relayUrl: process.env.RELAY_URL ?? "ws://127.0.0.1:8787/ws",
    relayConnectRetries: readPositiveInteger(process.env.RELAY_CONNECT_RETRIES, 30),
    relayRetryDelayMs: readPositiveInteger(process.env.RELAY_RETRY_DELAY_MS, 1000),
  };
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
