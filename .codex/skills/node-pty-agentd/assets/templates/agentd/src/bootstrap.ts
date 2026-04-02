import { createCodexPtyProcess } from "./providers/codex/codex-pty.js";
import { createCodexSessionAdapter } from "./providers/codex/codex-session-adapter.js";
import { createSessionManager } from "./sessions/session-manager.js";
import { createSessionRegistry } from "./sessions/session-registry.js";
import { createCommandHandler } from "./transport/command-handler.js";
import { createEventPublisher } from "./transport/event-publisher.js";
import { createRelayClient } from "./transport/relay-client.js";
import { readAgentdConfig } from "./infra/config.js";
import { createLogger } from "./infra/logger.js";
import { resolveAgentdPaths } from "./infra/paths.js";

export interface AgentdRuntime {
  start(): Promise<void>;
}

export function createAgentdRuntime(): AgentdRuntime {
  const config = readAgentdConfig();
  const logger = createLogger();
  const paths = resolveAgentdPaths();
  const sessionRegistry = createSessionRegistry();
  const sessionManager = createSessionManager(sessionRegistry);
  const relayClient = createRelayClient(config.relayUrl);
  const eventPublisher = createEventPublisher(relayClient);
  const commandHandler = createCommandHandler(sessionManager);
  const codexPty = createCodexPtyProcess(config.codexCommand);
  const sessionAdapter = createCodexSessionAdapter(sessionManager, eventPublisher);

  return {
    async start() {
      logger.info("starting agentd runtime", { paths });
      await relayClient.connect();
      await codexPty.start();
      await commandHandler.handle({ type: "SessionSummary", payload: {} });
      await sessionAdapter.apply({
        type: "session.started",
        payload: { sessionId: "default-session" }
      });
    }
  };
}