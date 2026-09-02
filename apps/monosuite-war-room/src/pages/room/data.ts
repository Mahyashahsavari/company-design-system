export type WorkflowStatus = 'completed' | 'current' | 'pending';
export type QuestionStatus = 'open' | 'decision' | 'answered';
export type PresenceStatus = 'online' | 'away';
export type SourceStatus = 'synced' | 'partial' | 'error';
export type AssetSeverity = 'critical' | 'high' | 'medium' | 'low';
export type WorkspaceTab = 'questions' | 'findings' | 'decisions';
export type ContextTab = 'participants' | 'chat' | 'activity';

export interface ContextEntityField {
  label: string;
  value: string;
  /** Secondary fields render behind progressive disclosure. */
  priority?: 'critical' | 'secondary';
  /** Force monospace even when the label is not a known technical key. */
  technical?: boolean;
}

export type ThreatEntityKind = 'attacker' | 'victim';
export type ThreatIdentifierType = 'ip' | 'fqdn' | 'host' | 'account' | 'other';

export interface ThreatEntity {
  id: string;
  identifier: string;
  identifierType: ThreatIdentifierType;
  /** Extra identity line (hostname, account) — omitted when empty. */
  secondaryIdentifier?: string;
  fields: ContextEntityField[];
  sourceId: string;
}

export const IDENTIFIER_TYPE_LABEL: Record<ThreatIdentifierType, string> = {
  ip: 'IP',
  fqdn: 'FQDN',
  host: 'Host',
  account: 'Account',
  other: 'ID',
};

export function isTechnicalField(field: ContextEntityField): boolean {
  if (field.technical != null) return field.technical;
  return /ip|ioc|host|fqdn|hash|account|workstation|\bid\b/i.test(field.label);
}

export function entityFields(entity: ThreatEntity): ContextEntityField[] {
  return entity.fields.filter((field) => field.value.trim().length > 0);
}

export function splitEntityFields(entity: ThreatEntity): {
  critical: ContextEntityField[];
  secondary: ContextEntityField[];
} {
  const fields = entityFields(entity);
  return {
    critical: fields.filter((field) => field.priority !== 'secondary'),
    secondary: fields.filter((field) => field.priority === 'secondary'),
  };
}

export function getThreatEntity(entities: ThreatEntity[], id: string): ThreatEntity {
  return entities.find((entity) => entity.id === id) ?? entities[0];
}

export interface ChatMessage {
  id: string;
  author: string;
  time: string;
  text: string;
  edited?: boolean;
}

export type EvidenceKind = 'file' | 'link' | 'note';

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  name: string;
  type: string;
  by: string;
  time: string;
  sizeBytes?: number;
  url?: string;
  note?: string;
}

export type EvidenceDraft =
  | { kind: 'file'; name: string; type: string; sizeBytes: number }
  | { kind: 'link'; name: string; url: string }
  | { kind: 'note'; name: string; note: string };

export function evidenceFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.trim().toUpperCase();
  if (!extension || extension === fileName.trim().toUpperCase()) return 'FILE';
  return extension;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function hostnameFromUrl(value: string): string {
  try {
    return new URL(value.trim()).hostname.replace(/^www\./, '');
  } catch {
    return value.trim();
  }
}

export interface LivePerson {
  id: string;
  name: string;
  initials: string;
  /** Remote participant camera — independent of the local user's Camera control. */
  camera: boolean;
  color: string;
  /** Local self tile; local camera is driven by MediaState.camera instead. */
  isLocal?: boolean;
}
export type ConnectionState = 'idle' | 'connected' | 'poor' | 'reconnecting' | 'lost';
export type ShareLayout = 'split' | 'room' | 'full' | 'minimized';

export type PinTarget = { kind: 'participant'; id: string } | { kind: 'share' };
export type MediaPermission = 'granted' | 'denied' | 'unavailable';
export type LocalMicState =
  | 'on'
  | 'off'
  | 'muted-by-moderator'
  | 'permission-denied'
  | 'connecting';
