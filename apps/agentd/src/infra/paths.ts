import path from "node:path";
import { fileURLToPath } from "node:url";

export interface AgentdPaths {
  runtimeRoot: string;
}

export function resolveAgentdPaths(): AgentdPaths {
  const currentFilePath = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFilePath), "../..");

  return {
    runtimeRoot: path.join(packageRoot, ".agentd")
  };
}
