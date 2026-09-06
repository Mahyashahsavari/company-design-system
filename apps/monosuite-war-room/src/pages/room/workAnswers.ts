import type { ExecutionActionState, Participant, TaskPersonAnswer } from './data';
import type { WorkflowWorkItem } from './components/response-workflow/workflowCanvasData';
import {
  formatTaskAnswerDisplay,
  peopleForTaskRole,
  taskQuorumStatus,
} from './taskQuorum';

export type WorkAnswersState = Record<string, TaskPersonAnswer[]>;

export function workItemQuorum(
  item: WorkflowWorkItem,
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
) {
  const people = peopleForTaskRole(item.role, participants, commanderParticipantId);
  return {
    people,
    quorum: taskQuorumStatus(answers[item.id], people),
  };
}

export function isWorkItemAnswered(
  item: WorkflowWorkItem,
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
  investigationComplete = false,
): boolean {
  if (item.answerType === 'generated') return investigationComplete;
  if (item.answerType === 'execution') {
    const { people, quorum } = workItemQuorum(item, answers, participants, commanderParticipantId);
    if (!quorum.isComplete) return false;
    return people.every((person) => {
      const answer = answers[item.id]?.find((entry) => entry.participantId === person.id);
      return isExecutionItemsComplete(answer?.executionItems);
    });
  }
  return workItemQuorum(item, answers, participants, commanderParticipantId).quorum.isComplete;
}

/** Dependency check using the full work catalog. */
export function workDependsSatisfiedWithCatalog(
  item: WorkflowWorkItem,
  catalog: WorkflowWorkItem[],
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  return (item.dependsOn ?? []).every((depId) => {
    const dep = catalog.find((entry) => entry.id === depId);
    if (!dep) return Boolean(answers[depId]?.length);
    return isWorkItemAnswered(dep, answers, participants, commanderParticipantId);
  });
}

export function summarizeWorkAnswers(answers: TaskPersonAnswer[] | undefined): string {
  if (!answers?.length) return '';
  if (answers.length === 1) return formatTaskAnswerDisplay(answers[0]);
  return `${answers.length} responses`;
}

/** Options for Owner/Admin cards that inherit from the prior role's submitted values. */
export function resolveWorkItemOptions(
  item: WorkflowWorkItem,
  _catalog: WorkflowWorkItem[],
  answers: WorkAnswersState,
): string[] {
  if (!item.optionsFromDependency) return item.options ?? [];
  const depId = item.dependsOn?.[0];
  if (!depId) return item.options ?? [];
  const depAnswers = answers[depId] ?? [];
  const inherited = Array.from(
    new Set(depAnswers.flatMap((answer) => answer.values.filter(Boolean))),
  );
  return inherited.length > 0 ? inherited : (item.options ?? []);
}

export function isExecutionItemsComplete(items: ExecutionActionState[] | undefined): boolean {
  if (!items?.length) return false;
  return items.every(
    (item) =>
      item.action.trim().length > 0 &&
      item.duration.trim().length > 0 &&
      item.dueAt.trim().length > 0 &&
      (item.status === 'done' || item.status === 'rejected'),
  );
}

export function isExecutionItemScheduled(item: ExecutionActionState): boolean {
  return item.duration.trim().length > 0 && item.dueAt.trim().length > 0;
}

export function createExecutionDrafts(
  actions: string[],
  existing?: ExecutionActionState[],
): ExecutionActionState[] {
  return actions.map((action) => {
    const prior = existing?.find((item) => item.action === action);
    return (
      prior ?? {
        action,
        duration: '',
        dueAt: '',
        notes: '',
        status: 'in_progress' as const,
      }
    );
  });
}
