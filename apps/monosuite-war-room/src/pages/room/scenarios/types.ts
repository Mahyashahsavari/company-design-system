import type {
  EvidenceItem,
  HistoryEntry,
  LinkedIncidentAlert,
  Participant,
  Question,
  RoomSettingsDraft,
  RoomSeverity,
  ThreatEntity,
  WorkflowStep,
  WorkflowStatus,
} from '../data';
import type { CollabThreadDef, WorkflowWorkItem } from '../components/response-workflow/workflowCanvasData';

export type ScenarioRoomId = 'room-port-scan' | 'room-ransomware' | 'room-brute-force';

export interface ScenarioIncident {
  id: string;
  title: string;
  severity: RoomSeverity;
  status: 'Active';
  scenario: string;
  killChain: string;
  mitre: string;
  mitreId: string;
  mitreTactic: string;
  mitreTechnique: string;
  threatActor: string;
  owner: string;
  occurred: string;
  detected: string;
  source: string;
  fromAdapter: boolean;
}

export interface RoomListMeta {
  id: ScenarioRoomId;
  incidentId: string;
  title: string;
  status: 'live';
  phase: string;
  commander: string;
  participantCount: number;
  updatedLabel: string;
  href?: string;
}

/** Full mock pack for one presentation room. */
export interface RoomScenarioPack {
  id: ScenarioRoomId;
  listMeta: RoomListMeta;
  incident: ScenarioIncident;
  roomSettings: RoomSettingsDraft;
  commanderParticipantId: string;
  participants: Participant[];
  attackerEntities: ThreatEntity[];
  victimEntities: ThreatEntity[];
  linkedAlerts: LinkedIncidentAlert[];
  questions: Question[];
  collabThreads: CollabThreadDef[];
  workItems: WorkflowWorkItem[];
  evidence: EvidenceItem[];
  history: HistoryEntry[];
  /** Override NIST step statuses — Detected starts as current for 0→100 walks. */
  workflowStepStatuses: Record<string, WorkflowStatus>;
  /** Seed Commander phase-skip policy (e.g. no eradication/recovery work). */
  initialPhaseSkippable?: Record<string, boolean>;
}

export function applyWorkflowStepStatuses(
  steps: WorkflowStep[],
  statuses: Record<string, WorkflowStatus>,
): WorkflowStep[] {
  return steps.map((step) => ({
    ...step,
    status: statuses[step.id] ?? step.status,
  }));
}

/** All phases pending except Detected = current. */
export const START_AT_DETECTED_STATUSES: Record<string, WorkflowStatus> = {
  detected: 'current',
  triage: 'pending',
  investigation: 'pending',
  containment: 'pending',
  eradication: 'pending',
  recovery: 'pending',
  'lessons-learned': 'pending',
};
