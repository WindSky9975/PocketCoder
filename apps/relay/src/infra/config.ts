export interface RelayConfig {
  host: string;
  port: number;
  publicOrigin: string;
  replayWindowMs: number;
}

export function readRelayConfig(): RelayConfig {
  const port = Number(process.env.PORT ?? 8787);

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port,
    publicOrigin: process.env.RELAY_PUBLIC_ORIGIN ?? `http://127.0.0.1:${port}`,
    replayWindowMs: Number(process.env.RELAY_REPLAY_WINDOW_MS ?? 120000),
  };
}
