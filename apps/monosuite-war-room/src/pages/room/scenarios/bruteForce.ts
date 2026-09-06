import type { RoomScenarioPack } from './types';
import { START_AT_DETECTED_STATUSES } from './types';
import {
  investigationBoard,
  lessonsLearnedBoard,
  responseActionBoard,
  SCENARIO_COMMANDER_ID,
  SCENARIO_PARTICIPANTS,
  triageSeverityCheck,
} from './shared';
import { CURRENT_USER } from '../../../shared/constants';

const PREFIX = 'bf';

export const bruteForceScenario: RoomScenarioPack = {
  id: 'room-brute-force',
  listMeta: {
    id: 'room-brute-force',
    incidentId: 'INC-BF-3003',
    title: 'Brute-force success against VPN account',
    status: 'live',
    phase: 'Detected',
    commander: CURRENT_USER.name,
    participantCount: SCENARIO_PARTICIPANTS.length + 1,
    updatedLabel: '8 min ago',
  },
  incident: {
    id: 'INC-BF-3003',
    title: 'Brute-force success against VPN account',
    severity: 'High',
    status: 'Active',
    scenario: 'Brute Force Success',
    killChain: 'Cyber Attack Kill Chain',
    mitre: 'Credential Access → Brute Force',
    mitreId: 'T1110',
    mitreTactic: 'Credential Access',
    mitreTechnique: 'Brute Force',
    threatActor: 'Unknown',
    owner: CURRENT_USER.name,
    occurred: '19:03',
    detected: '19:06',
    source: 'Identity',
    fromAdapter: true,
  },
  roomSettings: {
    title: 'Brute-force success against VPN account',
    description:
      'Identity provider recorded 140 failed VPN attempts for j.martinez followed by a successful login from 198.51.100.77. Room opened to lock the account, validate session risk, and check lateral use of the credential.',
    workflow: 'nist-800-61',
    tags: ['Brute Force', 'VPN', 'Credential Access', 'Identity'],
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
      id: 'bf-attacker-1',
      identifier: '198.51.100.77',
      identifierType: 'ip',
      secondaryIdentifier: 'Successful auth source',
      fields: [
        { label: 'Attempts', value: '140 failed · 1 success', priority: 'critical' },
        { label: 'Geo', value: 'US · Ashburn', priority: 'secondary' },
        { label: 'UA', value: 'OpenVPN client', priority: 'secondary' },
      ],
      sourceId: 'src-idp',
    },
  ],
  victimEntities: [
    {
      id: 'bf-victim-1',
      identifier: 'j.martinez',
      identifierType: 'account',
      secondaryIdentifier: 'VPN user',
      fields: [
        { label: 'Dept', value: 'Finance Ops', priority: 'critical' },
        { label: 'MFA', value: 'Enabled · push', priority: 'critical' },
        { label: 'Last success', value: '19:05:41', priority: 'critical' },
      ],
      sourceId: 'src-idp',
    },
  ],
  linkedAlerts: [
    {
      id: 'bf-link-idp',
      source: 'Identity',
      alerts: [
        { id: 'bf-a1', value: 'BF-SUCCESS-9910', fromAdapter: true },
        { id: 'bf-a2', value: 'VPN-LOGIN-9910', fromAdapter: true },
      ],
    },
  ],
  questions: [
    {
      id: 301,
      text: 'Did MFA challenge succeed for the successful VPN login?',
      status: 'open',
      answerCount: 0,
      participantCount: 3,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 302,
      text: 'Has j.martinez been used on any internal systems after VPN success?',
      status: 'open',
      answerCount: 0,
      participantCount: 2,
      assigneeRole: 'investigator',
      roleLabel: 'Investigator',
    },
    {
      id: 303,
      text: 'Disable the affected VPN account immediately?',
      status: 'decision',
      answerCount: 0,
      participantCount: 3,
      decision: null,
      options: ['Disable account', 'Force password reset + MFA re-enroll', 'Monitor only'],
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
      id: 'bf-containment',
      label: 'Account & MFA decision',
      phaseId: 'containment',
      itemIds: [301, 302, 303],
    },
  ],
  workItems: [
    triageSeverityCheck(PREFIX, 'High severity is on the incident after successful auth. Confirm operating severity.', [
      'Keep High',
      'Raise to Critical',
      'Lower to Medium',
      'Ask Commander to review',
    ]),
    ...investigationBoard(PREFIX, {
      reportQ:
        'Document brute-force success, MFA outcome, and post-login activity for j.martinez. Share the investigation report.',
    }),
    ...responseActionBoard('containment', PREFIX, {
      proposeQ:
        'Based on successful brute-force (credential access), which containment options should Owner consider?',
      proposeOpts: [
        'Disable j.martinez account',
        'Revoke active VPN / SSO sessions',
        'Block source IP at edge',
        'Force MFA re-enrollment',
        'Reset password / rotate tokens',
      ],
    }),
    ...responseActionBoard('eradication', PREFIX, {
      proposeTitle: 'Propose eradication options',
      proposeQ: 'Which eradication options remove residual access after containment?',
      proposeOpts: [
        'Invalidate refresh tokens / API keys',
        'Remove attacker mailbox rules',
        'Clear rogue MFA devices',
        'Audit privileged group membership',
        'Hunt for secondary accounts',
      ],
    }),
    ...responseActionBoard('recovery', PREFIX, {
      proposeTitle: 'Propose recovery options',
      proposeQ: 'Which recovery options restore legitimate access safely?',
      proposeOpts: [
        'Re-enable account after MFA proof',
        'Restore VPN access with monitoring',
        'Confirm SSO conditional access',
        'User re-onboarding checklist',
        'Notify manager / HR as needed',
      ],
    }),
    ...lessonsLearnedBoard(PREFIX, {
      summaryQ: 'What did the team learn from this successful brute-force incident?',
      rulesQ: 'Which follow-up rules should reduce recurrence?',
      rulesOpts: [
        'Tighten lockout / rate-limit policy',
        'Require MFA on all remote auth',
        'Tune identity brute-force detections',
        'Update credential-access playbook',
        'Block known bad auth ASNs',
      ],
    }),
  ],
  evidence: [],
  history: [
    {
      time: '19:06',
      actor: 'System',
      action: 'Incident synchronized from Identity · BF-SUCCESS-9910',
      highlight: true,
    },
    {
      time: '19:07',
      actor: CURRENT_USER.name,
      action: 'opened the room',
      highlight: false,
    },
  ],
  workflowStepStatuses: START_AT_DETECTED_STATUSES,
};
