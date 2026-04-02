import { createAgentdRuntime } from "../bootstrap.js";
import { issuePairingToken } from "../security/pairing.js";

export async function startCli(argv = process.argv.slice(2)): Promise<void> {
  if (argv[0] === "auth") {
    console.log(issuePairingToken());
    return;
  }

  const runtime = createAgentdRuntime();
  await runtime.start();
}

startCli().catch((error: unknown) => {
  console.error("[agentd] cli failed", error);
  process.exitCode = 1;
});