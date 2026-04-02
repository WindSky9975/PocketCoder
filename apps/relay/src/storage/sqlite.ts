import {
  createCommandDedupeRepository,
  type CommandDedupeRepository,
  type CommandReceiptRecord,
} from "./repositories/command-dedupe-repository.js";
import {
  createDeviceRecordRepository,
  type DeviceRecord,
  type DeviceRecordRepository,
} from "./repositories/device-record-repository.js";
import {
  createPairingRecordRepository,
  type PairingRecord,
  type PairingRecordRepository,
} from "./repositories/pairing-record-repository.js";
import {
  createReplayEventRepository,
  type ReplayEventRecord,
  type ReplayEventRepository,
} from "./repositories/replay-event-repository.js";
import {
  createSessionRouteRepository,
  type SessionRouteRecord,
  type SessionRouteRepository,
} from "./repositories/session-route-repository.js";

export interface RelayStorageStats {
  kind: "memory";
  pairingTokens: number;
  devices: number;
  sessionRoutes: number;
  replayEvents: number;
  commandReceipts: number;
}

export interface RelayStorage {
  kind: "memory";
  pairingRecords: PairingRecordRepository;
  devices: DeviceRecordRepository;
  sessionRoutes: SessionRouteRepository;
  replayEvents: ReplayEventRepository;
  commandReceipts: CommandDedupeRepository;
  ping(): Promise<{ ok: true; kind: "memory" }>;
  stats(): RelayStorageStats;
}

export function createRelayStorage(): RelayStorage {
  const pairingStore = new Map<string, PairingRecord>();
  const deviceStore = new Map<string, DeviceRecord>();
  const sessionRouteStore = new Map<string, SessionRouteRecord>();
  const replayStore: ReplayEventRecord[] = [];
  const commandReceiptStore = new Map<string, CommandReceiptRecord>();

  const pairingRecords = createPairingRecordRepository(pairingStore);
  const devices = createDeviceRecordRepository(deviceStore);
  const sessionRoutes = createSessionRouteRepository(sessionRouteStore);
  const replayEvents = createReplayEventRepository(replayStore);
  const commandReceipts = createCommandDedupeRepository(commandReceiptStore);

  return {
    kind: "memory",
    pairingRecords,
    devices,
    sessionRoutes,
    replayEvents,
    commandReceipts,
    async ping() {
      return { ok: true, kind: "memory" };
    },
    stats() {
      return {
        kind: "memory",
        pairingTokens: pairingRecords.list().length,
        devices: devices.list().length,
        sessionRoutes: sessionRoutes.list().length,
        replayEvents: replayEvents.list().length,
        commandReceipts: commandReceipts.list().length,
      };
    },
  };
}
