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

const PREFIX = 'ps';

export const portScanScenario: RoomScenarioPack = {
  id: 'room-port-scan',
  listMeta: {
    id: 'room-port-scan',
    incidentId: 'INC-PS-1001',
    title: 'External port scan against DMZ edge',
    status: 'live',
    phase: 'Detected',
    commander: CURRENT_USER.name,
    participantCount: SCENARIO_PARTICIPANTS.length + 1,
    updatedLabel: 'Just now',
  },
  incident: {
    id: 'INC-PS-1001',
    title: 'External port scan against DMZ edge',
    severity: 'Medium',
    status: 'Active',
    scenario: 'Port Scan / Reconnaissance',
    killChain: 'Cyber Attack Kill Chain',
    mitre: 'Discovery → Network Service Discovery',
    mitreId: 'T1046',
    mitreTactic: 'Discovery',
    mitreTechnique: 'Network Service Discovery',
    threatActor: 'Unknown (opportunistic)',
    owner: CURRENT_USER.name,
    occurred: '08:12',
    detected: '08:14',
    source: 'Firewall',
    fromAdapter: true,
  },
  roomSettings: {
    title: 'External port scan against DMZ edge',
    description:
      'Inbound TCP port scan from 203.0.113.44 hitting edge firewall fw-dmz-01 across common service ports. Room opened to validate intent, scope, and whether follow-on exploitation is underway.',
    workflow: 'nist-800-61',
    tags: ['Port Scan', 'Recon', 'DMZ', 'Firewall'],
    incidentReferences: [],
    attackerReferences: [],
    victimReferences: [],
  },
  commanderParticipantId: SCENARIO_COMMANDER_ID,
  participants: SCENARIO_PARTICIPANTS,
  attackerEntities: [
    {
      id: 'ps-attacker-1',
      identifier: '203.0.113.44',
      identifierType: 'ip',
      secondaryIdentifier: 'Scan source',
      fields: [
        { label: 'ASN', value: 'AS64500 · Example Hosting', priority: 'critical' },
        { label: 'Geo', value: 'NL · Amsterdam', priority: 'secondary' },
        { label: 'Ports hit', value: '22, 80, 443, 3389, 8080', priority: 'critical' },
      ],
      sourceId: 'src-fw',
    },
  ],
  victimEntities: [
    {
      id: 'ps-victim-1',
      identifier: 'fw-dmz-01',
      identifierType: 'host',
      secondaryIdentifier: '10.10.0.1',
      fields: [
        { label: 'Role', value: 'DMZ edge firewall', priority: 'critical' },
        { label: 'Zone', value: 'DMZ', priority: 'critical' },
        { label: 'Owner', value: 'Network Ops', priority: 'secondary' },
      ],
      sourceId: 'src-fw',
    },
  ],
  linkedAlerts: [
    {
      id: 'ps-link-fw',
      source: 'Firewall',
      alerts: [
        { id: 'ps-a1', value: 'PORTSCAN-8841', fromAdapter: true },
        { id: 'ps-a2', value: 'DENY-BURST-203.0.113.44', fromAdapter: true },
      ],
    },
  ],
  questions: [
    {
      id: 101,
      text: 'Is this scan opportunistic or targeted at known DMZ services?',
      status: 'open',
      answerCount: 0,
      participantCount: 3,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 102,
      text: 'Which exposed services on fw-dmz-01 are internet-reachable?',
      status: 'open',
      answerCount: 0,
      participantCount: 2,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 103,
      text: 'Block the scanner ASN at the edge?',
      status: 'decision',
      answerCount: 0,
      participantCount: 3,
      decision: null,
      options: ['Block ASN now', 'Block source IP only', 'Monitor only'],
      assigneeRole: 'responder',
      roleLabel: 'Responder',
      selectionMode: 'single',
      allowOther: true,
      requiredForPhase: true,
      roleAnswers: [],
    },
  ],
  collabThreads: [
    {
      id: 'ps-recon',
      label: 'Scan intent',
      phaseId: 'investigation',
      itemIds: [101, 102, 103],
    },
  ],
  workItems: [
    phaseGateWork(
      'detected',
      `${PREFIX}-detected-ack`,
      'Acknowledge detection',
      'Confirm the port-scan alert is valid intake for this room.',
      ['Valid — continue', 'False positive', 'Duplicate of existing room'],
    ),
    phaseGateWork(
      'triage',
      `${PREFIX}-triage-sev`,
      'Confirm triage severity',
      'What severity should drive the response for this scan?',
      ['Keep Medium', 'Raise to High', 'Lower to Low'],
    ),
    ...investigationBoard(PREFIX, {
      ownerQ: 'How much disruption is acceptable while tightening DMZ allow-lists?',
      adminQ: 'Which edge control should Network Ops apply first?',
      investigatorQ: 'Summarize scan pattern and any follow-on probes.',
      responderQ: 'Which DMZ services were touched by the scanner?',
      ownerOpts: ['Up to 15 minutes', 'No interruption', 'Change window required'],
      adminOpts: ['Geo / ASN block', 'Source IP deny', 'Rate-limit only'],
      responderOpts: ['SSH (22)', 'HTTPS (443)', 'RDP (3389)', 'Alt-HTTP (8080)'],
    }),
    ...laterPhaseGates(PREFIX),
  ],
  evidence: [],
  history: [
    {
      time: '08:14',
      actor: 'System',
      action: 'Incident synchronized from Firewall · PORTSCAN-8841',
      highlight: true,
    },
    {
      time: '08:15',
      actor: CURRENT_USER.name,
      action: 'opened the room',
      highlight: false,
    },
  ],
  workflowStepStatuses: START_AT_DETECTED_STATUSES,
};
