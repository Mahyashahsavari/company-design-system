import type { WorkflowStep } from '../../data';
import type { AssignableTaskRole, TaskSelectionMode } from '../../data';
import { TASK_ROLE_LABEL } from '../../taskQuorum';

export type WorkflowWorkRole = AssignableTaskRole;
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
  selectionMode?: TaskSelectionMode;
  allowOther?: boolean;
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
    roleLabel: TASK_ROLE_LABEL.owner,
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
    selectionMode: 'single',
    allowOther: true,
    meta: 'Required · Q-03',
  },
  {
    id: 'admin-isolation',
    phaseId: 'investigation',
    title: 'Select isolation method',
    role: 'admin',
    roleLabel: TASK_ROLE_LABEL.admin,
    required: true,
    question: 'Which containment method can be applied within the approved interruption window?',
    answerType: 'select',
    answerLabel: 'Isolation method',
    options: ['EDR network isolation', 'Switch port shutdown', 'Firewall containment rule'],
    selectionMode: 'multi',
    allowOther: true,
    dependsOn: ['owner-impact'],
    meta: 'After Asset Owner response',
  },
  {
    id: 'investigator-c2',
    phaseId: 'investigation',
    title: 'Validate active C2',
    role: 'investigator',
    roleLabel: TASK_ROLE_LABEL.investigator,
    required: true,
    question: 'Is outbound command-and-control traffic still active from the affected segment?',
    answerType: 'textarea',
    answerLabel: 'Investigation note',
    dependsOn: ['admin-isolation'],
    meta: 'After Asset Admin response',
  },
  {
    id: 'responder-scope',
    phaseId: 'investigation',
    title: 'Confirm affected accounts',
    role: 'responder',
    roleLabel: TASK_ROLE_LABEL.responder,
    required: true,
    question: 'Which accounts show suspicious authentication tied to this burst?',
    answerType: 'select',
    answerLabel: 'Affected accounts',
    options: ['svc-finance-batch', 'j.martinez', 'Shared helpdesk mailbox'],
    selectionMode: 'multi',
    allowOther: true,
    dependsOn: ['investigator-c2'],
    meta: 'After Investigator response',
  },
  {
    id: 'generated-containment',
    phaseId: 'containment',
    title: 'Apply selected isolation',
    role: 'generated',
    roleLabel: TASK_ROLE_LABEL.generated,
    required: true,
    question: 'Execute the containment action generated from the confirmed Investigation answers.',
    answerType: 'generated',
    meta: 'Created from Investigation answers',
  },
];

export const PHASE_GUIDANCE: Record<string, string> = {
  detected:
    'Review the discovered incident before continuing. Severity and intake are already recorded — open Incident Context when you need full detail.',
  detection:
    'Initial incident intake is complete. The alert and source context are preserved as the starting record.',
  triage:
    'Severity is already assigned from the discovered incident. Capture optional triage notes, then continue into Investigation.',
  investigation:
    'Confirm impact, isolation method, investigation notes, then affected scope — one role at a time, in order.',
  containment: 'Tasks in this phase are generated from the confirmed Investigation answers.',
  eradication:
    'Remove attacker artifacts, persistence, and compromised access after containment holds the threat.',
  recovery: 'Restore services safely and confirm monitoring coverage after eradication.',
  'lessons-learned':
    'Capture what worked, what failed, and follow-up actions so the next response improves.',
  prepare: 'Preparation phase is complete for this playbook.',
  identify: 'Identification outcomes are recorded.',
  respond: 'Response actions are in progress.',
  review: 'Post-incident review awaits prior phase completion.',
};

export function nistPhaseSelectOptions(steps: WorkflowStep[]): { value: string; label: string }[] {
  return steps.map((step) => ({ value: step.id, label: step.label }));
}

export function workItemsForPhase(
  phaseId: string,
  catalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
): WorkflowWorkItem[] {
  return catalog.filter((item) => item.phaseId === phaseId);
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
 * Investigation collaboration threads (sequential across the room):
 * - Attack vector → TI finding → account decision
 * - Lateral movement
 * - C2 confirmation → isolation decision
 * Only one thread item is active at a time (after role work unlocks collab).
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

export function threadsForPhase(
  phaseId: string,
  catalog: CollabThreadDef[] = COLLAB_THREADS,
): CollabThreadDef[] {
  return catalog.filter((thread) => thread.phaseId === phaseId);
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
