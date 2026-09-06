import type { RoomScenarioPack } from './types';
import { START_AT_DETECTED_STATUSES } from './types';
import {
  investigationBoard,
  laterPhaseGates,
  phaseGateWork,
  SCENARIO_COMMANDER_ID,
  SCENARIO_PARTICIPANTS,
} from './shared';
import { CURRENT_USER } from '../../../shared/constants';

const PREFIX = 'rw';

export const ransomwareScenario: RoomScenarioPack = {
  id: 'room-ransomware',
  listMeta: {
    id: 'room-ransomware',
    incidentId: 'INC-RW-2002',
    title: 'Ransomware precursor on finance VLAN',
    status: 'live',
    phase: 'Detected',
    commander: CURRENT_USER.name,
    participantCount: SCENARIO_PARTICIPANTS.length + 1,
    updatedLabel: '3 min ago',
  },
  incident: {
    id: 'INC-RW-2002',
    title: 'Ransomware precursor on finance VLAN',
    severity: 'Critical',
    status: 'Active',
    scenario: 'Ransomware',
    killChain: 'Cyber Attack Kill Chain',
    mitre: 'Impact → Data Encrypted for Impact',
    mitreId: 'T1486',
    mitreTactic: 'Impact',
    mitreTechnique: 'Data Encrypted for Impact',
    threatActor: 'Suspected LockBit affiliate',
    owner: CURRENT_USER.name,
    occurred: '02:08',
    detected: '02:11',
    source: 'EDR',
    fromAdapter: true,
  },
  roomSettings: {
    title: 'Ransomware precursor on finance VLAN',
    description:
      'EDR reported mass file-rename and shadow-copy deletion attempts on srv-finance-07. Room opened to contain spread, protect backups, and coordinate business communication.',
    workflow: 'nist-800-61',
    tags: ['Ransomware', 'Finance', 'EDR', 'Containment'],
    incidentReferences: [],
    attackerReferences: [],
    victimReferences: [],
    visibility: 'organization',
    tlp: { level: 'AMBER', strict: true },
    pap: 'RED',
  },
  commanderParticipantId: SCENARIO_COMMANDER_ID,
  participants: SCENARIO_PARTICIPANTS,
  attackerEntities: [
    {
      id: 'rw-attacker-1',
      identifier: '185.220.101.22',
      identifierType: 'ip',
      secondaryIdentifier: 'C2 candidate',
      fields: [
        { label: 'Reputation', value: 'Known ransomware C2 cluster', priority: 'critical' },
        { label: 'Protocol', value: 'HTTPS · 443', priority: 'critical' },
      ],
      sourceId: 'src-edr',
    },
  ],
  victimEntities: [
    {
      id: 'rw-victim-1',
      identifier: 'srv-finance-07',
      identifierType: 'host',
      secondaryIdentifier: '10.40.12.17',
      fields: [
        { label: 'Role', value: 'Finance file server', priority: 'critical' },
        { label: 'VLAN', value: 'Finance', priority: 'critical' },
        { label: 'Backup', value: 'Last good · 01:00', priority: 'critical' },
      ],
      sourceId: 'src-edr',
    },
  ],
  linkedAlerts: [
    {
      id: 'rw-link-edr',
      source: 'EDR',
      alerts: [
        { id: 'rw-a1', value: 'RANSOM-STAGE-4412', fromAdapter: true },
        { id: 'rw-a2', value: 'SHADOW-DELETE-4412', fromAdapter: true },
      ],
    },
  ],
  questions: [
    {
      id: 201,
      text: 'Has encryption started on share volumes, or only staging?',
      status: 'open',
      answerCount: 0,
      participantCount: 3,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 202,
      text: 'Are backup repositories reachable from srv-finance-07?',
      status: 'open',
      answerCount: 0,
      participantCount: 2,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 203,
      text: 'Isolate srv-finance-07 from the finance VLAN now?',
      status: 'decision',
      answerCount: 0,
      participantCount: 3,
      decision: null,
      options: ['Isolate now', 'Isolate after backup snapshot', 'Monitor only'],
      assigneeRole: 'responder',
      roleLabel: 'Responder',
      selectionMode: 'multi',
      allowOther: true,
      requiredForPhase: true,
      roleAnswers: [],
    },
  ],
  collabThreads: [
    {
      id: 'rw-encrypt',
      label: 'Encryption & isolation',
      phaseId: 'investigation',
      itemIds: [201, 202, 203],
    },
  ],
  workItems: [
    phaseGateWork(
      'detected',
      `${PREFIX}-detected-ack`,
      'Acknowledge ransomware alert',
      'Confirm this EDR ransomware-stage alert is valid intake.',
      ['Valid — continue', 'False positive', 'Duplicate'],
    ),
    phaseGateWork(
      'triage',
      `${PREFIX}-triage-sev`,
      'Confirm critical severity',
      'Keep Critical severity for business impact?',
      ['Keep Critical', 'Downgrade to High', 'Needs more evidence'],
    ),
    ...investigationBoard(PREFIX, {
      ownerQ: 'How long can Finance accept offline file shares during containment?',
      adminQ: 'Which containment method should be applied to srv-finance-07?',
      investigatorQ: 'Document encryption stage and C2 indicators.',
      responderQ: 'Which finance shares show rename activity?',
      ownerOpts: ['Up to 30 minutes', 'Up to 2 hours', 'No interruption approved'],
      adminOpts: ['EDR network isolation', 'Switch port shutdown', 'Disable SMB shares'],
      responderOpts: ['\\\\finance\\AP', '\\\\finance\\payroll', 'Local volumes only'],
    }),
    ...laterPhaseGates(PREFIX),
  ],
  evidence: [],
  history: [
    {
      time: '02:11',
      actor: 'System',
      action: 'Incident synchronized from EDR · RANSOM-STAGE-4412',
      highlight: true,
    },
    {
      time: '02:12',
      actor: CURRENT_USER.name,
      action: 'opened the room',
      highlight: false,
    },
  ],
  workflowStepStatuses: START_AT_DETECTED_STATUSES,
};