export type LocalCameraState = 'on' | 'off' | 'permission-denied' | 'connecting';
export type LocalSpeakerState = 'on' | 'off' | 'unavailable';
export type LocalShareState =
  | 'available'
  | 'sharing'
  | 'remote-sharing'
  | 'permission-denied';

export interface WorkflowStep {
  id: string;
  label: string;
  status: WorkflowStatus;
  owner: string;
  time: string;
  icon: 'bell' | 'filter' | 'search' | 'shield' | 'heartbeat';
  /** NIST / playbook phase — color encodes lifecycle, not progress. */
  phase: WorkflowPhase;
}

/** Product mapping of NIST SP 800-61 r2 lifecycle phases onto the theme palette. */
export type WorkflowPhaseColor = 'accent' | 'warning' | 'brand' | 'danger' | 'success';

export interface WorkflowPhase {
  id: string;
  /** Official lifecycle grouping (e.g. Detection & Analysis). */
  label: string;
  /** Stage name inside that grouping. */
  stage: string;
  color: WorkflowPhaseColor;
}

export interface Answer {
  id: string;
  author: string;
  text: string;
  edited?: boolean;
}

export interface DecisionRecord {
  choice: string;
  by: string;
  at: string;
}

export interface Question {
  id: number;
  text: string;
  status: QuestionStatus;
  answerCount: number;
  participantCount: number;
  answers?: Answer[];
  discussion?: Answer[];
  decision?: DecisionRecord | null;
  options?: string[];
}

export interface HistoryEntry {
  time: string;
  actor: string;
  action: string;
  highlight: boolean;
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: PresenceStatus;
  color: string;
  typing?: boolean;
  /** Remote mic — independent of local MediaState.mic */
  mic: boolean;
  /** Remote camera — independent of local MediaState.camera */
  camera: boolean;
  speaking?: boolean;
  /** Soft-removed from the live roster (mock). */
  removed?: boolean;
  email?: string;
  guest?: boolean;
}

export type RoomRole = 'Commander' | 'Responder' | 'Viewer' | 'Guest';

export const ROOM_ROLES: { value: RoomRole; label: string; description: string }[] = [
  {
    value: 'Commander',
    label: 'Commander',
    description: 'Leads the response and can manage the room.',
  },
  {
    value: 'Responder',
    label: 'Responder',
    description: 'Investigates, answers, and records decisions.',
  },
  {
    value: 'Viewer',
    label: 'Viewer',
    description: 'Follows the incident with limited actions.',
  },
  {
    value: 'Guest',
    label: 'Guest',
    description: 'View only. Cannot take response actions.',
  },
];

export const INVITE_ROLE_OPTIONS = ROOM_ROLES.map((role) => ({
  value: role.value,
  label: role.label,
}));

export interface MemberInvite {
  userId: string;
  role: RoomRole;
}

export interface ExternalGuestInvite {
  firstName: string;
  lastName: string;
  email: string;
}

export function initialsFromParts(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || 'G';
}

export function isValidInviteEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  department: string;
}

export const PARTICIPANT_COLOR_CYCLE = ['teal', 'accent', 'warning', 'brand', 'danger', 'neutral'] as const;

export interface SourceField {
  label: string;
  value: string;
}

export interface ConnectedSource {
  id: string;
  adapter: string;
  role: string;
  dataType: string;
  status: SourceStatus;
  lastSync: string;
  fields: SourceField[];
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  ip: string;
  severity: AssetSeverity;
  icon: 'server' | 'database' | 'desktop';
  owner: string;
  admin: string;
  source: string;
}

export interface MitreTechnique {
  label: string;
  subtechniques: Record<string, string>;
}

export interface MitreTactic {
  techniques: Record<string, MitreTechnique>;
}

