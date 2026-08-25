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
}

export interface HostContext {
  label: string;
  multi: boolean;
  multiLabel: string;
  primary: string;
  hostname?: string;
  fields: ContextEntityField[];
  sourceId: string;
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
  camera: boolean;
  color: string;
}
export type ConnectionState = 'idle' | 'connected' | 'poor' | 'reconnecting' | 'lost';
export type ShareLayout = 'split' | 'room' | 'full' | 'minimized';

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
    id: 2,
    text: 'Should the affected account be disabled?',
    status: 'decision',
    answerCount: 0,
    participantCount: 3,
    decision: null,
    options: ['Disable account', 'Keep account active', 'Investigate further'],
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
  { time: '12:44', actor: 'System', action: 'Incident synced from CoreLog', highlight: false },
  { time: '12:46', actor: 'Mike Chen', action: 'MITRE mapping updated', highlight: false },
  { time: '12:49', actor: 'Mike Chen', action: 'added an answer', highlight: false },
  { time: '12:52', actor: 'Sarah Johnson', action: 'Decision recorded', highlight: true },
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
  },
  {
    id: 'mike',
    name: 'Mike Chen',
    initials: 'MC',
    role: 'Responder',
    status: 'online',
    color: 'accent',
  },
  {
    id: 'alex',
    name: 'Alex Smith',
    initials: 'AS',
    role: 'Responder',
    status: 'away',
    color: 'warning',
  },
  {
    id: 'david',
    name: 'David Lee',
    initials: 'DL',
    role: 'Viewer',
    status: 'online',
    color: 'neutral',
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

export const ATTACKER_CONTEXT: HostContext = {
  label: 'Attacker Host/IP',
  multi: true,
  multiLabel: 'Multi Attacker',
  primary: '185.23.45.10',
  fields: [
    { label: 'Threat Actor', value: 'FIN7 (medium confidence)' },
    { label: 'IOC Match', value: 'IOC-8842' },
    { label: 'Category', value: 'C2 Infrastructure' },
    { label: 'Reputation Score', value: '92 / 100' },
  ],
  sourceId: 'ti',
};

export const VICTIM_CONTEXT: HostContext = {
  label: 'Victim Host/IP',
  multi: true,
  multiLabel: 'Multi Victim',
  primary: '10.20.4.114',
  hostname: 'workstation-114',
  fields: [
    { label: 'Account', value: 'jsmith@corp.local' },
    { label: 'Display Name', value: 'John Smith' },
    { label: 'Department', value: 'Finance' },
    { label: 'Workstation', value: 'workstation-114' },
    { label: 'Account Status', value: 'Enabled' },
  ],
  sourceId: 'ad',
};

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
  { id: 'sarah', name: 'Sarah Johnson', initials: 'SJ', camera: true, color: 'teal' },
  { id: 'mike', name: 'Mike Chen', initials: 'MC', camera: true, color: 'accent' },
  { id: 'alex', name: 'Alex Smith', initials: 'AS', camera: false, color: 'warning' },
  { id: 'you', name: 'You', initials: 'HS', camera: true, color: 'brand' },
];

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
