import { startCli } from "./cli/index.js";

async function main(): Promise<void> {
  await startCli();
}

main().catch((error: unknown) => {
  console.error("[agentd] bootstrap failed", error);
  process.exitCode = 1;
});