export const INCIDENT = {
  id: 'INC-20481',
  title: 'Suspicious lateral movement detected',
  severity: 'Critical' as const,
  status: 'Active' as const,
  scenario: 'Lateral Movement',
  killChain: 'Cyber Attack Kill Chain',
  mitre: 'Credential Access → Valid Accounts',
  mitreId: 'T1078',
  mitreTactic: 'Credential Access',
  mitreTechnique: 'Valid Accounts',
  threatActor: 'FIN7',
  owner: 'Sarah Johnson',
  occurred: '21:42',
  detected: '21:47',
  source: 'Splunk',
  /** Adapter-sourced incidents lock mapped fields; addresses and attacker fields stay additive. */
  fromAdapter: true,
};

export interface LinkedAlertEntry {
  id: string;
  value: string;
  fromAdapter: boolean;
}

export interface LinkedIncidentAlert {
  id: string;
  source: string;
  alerts: LinkedAlertEntry[];
}

export const MANUAL_LINK_SOURCE = 'Manually';

export const LINKED_INCIDENT_ALERTS: LinkedIncidentAlert[] = [
  {
    id: 'link-splunk',
    source: 'Splunk',
    alerts: [
      { id: 'splunk-auto-1', value: 'Alert ID-1120', fromAdapter: true },
      { id: 'splunk-auto-2', value: 'Alert ID-1184', fromAdapter: true },
    ],
  },
  {
    id: 'link-monosuite',
    source: 'MonoSuite',
    alerts: [{ id: 'ms-auto-1', value: 'AssetID-1020', fromAdapter: true }],
  },
];

export const LINK_SOURCE_OPTIONS = [
  'Splunk',
  'MonoSuite',
  'Threat Intelligence',
  MANUAL_LINK_SOURCE,
];

export const ROOM_SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const;
export type RoomSeverity = (typeof ROOM_SEVERITY_OPTIONS)[number];

/** Incident severity → Mantine semantic colour. High is warning so it does not collide with Critical. */
export const ROOM_SEVERITY_COLOR: Record<RoomSeverity, 'danger' | 'warning' | 'accent' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'accent',
  Low: 'neutral',
};

export const ROOM_WORKFLOW_OPTIONS = [
  { value: 'nist-800-61', label: 'NIST SP 800-61' },
  { value: 'nic800', label: 'NIC800' },
] as const;

export const ROOM_TAG_SUGGESTIONS = [
  'Lateral Movement',
  'FIN7',
  'Credential Access',
  'C2',
  'Containment',
];

export interface RoomSettingsDraft {
  title: string;
  description: string;
  severity: RoomSeverity;
  workflow: string;
  tags: string[];
  incidentReferences: string[];
  attackerReferences: string[];
  victimReferences: string[];
}

export const DEFAULT_ROOM_SETTINGS: RoomSettingsDraft = {
  title: INCIDENT.title,
  description:
    'Suspicious authentication burst from 185.23.45.10 against workstation-114. Room opened to coordinate investigation and containment.',
  severity: INCIDENT.severity,
  workflow: 'nist-800-61',
  tags: ['Lateral Movement', 'FIN7'],
  incidentReferences: [],
  attackerReferences: [],
  victimReferences: [],
};

export { CURRENT_USER } from '../../shared/constants';

