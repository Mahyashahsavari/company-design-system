import type { Participant } from '../data';
import { PARTICIPANTS } from '../data';
import { CURRENT_USER } from '../../../shared/constants';
import { TASK_ROLE_LABEL } from '../taskQuorum';
import type { WorkflowWorkItem } from '../components/response-workflow/workflowCanvasData';

/** Shared roster for presentation rooms (Commander = local user). */
export const SCENARIO_PARTICIPANTS: Participant[] = structuredClone(PARTICIPANTS);

export const SCENARIO_COMMANDER_ID = CURRENT_USER.id;

/** Optional triage severity check (severity already on the incident). */
export function triageSeverityCheck(
  prefix: string,
  question: string,
  options: string[],
): WorkflowWorkItem {
  return {
    id: `${prefix}-triage-sev`,
    phaseId: 'triage',
    title: 'Confirm operating severity',
    role: 'responder',
    roleLabel: TASK_ROLE_LABEL.responder,
    required: false,
    question,
    answerType: 'select',
    answerLabel: 'Severity check',
    options,
    selectionMode: 'single',
    allowOther: true,
    guidance:
      'Severity is already recorded on the incident. Use this check only when the room needs to confirm or adjust operating severity.',
    meta: 'Optional · intake check',
  };
}

/**
 * Investigation: share and review only — no response decisions here.
 * Decisions happen in Containment / Eradication / Recovery after SOC proposes options.
 */
export function investigationBoard(
  prefix: string,
  copy: {
    reportQ: string;
    ownerQ?: string;
    adminQ?: string;
  },
): WorkflowWorkItem[] {
  const reportId = `${prefix}-inv-report`;
  const ownerId = `${prefix}-inv-owner-ack`;
  const adminId = `${prefix}-inv-admin-ack`;
  return [
    {
      id: reportId,
      phaseId: 'investigation',
      title: 'Share investigation report',
      role: 'investigator',
      roleLabel: TASK_ROLE_LABEL.investigator,
      required: true,
      question: copy.reportQ,
      answerType: 'textarea',
      answerLabel: 'Investigation report',
      guidance:
        'Review gathered alerts, entities, and findings, then share a report. Do not choose containment or recovery actions here.',
      meta: 'Required · share report',
    },
    {
      id: ownerId,
      phaseId: 'investigation',
      title: 'Confirm report received',
      role: 'owner',
      roleLabel: TASK_ROLE_LABEL.owner,
      required: true,
      question:
        copy.ownerQ ??
        'Confirm you have reviewed the shared investigation report. Response decisions happen in later phases.',
      answerType: 'select',
      answerLabel: 'Owner review',
      options: ['Report reviewed', 'Need more investigation detail'],
      selectionMode: 'single',
      allowOther: false,
      dependsOn: [reportId],
      guidance: 'Acknowledgment only — no business decision or action selection in Investigation.',
      meta: 'After Investigator report · review only',
    },
    {
      id: adminId,
      phaseId: 'investigation',
      title: 'Confirm technical review',
      role: 'admin',
      roleLabel: TASK_ROLE_LABEL.admin,
      required: true,
      question:
        copy.adminQ ??
        'Confirm you have reviewed the technical findings. Executable response work starts in later phases.',
      answerType: 'select',
      answerLabel: 'Admin review',
      options: ['Findings reviewed', 'Need more telemetry'],
      selectionMode: 'single',
      allowOther: false,
      dependsOn: [ownerId],
      guidance: 'Acknowledgment only — executable actions are decided after SOC proposals.',
      meta: 'After Owner review · review only',
    },
  ];
}

export interface ResponseActionCopy {
  proposeTitle?: string;
  proposeQ: string;
  proposeOpts: string[];
  ownerQ?: string;
  adminQ?: string;
}

/**
 * Containment / Eradication / Recovery board:
 * Responder proposes → Owner selects (from proposals) → Admin executes per action.
 */
