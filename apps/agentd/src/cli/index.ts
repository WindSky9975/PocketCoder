import { resolveAgentdPaths } from "../infra/paths.js";
import { loadOrCreateDeviceKeyRecord } from "../security/device-keys.js";
import { createAgentdRuntime } from "../bootstrap.js";
import { issuePairingToken } from "../security/pairing.js";

export async function startCli(argv = process.argv.slice(2)): Promise<void> {
  if (argv[0] === "auth") {
    const paths = resolveAgentdPaths();
    const deviceKey = loadOrCreateDeviceKeyRecord({
      runtimeRoot: paths.runtimeRoot,
      deviceId: process.env.POCKETCODER_DEVICE_ID ?? "desktop-device",
    });
    console.log(
      issuePairingToken({
        runtimeRoot: paths.runtimeRoot,
        deviceKey,
        webOrigin: process.env.POCKETCODER_WEB_ORIGIN,
      }),
    );
    return;
  }

  const runtime = createAgentdRuntime();
  await runtime.start();
}

startCli().catch((error: unknown) => {
  console.error("[agentd] cli failed", error);
  process.exitCode = 1;
});