export const ROOM_START_MINUTES = 12;

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'detected',
    label: 'Incident Detected',
    status: 'completed',
    owner: 'Splunk',
    time: '21:47',
    icon: 'bell',
    phase: {
      id: 'detection-analysis',
      label: 'Detection & Analysis',
      stage: 'Detection',
      color: 'warning',
    },
  },
  {
    id: 'triage',
    label: 'Triage',
    status: 'completed',
    owner: 'Sarah Johnson',
    time: '21:50',
    icon: 'filter',
    phase: {
      id: 'detection-analysis',
      label: 'Detection & Analysis',
      stage: 'Triage',
      color: 'accent',
    },
  },
  {
    id: 'investigation',
    label: 'Investigation',
    status: 'current',
    owner: 'Mike Chen',
    time: '21:55',
    icon: 'search',
    phase: {
      id: 'detection-analysis',
      label: 'Detection & Analysis',
      stage: 'Analysis',
      color: 'brand',
    },
  },
  {
    id: 'containment',
    label: 'Containment',
    status: 'pending',
    owner: '—',
    time: '—',
    icon: 'shield',
    phase: {
      id: 'containment-recovery',
      label: 'Containment, Eradication & Recovery',
      stage: 'Containment',
      color: 'danger',
    },
  },
  {
    id: 'recovery',
    label: 'Recovery',
    status: 'pending',
    owner: '—',
    time: '—',
    icon: 'heartbeat',
    phase: {
      id: 'containment-recovery',
      label: 'Containment, Eradication & Recovery',
      stage: 'Recovery',
      color: 'success',
    },
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'What is the initial attack vector?',
    status: 'open',
    answerCount: 3,
    participantCount: 2,
    answers: [
      {
        id: 'a1-sarah',
        author: 'Sarah Johnson',
        text: 'The first suspicious authentication was detected from 185.23.45.10.',
      },
      {
        id: 'a1-mike',
        author: 'Mike Chen',
        text: 'This IP has been associated with attacker infrastructure in previous incidents.',
      },
      {
        id: 'a1-hs',
        author: 'Harriette Spoonlicker',
        text: 'Need a containment decision after we confirm C2 on the finance VLAN.',
      },
    ],
    discussion: [
      {
        id: 'd1-sarah',
        author: 'Sarah Johnson',
        text: 'Need to correlate with firewall logs from the DMZ segment.',
      },
      {
        id: 'd1-alex',
        author: 'Alex Smith',
        text: 'Checking Threat Intelligence feed for 185.23.45.10 now.',
      },
      {
        id: 'd1-hs',
        author: 'Harriette Spoonlicker',
        text: 'Keep the DMZ slice attached to this thread when it lands.',
      },
    ],
  },
  {
    id: 4,
    text: 'Which hosts show lateral movement after the auth burst?',
    status: 'open',
    answerCount: 1,
    participantCount: 3,
    answers: [
      {
        id: 'a4-alex',
        author: 'Alex Smith',
        text: 'srv-prod-01 shows PowerShell spawn 4 minutes after workstation-114 auth.',
      },
    ],
    discussion: [
      {
        id: 'd4-mike',
        author: 'Mike Chen',
        text: 'Need EDR process tree before we contain.',
      },
    ],
  },
  {
    id: 5,
    text: 'Is outbound C2 still active from the victim segment?',
    status: 'open',
    answerCount: 0,
    participantCount: 2,
    discussion: [
      {
        id: 'd5-david',
        author: 'David Lee',
        text: 'Firewall slice still loading — hold containment until confirmed.',
      },
    ],
  },
  {
    id: 2,
    text: 'Should the affected account be disabled?',
    status: 'decision',
    answerCount: 0,
    participantCount: 3,
    decision: null,
    options: ['Disable account', 'Keep account active', 'Investigate further'],
  },
  {
    id: 6,
    text: 'Isolate workstation-114 from the finance VLAN?',
    status: 'decision',
    answerCount: 1,
    participantCount: 2,
    answers: [
      {
        id: 'a6-sarah',
        author: 'Sarah Johnson',
        text: 'Prefer staged isolation after confirming no backup jobs mid-run.',
      },
    ],
    decision: {
      choice: 'Isolate after backup window',
      by: 'Sarah Johnson',
      at: '12:51',
    },
    options: ['Isolate now', 'Isolate after backup window', 'Monitor only'],
  },
  {
    id: 3,
    text: 'Is the attacker infrastructure known?',
    status: 'answered',
    answerCount: 2,
    participantCount: 2,
    answers: [
      {
        id: 'a3-mike',
        author: 'Mike Chen',
        text: '185.23.45.10 matches IOC-8842 in Threat Intelligence — linked to FIN7 activity.',
      },
      {
        id: 'a3-david',
        author: 'David Lee',
        text: 'Confirmed via VirusTotal and internal TI platform. High confidence match.',
      },
    ],
  },
];

