import path from "node:path";

export interface AgentdPaths {
  runtimeRoot: string;
}

export function resolveAgentdPaths(): AgentdPaths {
  return {
    runtimeRoot: path.resolve(process.cwd(), ".agentd")
  };
}