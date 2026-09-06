import type { WorkflowStep } from '../../data';
import type { AssignableTaskRole, TaskSelectionMode } from '../../data';
import { TASK_ROLE_LABEL } from '../../taskQuorum';

export type WorkflowWorkRole = AssignableTaskRole;
export type WorkflowWorkAnswerType = 'select' | 'textarea' | 'execution' | 'generated';

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
  /**
   * When true, select/execution options come from the first `dependsOn`
   * work item's submitted answer values (Owner ← Propose, Admin ← Owner).
   */
  optionsFromDependency?: boolean;
  /** Inspector guidance override (falls back to PHASE_GUIDANCE). */
  guidance?: string;
  meta: string;
}

/** Prototype work graph aligned with SOC response flow (non-scenario rooms). */
export const WORKFLOW_CANVAS_WORK: WorkflowWorkItem[] = [
  {
    id: 'triage-confirm',
    phaseId: 'triage',
    title: 'Review intake severity',
    role: 'responder',
    roleLabel: TASK_ROLE_LABEL.responder,
    required: false,
    question:
      'Severity is already on the incident record. Confirm or adjust the operating severity for this room.',
    answerType: 'select',
    answerLabel: 'Severity check',
    options: ['Keep as recorded', 'Raise severity', 'Lower severity', 'Needs Commander review'],
    selectionMode: 'single',
    allowOther: true,
    meta: 'Optional · intake check',
  },
  {
    id: 'inv-report',
    phaseId: 'investigation',
    title: 'Share investigation report',
    role: 'investigator',
    roleLabel: TASK_ROLE_LABEL.investigator,
    required: true,
    question: 'Summarize gathered evidence and findings for room participants.',
    answerType: 'textarea',
    answerLabel: 'Investigation report',
    guidance: 'Publish what the team knows so Owner and Admin can act in later phases.',
    meta: 'Required · share report',
  },
  {
    id: 'inv-owner-ack',
    phaseId: 'investigation',
    title: 'Confirm report received',
    role: 'owner',
    roleLabel: TASK_ROLE_LABEL.owner,
    required: true,
    question:
      'Confirm you have reviewed the shared investigation report. Response decisions happen in later phases.',
    answerType: 'select',
    answerLabel: 'Owner review',
    options: ['Report reviewed', 'Need more investigation detail'],
    selectionMode: 'single',
    allowOther: false,
    dependsOn: ['inv-report'],
    meta: 'After Investigator report · review only',
  },
  {
    id: 'inv-admin-ack',
    phaseId: 'investigation',
    title: 'Confirm technical review',
    role: 'admin',
    roleLabel: TASK_ROLE_LABEL.admin,
    required: true,
    question:
      'Confirm you have reviewed the technical findings. Executable response work starts in later phases.',
    answerType: 'select',
    answerLabel: 'Admin review',
    options: ['Findings reviewed', 'Need more telemetry'],
    selectionMode: 'single',
    allowOther: false,
    dependsOn: ['inv-owner-ack'],
    meta: 'After Owner review · review only',
  },
  {
    id: 'contain-propose',
    phaseId: 'containment',
    title: 'Propose containment options',
    role: 'responder',
    roleLabel: TASK_ROLE_LABEL.responder,
    required: true,
    question: 'Which containment options should be offered to the Asset Owner?',
    answerType: 'select',
    answerLabel: 'Proposed options',
    options: ['EDR network isolation', 'Disable compromised account', 'Block source at edge'],
    selectionMode: 'multi',
    allowOther: true,
    meta: 'Required · propose to Owner',
  },
  {
    id: 'contain-owner',
    phaseId: 'containment',
    title: 'Select containment actions',
    role: 'owner',
    roleLabel: TASK_ROLE_LABEL.owner,
    required: true,
    question: 'Select one or more proposed options and assign execution to Asset Admin.',
    answerType: 'select',
    answerLabel: 'Owner selection',
    selectionMode: 'multi',
    allowOther: false,
    dependsOn: ['contain-propose'],
    optionsFromDependency: true,
    meta: 'After proposals · assign Admin',
  },
  {
    id: 'contain-admin',
    phaseId: 'containment',
    title: 'Execute containment tasks',
    role: 'admin',
    roleLabel: TASK_ROLE_LABEL.admin,
    required: true,
    question:
      'For each Owner-selected action: set Duration and Due time, then after work starts mark Done or Rejected. Notes are optional.',
    answerType: 'execution',
    answerLabel: 'Per-action execution',
    selectionMode: 'multi',
    dependsOn: ['contain-owner'],
    optionsFromDependency: true,
    meta: 'After Owner selection · per action',
  },
];

export const PHASE_GUIDANCE: Record<string, string> = {
  detected:
    'Intake is already complete — the incident was received from a source or added manually. Review context, then complete this phase.',
  detection:
    'Initial incident intake is complete. The alert and source context are preserved as the starting record.',
  triage:
    'Severity is already on the incident. Optionally confirm operating severity, capture triage notes, or let the Commander ask a clarifying question.',
  investigation:
    'Share and review gathered data only. Response decisions happen after SOC proposes options in Containment, Eradication, or Recovery.',
  containment:
    'Propose options → Owner selects and assigns Admin → Admin schedules each action (Duration/Due), then marks Done or Rejected with optional notes.',
  eradication:
    'Same response flow as containment, with eradication options for this incident. Skip when no eradication work applies.',
  recovery:
    'Same response flow as containment, with recovery options for this incident. Skip when no recovery work applies.',
  'lessons-learned':
    'Capture what the team learned and optional follow-up rules so the same attack path is harder next time.',
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
 * Collaboration threads for response decision phases (not Investigation).
 * Investigation is share/review only; Q → F → D lives on Containment by default.
 * Only one thread item is active at a time (after role work unlocks collab).
 */
export const COLLAB_THREADS: CollabThreadDef[] = [
  {
    id: 'attack-vector',
    label: 'Attack vector',
    phaseId: 'containment',
    itemIds: [1, 3, 2],
  },
  {
    id: 'lateral-movement',
    label: 'Lateral movement',
    phaseId: 'containment',
    itemIds: [4],
  },
  {
    id: 'c2-isolation',
    label: 'C2 & isolation',
    phaseId: 'containment',
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