export const INITIAL_HISTORY: HistoryEntry[] = [
  { time: '12:54', actor: 'David Lee', action: 'joined the room', highlight: false },
  { time: '12:52', actor: 'System', action: 'Workflow step changed → Investigate', highlight: false },
  { time: '12:51', actor: 'Sarah Johnson', action: 'Decision recorded', highlight: true },
  { time: '12:49', actor: 'Mike Chen', action: 'Finding created', highlight: true },
  { time: '12:48', actor: 'Alex Smith', action: 'Evidence added', highlight: false },
  { time: '12:46', actor: 'Mike Chen', action: 'MITRE mapping updated', highlight: false },
  { time: '12:44', actor: 'System', action: 'Incident synchronized from Splunk', highlight: false },
  { time: '12:42', actor: 'Sarah Johnson', action: 'joined the room', highlight: false },
];

export const PARTICIPANTS: Participant[] = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    initials: 'SJ',
    role: 'Commander',
    status: 'online',
    color: 'teal',
    typing: true,
    mic: true,
    camera: true,
    speaking: true,
    email: 'sarah.johnson@corp.local',
  },
  {
    id: 'mike',
    name: 'Mike Chen',
    initials: 'MC',
    role: 'Responder',
    status: 'online',
    color: 'accent',
    mic: true,
    camera: true,
    email: 'mike.chen@corp.local',
  },
  {
    id: 'alex',
    name: 'Alex Smith',
    initials: 'AS',
    role: 'Responder',
    status: 'away',
    color: 'warning',
    mic: true,
    camera: true,
    email: 'alex.smith@corp.local',
  },
  {
    id: 'david',
    name: 'David Lee',
    initials: 'DL',
    role: 'Viewer',
    status: 'online',
    color: 'neutral',
    mic: false,
    camera: false,
    email: 'david.lee@corp.local',
  },
];

/** Organization directory used when inviting people who are not yet in the room. */
export const DIRECTORY_USERS: DirectoryUser[] = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@corp.local',
    initials: 'SJ',
    department: 'SOC',
  },
  {
    id: 'mike',
    name: 'Mike Chen',
    email: 'mike.chen@corp.local',
    initials: 'MC',
    department: 'Threat Intel',
  },
  {
    id: 'alex',
    name: 'Alex Smith',
    email: 'alex.smith@corp.local',
    initials: 'AS',
    department: 'Incident Response',
  },
  {
    id: 'david',
    name: 'David Lee',
    email: 'david.lee@corp.local',
    initials: 'DL',
    department: 'SOC',
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    email: 'priya.nair@corp.local',
    initials: 'PN',
    department: 'SOC',
  },
  {
    id: 'james',
    name: 'James Okonkwo',
    email: 'james.okonkwo@corp.local',
    initials: 'JO',
    department: 'Incident Response',
  },
  {
    id: 'lena',
    name: 'Lena Hofmann',
    email: 'lena.hofmann@corp.local',
    initials: 'LH',
    department: 'Legal',
  },
  {
    id: 'omar',
    name: 'Omar Haddad',
    email: 'omar.haddad@corp.local',
    initials: 'OH',
    department: 'CISO office',
  },
  {
    id: 'nina',
    name: 'Nina Petrova',
    email: 'nina.petrova@corp.local',
    initials: 'NP',
    department: 'Forensics',
  },
];

