import type { Participant, TaskPersonAnswer } from './data';
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
