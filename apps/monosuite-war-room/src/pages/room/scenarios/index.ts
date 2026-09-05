import type { RoomListMeta } from './types';
import { bruteForceScenario } from './bruteForce';
import { portScanScenario } from './portScan';
import { ransomwareScenario } from './ransomware';
import type { RoomScenarioPack, ScenarioRoomId } from './types';

export type { RoomScenarioPack, ScenarioRoomId, ScenarioIncident, RoomListMeta } from './types';
export { applyWorkflowStepStatuses, START_AT_DETECTED_STATUSES } from './types';

export const ROOM_SCENARIOS: Record<ScenarioRoomId, RoomScenarioPack> = {
  'room-port-scan': portScanScenario,
  'room-ransomware': ransomwareScenario,
  'room-brute-force': bruteForceScenario,
};

export const ROOM_SCENARIO_LIST: RoomScenarioPack[] = [
  portScanScenario,
  ransomwareScenario,
  bruteForceScenario,
];

export function getRoomScenario(roomId: string | undefined): RoomScenarioPack | null {
  if (!roomId) return null;
  return ROOM_SCENARIOS[roomId as ScenarioRoomId] ?? null;
}

export function scenarioRoomHref(roomId: ScenarioRoomId): string {
  return `/rooms/${roomId}`;
}

/** Rooms table rows derived from scenario packs. */
export function buildScenarioRoomList(): RoomListMeta[] {
  return ROOM_SCENARIO_LIST.map((pack) => ({
    ...pack.listMeta,
    href: scenarioRoomHref(pack.id),
  }));
}