export const CONNECTED_SOURCES: ConnectedSource[] = [
  {
    id: 'splunk',
    adapter: 'Splunk',
    role: 'Alert Source',
    dataType: 'Alert',
    status: 'synced',
    lastSync: '12:44',
    fields: [
      { label: 'Alert ID', value: 'CL-8847291' },
      { label: 'Rule', value: 'Lateral Movement — Suspicious Auth' },
      { label: 'Severity', value: 'Critical' },
      { label: 'Source IP', value: '185.23.45.10' },
      { label: 'Destination Host', value: 'srv-prod-01' },
      { label: 'Event Count', value: '47 events' },
      { label: 'First Seen', value: '21:42 UTC' },
    ],
  },
  {
    id: 'ad',
    adapter: 'Active Directory',
    role: 'Victim User Source',
    dataType: 'Victim User',
    status: 'synced',
    lastSync: '12:43',
    fields: [
      { label: 'Account', value: 'jsmith@corp.local' },
      { label: 'Display Name', value: 'John Smith' },
      { label: 'Department', value: 'Finance' },
      { label: 'Last Logon', value: '21:38 UTC' },
      { label: 'Workstation', value: 'workstation-114' },
      { label: 'Privileged', value: 'No' },
      { label: 'Account Status', value: 'Enabled' },
    ],
  },
  {
    id: 'ti',
    adapter: 'Threat Intelligence',
    role: 'Attacker Source',
    dataType: 'Attacker',
    status: 'partial',
    lastSync: '12:46',
    fields: [
      { label: 'Attacker IP', value: '185.23.45.10' },
      { label: 'Threat Actor', value: 'FIN7 (medium confidence)' },
      { label: 'IOC Match', value: 'IOC-8842' },
      { label: 'Category', value: 'C2 Infrastructure' },
      { label: 'First Reported', value: '2026-03-12' },
      { label: 'Reputation Score', value: '92 / 100' },
      { label: 'Related Campaigns', value: 'Unavailable — partial sync' },
    ],
  },
];

export const ATTACKER_ENTITIES: ThreatEntity[] = [
  {
    id: 'att-185',
    identifier: '185.23.45.10',
    identifierType: 'ip',
    fields: [
      { label: 'Threat Actor', value: 'FIN7' },
      { label: 'Confidence', value: 'Medium' },
      { label: 'IOC Match', value: 'IOC-8842', technical: true },
      { label: 'Category', value: 'C2 Infrastructure' },
      { label: 'Reputation', value: '92 / 100' },
      { label: 'First Seen', value: '2026-03-12', priority: 'secondary', technical: true },
      { label: 'Last Seen', value: '21:42', priority: 'secondary', technical: true },
    ],
    sourceId: 'ti',
  },
  {
    id: 'att-fqdn',
    identifier: 'cdn-east.malicious.net',
    identifierType: 'fqdn',
    fields: [
      { label: 'Threat Actor', value: 'Unknown' },
      { label: 'Category', value: 'Phishing kit' },
      { label: 'Last Seen', value: '21:38', technical: true },
    ],
    sourceId: 'ti',
  },
  {
    id: 'att-91',
    identifier: '91.109.18.44',
    identifierType: 'ip',
    fields: [
      { label: 'IOC Match', value: 'IOC-9102', technical: true },
      { label: 'Category', value: 'Scanner' },
      { label: 'Reputation', value: '71 / 100' },
      { label: 'First Seen', value: '21:11', priority: 'secondary', technical: true },
    ],
    sourceId: 'ti',
  },
];

export const VICTIM_ENTITIES: ThreatEntity[] = [
  {
    id: 'vic-114',
    identifier: '10.20.4.114',
    identifierType: 'ip',
    secondaryIdentifier: 'workstation-114',
    fields: [
      { label: 'Account', value: 'jsmith@corp.local' },
      { label: 'Display Name', value: 'John Smith' },
      { label: 'Account Status', value: 'Enabled' },
      { label: 'Department', value: 'Finance', priority: 'secondary' },
      { label: 'Workstation', value: 'workstation-114', priority: 'secondary', technical: true },
      { label: 'Last Seen', value: '21:38', priority: 'secondary', technical: true },
    ],
    sourceId: 'ad',
  },
  {
    id: 'vic-srv',
    identifier: 'srv-prod-01',
    identifierType: 'host',
    secondaryIdentifier: '10.20.1.15',
    fields: [
      { label: 'Account', value: 'svc-sql@corp.local' },
      { label: 'Account Status', value: 'Enabled' },
      { label: 'Department', value: 'Engineering', priority: 'secondary' },
      { label: 'Last Seen', value: '21:40', priority: 'secondary', technical: true },
    ],
    sourceId: 'ad',
  },
];

