import type { WorkflowStep } from '../../data';

export type WorkflowWorkRole = 'owner' | 'admin' | 'investigator' | 'generated';
export type WorkflowWorkAnswerType = 'select' | 'textarea' | 'generated';

export interface WorkflowWorkItem {
  id: string;
  /** Matches `WorkflowStep.id` of the parent phase. */
  phaseId: string;
  title: string;
  role: WorkflowWorkRole;
  roleLabel: string;
  required: boolean;
  question: string;
  answerType: WorkflowWorkAnswerType;
  answerLabel?: string;
  options?: string[];
  /** Work item ids that must be answered first. */
  dependsOn?: string[];
  meta: string;
}

/** Prototype work graph for the Investigation → Containment path (NIST-style rooms). */
export const WORKFLOW_CANVAS_WORK: WorkflowWorkItem[] = [
  {
    id: 'owner-impact',
    phaseId: 'investigation',
    title: 'Confirm business impact',
    role: 'owner',
    roleLabel: 'Asset Owner',
    required: true,
    question:
      'How much service interruption can the business accept while workstation-114 is isolated?',
    answerType: 'select',
    answerLabel: 'Approved interruption window',
    options: [
      'Up to 30 minutes',
      'No interruption approved',
      'Business approval is still required',
    ],
    meta: 'Required · Q-03',
  },
  {
    id: 'admin-isolation',
    phaseId: 'investigation',
    title: 'Select isolation method',
    role: 'admin',
    roleLabel: 'Asset Admin',
    required: true,
    question: 'Which containment method can be applied within the approved interruption window?',
    answerType: 'select',
    answerLabel: 'Isolation method',
    options: ['EDR network isolation', 'Switch port shutdown', 'Firewall containment rule'],
    dependsOn: ['owner-impact'],
    meta: 'After Asset Owner response',
  },
  {
    id: 'investigator-c2',
    phaseId: 'investigation',
    title: 'Validate active C2',
    role: 'investigator',
    roleLabel: 'Investigator',
    required: false,
    question: 'Is outbound command-and-control traffic still active from the affected segment?',
    answerType: 'textarea',
    answerLabel: 'Investigation note',
    meta: 'Optional · Q-04',
  },
  {
    id: 'generated-containment',
    phaseId: 'containment',
    title: 'Apply selected isolation',
    role: 'generated',
    roleLabel: 'Generated action',
    required: true,
    question: 'Execute the containment action generated from the confirmed Investigation responses.',
    answerType: 'generated',
    meta: 'Created from Investigation answers',
  },
];

export const PHASE_GUIDANCE: Record<string, string> = {
  detected:
    'Initial incident intake is complete. The alert and source context are preserved as the starting record.',
  detection:
    'Initial incident intake is complete. The alert and source context are preserved as the starting record.',
  triage:
    'The incident was validated, severity was assigned, and the response room was activated.',
  investigation:
    'Confirm the affected scope, business impact, and whether containment can proceed safely. Required work is assigned in dependency order.',
  containment: 'Tasks in this phase are generated from the confirmed Investigation answers.',
  recovery: 'Recovery remains locked until containment outcomes are confirmed.',
  prepare: 'Preparation phase is complete for this playbook.',
  identify: 'Identification outcomes are recorded.',
  respond: 'Response actions are in progress.',
  review: 'Post-incident review awaits prior phase completion.',
};

export function workItemsForPhase(phaseId: string): WorkflowWorkItem[] {
  return WORKFLOW_CANVAS_WORK.filter((item) => item.phaseId === phaseId);
}

/** Topic threads for Investigation collaboration — Q → F → D narrative paths. */
export interface CollabThreadDef {
  id: string;
  label: string;
  phaseId: string;
  /** Question ids in real IR order within the thread. */
  itemIds: number[];
}

/**
 * Parallel investigation threads (real war-room practice):
 * - Attack vector → TI finding → account decision
 * - Lateral movement (parallel fact-finding)
 * - C2 confirmation → isolation decision
 */
export const COLLAB_THREADS: CollabThreadDef[] = [
  {
    id: 'attack-vector',
    label: 'Attack vector',
    phaseId: 'investigation',
    itemIds: [1, 3, 2],
  },
  {
    id: 'lateral-movement',
    label: 'Lateral movement',
    phaseId: 'investigation',
    itemIds: [4],
  },
  {
    id: 'c2-isolation',
    label: 'C2 & isolation',
    phaseId: 'investigation',
    itemIds: [5, 6],
  },
];

export function threadsForPhase(phaseId: string): CollabThreadDef[] {
  return COLLAB_THREADS.filter((thread) => thread.phaseId === phaseId);
}

export function mapStepStatusToCanvas(
  status: WorkflowStep['status'],
  unlocked = true,
): 'done' | 'active' | 'locked' | 'queued' {
  if (!unlocked && status === 'pending') return 'locked';
  if (status === 'completed') return 'done';
  if (status === 'current') return 'active';
  return 'queued';
}