export function responseActionBoard(
  phaseId: 'containment' | 'eradication' | 'recovery',
  prefix: string,
  copy: ResponseActionCopy,
): WorkflowWorkItem[] {
  const proposeId = `${prefix}-${phaseId}-propose`;
  const ownerId = `${prefix}-${phaseId}-owner`;
  const adminId = `${prefix}-${phaseId}-admin`;
  const phaseLabel =
    phaseId === 'containment'
      ? 'containment'
      : phaseId === 'eradication'
        ? 'eradication'
        : 'recovery';

  return [
    {
      id: proposeId,
      phaseId,
      title: copy.proposeTitle ?? `Propose ${phaseLabel} options`,
      role: 'responder',
      roleLabel: TASK_ROLE_LABEL.responder,
      required: true,
      question: copy.proposeQ,
      answerType: 'select',
      answerLabel: 'Proposed options',
      options: copy.proposeOpts,
      selectionMode: 'multi',
      allowOther: true,
      guidance: `Offer ${phaseLabel} options based on the incident attack type, tactic, and technique. Owner will select and assign Admin.`,
      meta: 'Required · propose to Owner',
    },
    {
      id: ownerId,
      phaseId,
      title: `Select ${phaseLabel} actions`,
      role: 'owner',
      roleLabel: TASK_ROLE_LABEL.owner,
      required: true,
      question:
        copy.ownerQ ??
        `Select one or more proposed ${phaseLabel} options and assign execution to Asset Admin.`,
      answerType: 'select',
      answerLabel: 'Owner selection',
      selectionMode: 'multi',
      allowOther: false,
      dependsOn: [proposeId],
      optionsFromDependency: true,
      guidance: `Choose which proposed ${phaseLabel} actions the business authorizes. Selection assigns Admin to execute.`,
      meta: 'After proposals · assign Admin',
    },
    {
      id: adminId,
      phaseId,
      title: `Execute ${phaseLabel} tasks`,
      role: 'admin',
      roleLabel: TASK_ROLE_LABEL.admin,
      required: true,
      question:
        copy.adminQ ??
        'For each Owner-selected action: set Duration and Due time, then after work starts mark Done or Rejected. Notes are optional.',
      answerType: 'execution',
      answerLabel: 'Per-action execution',
      selectionMode: 'multi',
      dependsOn: [ownerId],
      optionsFromDependency: true,
      guidance:
        'Each action is tracked separately. Schedule Duration + Due first (In progress), then report Done or Rejected with optional notes.',
      meta: 'After Owner selection · per action',
    },
  ];
}

export function lessonsLearnedBoard(
  prefix: string,
  copy: {
    summaryQ: string;
    rulesQ: string;
    rulesOpts: string[];
  },
): WorkflowWorkItem[] {
  const summaryId = `${prefix}-lessons-summary`;
  return [
    {
      id: summaryId,
      phaseId: 'lessons-learned',
      title: 'Capture lessons learned',
      role: 'investigator',
      roleLabel: TASK_ROLE_LABEL.investigator,
      required: true,
      question: copy.summaryQ,
      answerType: 'textarea',
      answerLabel: 'Lessons summary',
      guidance: 'Summarize what the team learned during this room so the minutes reflect the outcome.',
      meta: 'Required · lessons',
    },
    {
      id: `${prefix}-lessons-rules`,
      phaseId: 'lessons-learned',
      title: 'Define follow-up rules',
      role: 'responder',
      roleLabel: TASK_ROLE_LABEL.responder,
      required: true,
      question: copy.rulesQ,
      answerType: 'select',
      answerLabel: 'Follow-up rules',
      options: copy.rulesOpts,
      selectionMode: 'multi',
      allowOther: true,
      dependsOn: [summaryId],
      guidance: 'Optional preventive controls and detections derived from this incident.',
      meta: 'After lessons summary',
    },
  ];
}
