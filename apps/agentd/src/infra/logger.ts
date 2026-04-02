export interface AgentdLogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(): AgentdLogger {
  return {
    info(message, context) {
      console.log("[agentd]", message, context ?? {});
    },
    error(message, context) {
      console.error("[agentd]", message, context ?? {});
    }
  };
}