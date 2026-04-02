import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const npmCommand = "npm";
const children = new Map();
let shuttingDown = false;

main().catch((error) => {
  console.error("[dev]", error instanceof Error ? error.message : String(error));
  shutdown(1);
});

async function main() {
  const preferredRelayPort = readPort(process.env.RELAY_PORT, 8787);
  const preferredWebPort = readPort(process.env.WEB_PORT, 3000);
  const relayPort = await findAvailablePort(preferredRelayPort);
  const webPort = await findAvailablePort(preferredWebPort);
  const relayOrigin = `http://127.0.0.1:${relayPort}`;
  const relayUrl = `ws://127.0.0.1:${relayPort}/ws`;
  const relayHealthUrl = `${relayOrigin}/health`;

  logPortSelection("relay", preferredRelayPort, relayPort);
  logPortSelection("web", preferredWebPort, webPort);
  console.log(`[dev] web will be available at http://127.0.0.1:${webPort}`);

  startWorkspace(
    "relay",
    ["--workspace", "@pocketcoder/relay", "run", "dev"],
    {
      HOST: "127.0.0.1",
      PORT: String(relayPort),
      RELAY_PUBLIC_ORIGIN: relayOrigin,
    },
  );
  startWorkspace(
    "web",
    ["--workspace", "@pocketcoder/web", "run", "dev"],
    {
      PORT: String(webPort),
      NEXT_DIST_DIR: `.next-dev-${webPort}`,
      NEXT_PUBLIC_RELAY_ORIGIN: relayOrigin,
    },
  );

  console.log(`[dev] waiting for relay health at ${relayHealthUrl}`);
  await waitForRelayHealth(relayHealthUrl, 60_000);

  startWorkspace(
    "agentd",
    ["--workspace", "@pocketcoder/agentd", "run", "dev"],
    {
      RELAY_URL: relayUrl,
      RELAY_HEALTH_URL: relayHealthUrl,
    },
  );
}

function startWorkspace(name, args, extraEnv = {}) {
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  children.set(name, child);

  child.on("exit", (code, signal) => {
    children.delete(name);

    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`[dev] ${name} stopped by signal ${signal}`);
      shutdown(1);
      return;
    }

    if (code && code !== 0) {
      console.error(`[dev] ${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  child.on("error", (error) => {
    console.error(`[dev] failed to start ${name}`, error);
    shutdown(1);
  });
}

async function waitForRelayHealth(healthUrl, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const relayProcess = children.get("relay");
    if (!relayProcess) {
      throw new Error("relay exited before becoming healthy");
    }

    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log("[dev] relay is healthy; starting agentd");
        return;
      }
    } catch {
      // relay is still starting
    }

    await delay(1000);
  }

  throw new Error(`timed out waiting for relay health at ${healthUrl}`);
}

async function findAvailablePort(preferredPort) {
  let port = preferredPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: "127.0.0.1",
      port,
    });
    socket.setTimeout(750);
    socket.on("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        resolve(true);
        return;
      }

      resolve(false);
    });
  });
}

function readPort(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function logPortSelection(name, preferredPort, selectedPort) {
  if (preferredPort === selectedPort) {
    console.log(`[dev] ${name} will use preferred port ${selectedPort}`);
    return;
  }

  console.log(
    `[dev] ${name} preferred port ${preferredPort} is in use; using ${selectedPort} instead`,
  );
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutdown(0);
  });
}

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    terminateChild(child);
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 200);
}

function terminateChild(child) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  child.kill("SIGTERM");
}