export const ATTACKER_CONTEXT = ATTACKER_ENTITIES[0];
export const VICTIM_CONTEXT = VICTIM_ENTITIES[0];

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'c1',
    author: 'Sarah Johnson',
    time: '12:45',
    text: 'Focus on 185.23.45.10 auth burst first.',
  },
  {
    id: 'c2',
    author: 'Mike Chen',
    time: '12:47',
    text: 'TI partial sync — IOC-8842 looks solid.',
  },
  {
    id: 'c3',
    author: 'Alex Smith',
    time: '12:50',
    text: 'Pulling DMZ firewall slice now.',
  },
  {
    id: 'c4',
    author: 'You',
    time: '12:52',
    text: 'I will post the containment window after the backup check.',
  },
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'e1',
    kind: 'file',
    name: 'auth-burst-export.json',
    type: 'JSON',
    sizeBytes: 184_320,
    by: 'Mike Chen',
    time: '12:48',
  },
  {
    id: 'e2',
    kind: 'file',
    name: 'splunk-alert-SPL-8847291.png',
    type: 'PNG',
    sizeBytes: 1_048_576,
    by: 'Sarah Johnson',
    time: '12:49',
  },
  {
    id: 'e3',
    kind: 'link',
    name: 'VirusTotal · 185.23.45.10',
    type: 'LINK',
    url: 'https://www.virustotal.com/gui/ip-address/185.23.45.10',
    by: 'Mike Chen',
    time: '12:50',
  },
  {
    id: 'e4',
    kind: 'file',
    name: 'firewall-dmz-slice.log',
    type: 'LOG',
    sizeBytes: 2_621_440,
    by: 'Alex Smith',
    time: '12:51',
  },
  {
    id: 'e5',
    kind: 'note',
    name: 'Auth burst window',
    type: 'NOTE',
    note: 'Failed logons clustered 21:42–21:47 UTC against svc-backup. Correlate with Splunk alert SPL-8847291 before containment.',
    by: 'Harriette Spoonlicker',
    time: '12:53',
  },
];

export const LIVE_PEOPLE: LivePerson[] = [
  { id: 'sarah', name: 'Sarah Johnson', initials: 'SJ', camera: false, color: 'teal' },
  { id: 'mike', name: 'Mike Chen', initials: 'MC', camera: false, color: 'accent' },
  { id: 'alex', name: 'Alex Smith', initials: 'AS', camera: false, color: 'warning' },
  { id: 'david', name: 'David Lee', initials: 'DL', camera: false, color: 'neutral' },
  { id: 'you', name: 'You', initials: 'HS', camera: false, color: 'brand', isLocal: true },
];

/** Remote participants only — camera flags are independent of local MediaState.camera. */
export function getRemotePeople(people: LivePerson[] = LIVE_PEOPLE): LivePerson[] {
  return people.filter((p) => !p.isLocal);
}

export function getRemoteCamerasOn(people: LivePerson[] = LIVE_PEOPLE): LivePerson[] {
  return getRemotePeople(people).filter((p) => p.camera);
}

export const ASSETS: Asset[] = [
  {
    id: 'srv-prod-01',
    name: 'srv-prod-01',
    type: 'Windows Server',
    ip: '10.20.1.15',
    severity: 'critical',
    icon: 'server',
    owner: 'Finance Operations',
    admin: 'Mike Chen',
    source: 'MonoSuite',
  },
  {
    id: 'db-prod-02',
    name: 'db-prod-02',
    type: 'Database Server',
    ip: '10.20.1.20',
    severity: 'high',
    icon: 'database',
    owner: 'Finance Operations',
    admin: 'David Lee',
    source: 'MonoSuite',
  },
  {
    id: 'workstation-114',
    name: 'workstation-114',
    type: 'Windows Workstation',
    ip: '10.20.4.114',
    severity: 'medium',
    icon: 'desktop',
    owner: 'Sarah Johnson',
    admin: 'Endpoint Operations',
    source: 'Manual',
  },
];

