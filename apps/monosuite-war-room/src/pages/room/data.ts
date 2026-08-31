export type WorkflowStatus = 'completed' | 'current' | 'pending';
export type QuestionStatus = 'open' | 'decision' | 'answered';
export type PresenceStatus = 'online' | 'away';
export type SourceStatus = 'synced' | 'partial' | 'error';
export type AssetSeverity = 'critical' | 'high' | 'medium' | 'low';
export type WorkspaceTab = 'questions' | 'findings' | 'decisions';
export type ContextTab = 'participants' | 'chat' | 'assets' | 'evidence' | 'history';

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
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  by: string;
  time: string;
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
}

export interface Answer {
  author: string;
  text: string;
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
}

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
  mitre: 'Credential Access → Valid Accounts',
  mitreId: 'T1078',
  mitreTactic: 'Credential Access',
  mitreTechnique: 'Valid Accounts',
  threatActor: 'FIN7',
  owner: 'Sarah Johnson',
  occurred: '21:42',
  detected: '21:47',
  source: 'CoreLog',
};

export { CURRENT_USER } from '../../shared/constants';

export const ROOM_START_MINUTES = 12;

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'detected',
    label: 'Incident Detected',
    status: 'completed',
    owner: 'CoreLog',
    time: '21:47',
    icon: 'bell',
  },
  {
    id: 'triage',
    label: 'Triage',
    status: 'completed',
    owner: 'Sarah Johnson',
    time: '21:50',
    icon: 'filter',
  },
  {
    id: 'investigation',
    label: 'Investigation',
    status: 'current',
    owner: 'Mike Chen',
    time: '21:55',
    icon: 'search',
  },
  {
    id: 'containment',
    label: 'Containment',
    status: 'pending',
    owner: '—',
    time: '—',
    icon: 'shield',
  },
  {
    id: 'recovery',
    label: 'Recovery',
    status: 'pending',
    owner: '—',
    time: '—',
    icon: 'heartbeat',
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
        author: 'Sarah Johnson',
        text: 'The first suspicious authentication was detected from 185.23.45.10.',
      },
      {
        author: 'Mike Chen',
        text: 'This IP has been associated with attacker infrastructure in previous incidents.',
      },
    ],
    discussion: [
      {
        author: 'Sarah Johnson',
        text: 'Need to correlate with firewall logs from the DMZ segment.',
      },
      {
        author: 'Alex Smith',
        text: 'Checking Threat Intelligence feed for 185.23.45.10 now.',
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
        author: 'Alex Smith',
        text: 'srv-prod-01 shows PowerShell spawn 4 minutes after workstation-114 auth.',
      },
    ],
    discussion: [
      {
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
        author: 'Mike Chen',
        text: '185.23.45.10 matches IOC-8842 in Threat Intelligence — linked to FIN7 activity.',
      },
      {
        author: 'David Lee',
        text: 'Confirmed via VirusTotal and internal TI platform. High confidence match.',
      },
    ],
  },
];

export const INITIAL_HISTORY: HistoryEntry[] = [
  { time: '12:42', actor: 'Sarah Johnson', action: 'joined the room', highlight: false },
  { time: '12:44', actor: 'System', action: 'Incident synchronized from CoreLog', highlight: false },
  { time: '12:46', actor: 'Mike Chen', action: 'MITRE mapping updated', highlight: false },
  { time: '12:48', actor: 'Alex Smith', action: 'Evidence added', highlight: false },
  { time: '12:49', actor: 'Mike Chen', action: 'Finding created', highlight: true },
  { time: '12:51', actor: 'Sarah Johnson', action: 'Decision recorded', highlight: true },
  { time: '12:52', actor: 'System', action: 'Workflow step changed → Investigate', highlight: false },
  { time: '12:54', actor: 'David Lee', action: 'joined the room', highlight: false },
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
  },
];

export const CONNECTED_SOURCES: ConnectedSource[] = [
  {
    id: 'corelog',
    adapter: 'CoreLog',
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
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'e1',
    name: 'auth-burst-export.json',
    type: 'JSON',
    by: 'Mike Chen',
    time: '12:48',
  },
  {
    id: 'e2',
    name: 'corelog-alert-CL-8847291.png',
    type: 'PNG',
    by: 'Sarah Johnson',
    time: '12:49',
  },
  {
    id: 'e3',
    name: 'firewall-dmz-slice.log',
    type: 'LOG',
    by: 'Alex Smith',
    time: '12:51',
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
  },
  {
    id: 'db-prod-02',
    name: 'db-prod-02',
    type: 'Database Server',
    ip: '10.20.1.20',
    severity: 'high',
    icon: 'database',
  },
  {
    id: 'workstation-114',
    name: 'workstation-114',
    type: 'Windows Workstation',
    ip: '10.20.4.114',
    severity: 'medium',
    icon: 'desktop',
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
