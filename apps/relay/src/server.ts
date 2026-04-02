import { readRelayConfig } from "./infra/config.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = readRelayConfig();
  const app = await buildApp(config);

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error: unknown) => {
  console.error("[relay] bootstrap failed", error);
  process.exitCode = 1;
});