export const MITRE_MAP: Record<string, MitreTactic> = {
  'credential-access': {
    techniques: {
      'valid-accounts': {
        label: 'Valid Accounts (T1078)',
        subtechniques: {
          'cloud-accounts': 'Cloud Accounts (T1078.004)',
          'domain-accounts': 'Domain Accounts (T1078.002)',
        },
      },
      'brute-force': {
        label: 'Brute Force (T1110)',
        subtechniques: {
          'password-guessing': 'Password Guessing (T1110.001)',
        },
      },
    },
  },
  'initial-access': {
    techniques: {
      phishing: {
        label: 'Phishing (T1566)',
        subtechniques: {
          spearphishing: 'Spearphishing Attachment (T1566.001)',
        },
      },
    },
  },
  'lateral-movement': {
    techniques: {
      'remote-services': {
        label: 'Remote Services (T1021)',
        subtechniques: {
          rdp: 'Remote Desktop Protocol (T1021.001)',
        },
      },
    },
  },
};

export const PRESSURE_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export const KILL_CHAIN_OPTIONS = [
  'Cyber Attack Kill Chain',
  'Lateral Movement',
  'Data Exfiltration',
];

export const CUSTOM_FIELD_KEYS = [
  { value: 'threat_actor', label: 'Threat Actor' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'ioc_match', label: 'IOC Match' },
  { value: 'category', label: 'Category' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'first_seen', label: 'First Seen' },
  { value: 'last_seen', label: 'Last Seen' },
  { value: 'account', label: 'Account' },
  { value: 'display_name', label: 'Display Name' },
  { value: 'account_status', label: 'Account Status' },
  { value: 'department', label: 'Department' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'hostname', label: 'Hostname' },
  { value: 'notes', label: 'Notes' },
];

export const CUSTOM_FIELD_VALUE_TYPES = ['String', 'IP', 'Number'];

export const CONNECTION_CYCLE: ConnectionState[] = [
  'connected',
  'poor',
  'reconnecting',
  'lost',
];

export const CONNECTION_UI: Record<
  Exclude<ConnectionState, 'idle'>,
  { label: string; detail: string }
> = {
  connected: {
    label: 'Connected',
    detail: 'Live communication is stable.',
  },
  poor: {
    label: 'Poor connection',
    detail: 'Connection is unstable. Media controls remain available.',
  },
  reconnecting: {
    label: 'Reconnecting...',
    detail: 'Trying to restore live communication.',
  },
  lost: {
    label: 'Connection lost',
    detail: 'Live communication is unavailable. Retry to reconnect.',
  },
};

export const SEVERITY_COLOR: Record<AssetSeverity, string> = {
  critical: 'danger',
  high: 'warning',
  medium: 'accent',
  low: 'neutral',
};

export const SOURCE_STATUS_COLOR: Record<SourceStatus, string> = {
  synced: 'success',
  partial: 'warning',
  error: 'danger',
};

export const AVATAR_COLORS: Record<string, string> = {
  SJ: 'teal',
  MC: 'accent',
  AS: 'warning',
  DL: 'neutral',
  HS: 'brand',
};

export function getQuestionsForTab(questions: Question[], tab: WorkspaceTab): Question[] {
  if (tab === 'questions') {
    return questions.filter((q) => q.status === 'open');
  }
  if (tab === 'decisions') {
    return questions.filter((q) => q.status === 'decision' || q.decision);
  }
  if (tab === 'findings') {
    return questions.filter((q) => q.status === 'answered' && !q.decision);
  }
  return questions;
}

export function formatRoomDuration(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatRoomDurationShort(elapsedMs: number): string {
  const m = Math.max(0, Math.floor(elapsedMs / 60000));
  return `${m}m`;
}
