import { createCodexPtyProcess } from "./providers/codex/codex-pty.js";
import { createCodexSessionAdapter } from "./providers/codex/codex-session-adapter.js";
import { createDeviceKeyRecord } from "./security/device-keys.js";
import { createSessionManager } from "./sessions/session-manager.js";
import { createSessionRegistry } from "./sessions/session-registry.js";
import { createCommandHandler } from "./transport/command-handler.js";
import { createEventPublisher } from "./transport/event-publisher.js";
import { createRelayClient } from "./transport/relay-client.js";
import { readAgentdConfig } from "./infra/config.js";
import { createLogger, type AgentdLogger } from "./infra/logger.js";
import { resolveAgentdPaths } from "./infra/paths.js";

export interface AgentdRuntime {
  start(): Promise<void>;
}

export function createAgentdRuntime(): AgentdRuntime {
  const config = readAgentdConfig();
  const logger = createLogger();
  const paths = resolveAgentdPaths();
  const deviceKey = createDeviceKeyRecord(
    process.env.POCKETCODER_DEVICE_ID ?? "desktop-device",
  );
  const sessionRegistry = createSessionRegistry();
  const sessionManager = createSessionManager(sessionRegistry);
  const codexPty = createCodexPtyProcess(config.codexCommand);
  const commandHandler = createCommandHandler(sessionManager, codexPty);
  const relayClient = createRelayClient({
    relayUrl: config.relayUrl,
    deviceId: deviceKey.deviceId,
    onCommand: async (command) => {
      await commandHandler.handle(command);
    }
  });
  const eventPublisher = createEventPublisher(relayClient);
  const sessionAdapter = createCodexSessionAdapter(sessionManager, eventPublisher);

  return {
    async start() {
      logger.info("starting agentd runtime", { paths, deviceId: deviceKey.deviceId });
      await connectRelayWithRetry({
        relayClient,
        logger,
        relayUrl: config.relayUrl,
        retries: config.relayConnectRetries,
        retryDelayMs: config.relayRetryDelayMs,
      });
      await codexPty.start();
      const session = sessionManager.openSession("default-session", "codex");
      await eventPublisher.publishSessionSummary(session);
      await sessionAdapter.apply({
        type: "session.started",
        payload: { sessionId: "default-session" }
      });
    }
  };
}

async function connectRelayWithRetry(args: {
  relayClient: { connect(): Promise<void> };
  logger: AgentdLogger;
  relayUrl: string;
  retries: number;
  retryDelayMs: number;
}): Promise<void> {
  for (let attempt = 1; attempt <= args.retries; attempt += 1) {
    try {
      await args.relayClient.connect();

      if (attempt > 1) {
        args.logger.info("connected to relay after retry", {
          relayUrl: args.relayUrl,
          attempt,
        });
      }

      return;
    } catch (error) {
      if (attempt === args.retries) {
        throw error;
      }

      args.logger.info("relay is not ready yet; retrying agentd connection", {
        relayUrl: args.relayUrl,
        attempt,
        retries: args.retries,
        retryDelayMs: args.retryDelayMs,
        error: error instanceof Error ? error.message : String(error),
      });
      await delay(args.retryDelayMs);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
