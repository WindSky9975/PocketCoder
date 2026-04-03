import { randomUUID } from "node:crypto";

import type { RelayDeviceRole } from "../../storage/repositories/device-record-repository.js";

interface RelaySocketLike {
  readyState: number;
  send(data: string): void;
}

export interface ConnectionRecord {
  connectionId: string;
  deviceId: string;
  role: RelayDeviceRole;
  socket: RelaySocketLike;
  connectedAt: string;
  lastSeenAt: string;
  subscriptions: Set<string>;
}

export interface ConnectionRegistryStats {
  activeConnections: number;
  browserConnections: number;
  desktopConnections: number;
}

export interface ConnectionRegistry {
  register(args: { deviceId: string; role: RelayDeviceRole; socket: RelaySocketLike }): ConnectionRecord;
  unregister(connectionId: string): void;
  touch(connectionId: string): void;
  get(connectionId: string): ConnectionRecord | null;
  getLatestByDeviceId(deviceId: string): ConnectionRecord | null;
  subscribe(connectionId: string, sessionId: string): void;
  listSubscribers(sessionId: string): ConnectionRecord[];
  send(connectionId: string, payload: string): void;
  stats(): ConnectionRegistryStats;
}

export function createConnectionRegistry(): ConnectionRegistry {
  const connections = new Map<string, ConnectionRecord>();

  return {
    register(args) {
      const connection: ConnectionRecord = {
        connectionId: randomUUID(),
        deviceId: args.deviceId,
        role: args.role,
        socket: args.socket,
        connectedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        subscriptions: new Set<string>(),
      };
      connections.set(connection.connectionId, connection);
      return connection;
    },
    unregister(connectionId) {
      connections.delete(connectionId);
    },
    touch(connectionId) {
      const connection = connections.get(connectionId);
      if (!connection) {
        return;
      }

      connection.lastSeenAt = new Date().toISOString();
    },
    get(connectionId) {
      return connections.get(connectionId) ?? null;
    },
    getLatestByDeviceId(deviceId) {
      const matches = [...connections.values()].filter((connection) => connection.deviceId === deviceId);
      if (matches.length === 0) {
        return null;
      }

      return matches.sort((left, right) => {
        return Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt);
      })[0] ?? null;
    },
    subscribe(connectionId, sessionId) {
      const connection = connections.get(connectionId);
      if (!connection) {
        return;
      }

      connection.subscriptions.add(sessionId);
    },
    listSubscribers(sessionId) {
      return [...connections.values()].filter((connection) => connection.subscriptions.has(sessionId));
    },
    send(connectionId, payload) {
      const connection = connections.get(connectionId);
      if (!connection || connection.socket.readyState !== 1) {
        return;
      }

      connection.socket.send(payload);
    },
    stats() {
      const browserConnections = [...connections.values()].filter((connection) => connection.role === "browser").length;
      return {
        activeConnections: connections.size,
        browserConnections,
        desktopConnections: connections.size - browserConnections,
      };
    },
  };
}
