export interface RelayConfig {
  host: string;
  port: number;
}

export function readRelayConfig(): RelayConfig {
  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 8787)
  };
}