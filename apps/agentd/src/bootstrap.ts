import { createCodexPtyProcess } from "./providers/codex/codex-pty.js";
import { createCodexSessionAdapter } from "./providers/codex/codex-session-adapter.js";
import { createDesktopControlRegistry } from "./platform/windows/control-registry.js";
import { createInputDetector } from "./platform/windows/input-detector.js";
import { loadOrCreateDeviceKeyRecord } from "./security/device-keys.js";
import { createDesktopDeviceProofSigner } from "./security/device-proof.js";
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
  const deviceKey = loadOrCreateDeviceKeyRecord({
    runtimeRoot: paths.runtimeRoot,
    deviceId: process.env.POCKETCODER_DEVICE_ID ?? "desktop-device",
  });
  const sessionRegistry = createSessionRegistry();
  const sessionManager = createSessionManager(sessionRegistry);
  const codexPty = createCodexPtyProcess(config.codexCommand);
  let eventPublisher: ReturnType<typeof createEventPublisher> | null = null;
  const inputDetector = createInputDetector({
    pollIntervalMs: config.windowsInputPollIntervalMs,
  });
  const desktopControl = createDesktopControlRegistry({
    detector: inputDetector,
    onRecovered(recovery) {
      if (!eventPublisher) {
        return;
      }

      void publishDesktopControlRecovery(recovery.sessionId, recovery.reason).catch((error) => {
        logger.error("failed to publish desktop control recovery", {
          sessionId: recovery.sessionId,
          reason: recovery.reason,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    },
  });
  const commandHandler = createCommandHandler(sessionManager, codexPty, desktopControl);
  const relayClient = createRelayClient({
    relayUrl: config.relayUrl,
    deviceId: deviceKey.deviceId,
    publicKey: deviceKey.publicKey,
    createDeviceProof: createDesktopDeviceProofSigner({
      runtimeRoot: paths.runtimeRoot,
      deviceId: deviceKey.deviceId,
    }),
    onCommand: async (command) => {
      const result = await commandHandler.handle(command);
      if (result.updatedSession && eventPublisher) {
        await eventPublisher.publishSessionSummary(result.updatedSession);
        if (result.stateChangeReason) {
          await eventPublisher.publishSessionStateChange(
            result.updatedSession,
            result.stateChangeReason,
          );
        }
      }
    }
  });
  eventPublisher = createEventPublisher(relayClient);
  const sessionAdapter = createCodexSessionAdapter(sessionManager, eventPublisher);

  async function publishDesktopControlRecovery(sessionId: string, reason: string): Promise<void> {
    if (!eventPublisher) {
      return;
    }

    const existing = sessionManager.getSession(sessionId);
    if (!existing) {
      return;
    }

    const updatedSession =
      existing.status === "disconnected"
        ? existing
        : sessionManager.updateStatus(sessionId, "disconnected");
    await eventPublisher.publishSessionSummary(updatedSession);
    await eventPublisher.publishSessionStateChange(updatedSession, reason);
  }

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
      desktopControl.ensureSession(session.sessionId);
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
