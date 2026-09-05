import type { Participant } from '../data';
import { PARTICIPANTS } from '../data';
import { CURRENT_USER } from '../../../shared/constants';
import { TASK_ROLE_LABEL } from '../taskQuorum';
import type { WorkflowWorkItem } from '../components/response-workflow/workflowCanvasData';

/** Shared roster for presentation rooms (Commander = local user). */
export const SCENARIO_PARTICIPANTS: Participant[] = structuredClone(PARTICIPANTS);

export const SCENARIO_COMMANDER_ID = CURRENT_USER.id;

/** Lightweight required card for early / late phases. */
export function phaseGateWork(
  phaseId: string,
  id: string,
  title: string,
  question: string,
  options: string[],
): WorkflowWorkItem {
  return {
    id,
    phaseId,
    title,
    role: 'responder',
    roleLabel: TASK_ROLE_LABEL.responder,
    required: true,
    question,
    answerType: 'select',
    answerLabel: 'Response',
    options,
    selectionMode: 'single',
    allowOther: true,
    meta: 'Required · phase gate',
  };
}

export function investigationBoard(prefix: string, copy: {
  ownerQ: string;
  adminQ: string;
  investigatorQ: string;
  responderQ: string;
  ownerOpts: string[];
  adminOpts: string[];
  responderOpts: string[];
}): WorkflowWorkItem[] {
  const ownerId = `${prefix}-owner-impact`;
  return [
    {
      id: ownerId,
      phaseId: 'investigation',
      title: 'Confirm business impact',
      role: 'owner',
      roleLabel: TASK_ROLE_LABEL.owner,
      required: true,
      question: copy.ownerQ,
      answerType: 'select',
      answerLabel: 'Approved interruption window',
      options: copy.ownerOpts,
      selectionMode: 'single',
      allowOther: true,
      meta: 'Required · impact',
    },
    {
      id: `${prefix}-admin-isolation`,
      phaseId: 'investigation',
      title: 'Select isolation method',
      role: 'admin',
      roleLabel: TASK_ROLE_LABEL.admin,
      required: true,
      question: copy.adminQ,
      answerType: 'select',
      answerLabel: 'Isolation method',
      options: copy.adminOpts,
      selectionMode: 'multi',
      allowOther: true,
      dependsOn: [ownerId],
      meta: 'After Asset Owner response',
    },
    {
      id: `${prefix}-investigator-note`,
      phaseId: 'investigation',
      title: 'Record investigation note',
      role: 'investigator',
      roleLabel: TASK_ROLE_LABEL.investigator,
      required: false,
      question: copy.investigatorQ,
      answerType: 'textarea',
      answerLabel: 'Investigation note',
      meta: 'Optional',
    },
    {
      id: `${prefix}-responder-scope`,
      phaseId: 'investigation',
      title: 'Confirm affected scope',
      role: 'responder',
      roleLabel: TASK_ROLE_LABEL.responder,
      required: true,
      question: copy.responderQ,
      answerType: 'select',
      answerLabel: 'Affected scope',
      options: copy.responderOpts,
      selectionMode: 'multi',
      allowOther: true,
      meta: 'Required · all Responders',
    },
  ];
}

export function laterPhaseGates(prefix: string): WorkflowWorkItem[] {
  return [
    phaseGateWork(
      'containment',
      `${prefix}-containment-confirm`,
      'Confirm containment action',
      'Which containment action was applied?',
      ['Network isolation applied', 'Account disabled', 'Monitoring only', 'Rollback planned'],
    ),
    phaseGateWork(
      'eradication',
      `${prefix}-eradication-confirm`,
      'Confirm eradication',
      'Were attacker artifacts removed?',
      ['Artifacts removed', 'Persistence cleared', 'Still investigating', 'N/A for this incident'],
    ),
    phaseGateWork(
      'recovery',
      `${prefix}-recovery-confirm`,
      'Confirm recovery',
      'Is the service restored and monitored?',
      ['Restored with monitoring', 'Partial restore', 'Not yet restored'],
    ),
    phaseGateWork(
      'lessons-learned',
      `${prefix}-lessons-confirm`,
      'Capture lessons learned',
      'Primary follow-up for the next response?',
      ['Tune detection rules', 'Harden authentication', 'Improve playbook', 'No further action'],
    ),
  ];
}
