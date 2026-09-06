import type { Participant, Question, WorkflowStep } from './data';
import type { AssignableTaskRole } from './data';
import type { WorkflowWorkItem } from './components/response-workflow/workflowCanvasData';
import {
  TASK_ROLE_LABEL,
  peopleForPersonAssignee,
  peopleForTaskRole,
  taskQuorumStatus,
  waitingOnLabel,
  type TaskRolePerson,
} from './taskQuorum';
import {
  isWorkItemAnswered,
  workDependsSatisfiedWithCatalog,
  workItemQuorum,
  type WorkAnswersState,
} from './workAnswers';

/** First incomplete prior work item in the same phase (catalog order) — enforces one active role. */
export function phaseSequenceBlocker(
  item: WorkflowWorkItem,
  catalog: WorkflowWorkItem[],
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
): WorkflowWorkItem | null {
  const phaseItems = catalog.filter((entry) => entry.phaseId === item.phaseId);
  const index = phaseItems.findIndex((entry) => entry.id === item.id);
  if (index <= 0) return null;

  for (let i = 0; i < index; i += 1) {
    const prev = phaseItems[i];
    if (prev.answerType === 'generated') continue;
    if (!isWorkItemAnswered(prev, answers, participants, commanderParticipantId)) {
      return prev;
    }
  }
  return null;
}

export function isWorkItemSequentiallyOpen(
  item: WorkflowWorkItem,
  catalog: WorkflowWorkItem[],
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
  investigationComplete: boolean,
): boolean {
  if (item.answerType === 'generated') return investigationComplete;
  if (
    !workDependsSatisfiedWithCatalog(
      item,
      catalog,
      answers,
      participants,
      commanderParticipantId,
    )
  ) {
    return false;
  }
  if (phaseSequenceBlocker(item, catalog, answers, participants, commanderParticipantId)) {
    return false;
  }
  return !isWorkItemAnswered(item, answers, participants, commanderParticipantId);
}

export interface RoomTurnAttention {
  phaseId: string;
  phaseLabel: string;
  /** Canvas node id to focus (work id, `collab-{n}`, or phase id). */
  targetId: string;
  taskTitle: string;
  role: AssignableTaskRole | null;
  roleLabel: string;
  pendingPeople: TaskRolePerson[];
  answeredPeople: TaskRolePerson[];
  answeredCount: number;
  totalCount: number;
  waitingCopy: string;
  source: 'work' | 'collab' | 'complete-phase';
}

function currentPhase(steps: WorkflowStep[], completedPhaseIds: string[]): WorkflowStep | null {
  const active = steps.find(
    (step) => step.status === 'current' && !completedPhaseIds.includes(step.id),
  );
  if (active) return active;
  return (
    steps.find((step) => !completedPhaseIds.includes(step.id) && step.status !== 'completed') ??
    null
  );
}

function isQuestionIncomplete(
  question: Question,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  if (question.assigneeRole) {
    const people = peopleForTaskRole(
      question.assigneeRole,
      participants,
      commanderParticipantId,
    );
    return !taskQuorumStatus(question.roleAnswers, people).isComplete;
  }
  if (question.status === 'decision') return !question.decision;
  if (question.status === 'answered') return false;
  return (question.answers?.length ?? 0) === 0;
}

/** Who the room is waiting on right now (single sequential turn). */
export function resolveRoomTurnAttention(input: {
  steps: WorkflowStep[];
  completedPhaseIds: string[];
  workCatalog: WorkflowWorkItem[];
  answers: WorkAnswersState;
  questions: Question[];
  participants: Participant[];
  commanderParticipantId: string;
  investigationComplete: boolean;
  /** Remaining required items for the current phase; empty means Complete Phase is pending. */
  currentPhaseGaps?: string[];
}): RoomTurnAttention | null {
  const phase = currentPhase(input.steps, input.completedPhaseIds);
  if (!phase) return null;

  const phaseWork = input.workCatalog.filter((item) => item.phaseId === phase.id);
  const activeWork = phaseWork.find((item) =>
    isWorkItemSequentiallyOpen(
      item,
      input.workCatalog,
      input.answers,
      input.participants,
      input.commanderParticipantId,
      input.investigationComplete,
    ),
  );

  if (activeWork) {
    const { quorum } = workItemQuorum(
      activeWork,
      input.answers,
      input.participants,
      input.commanderParticipantId,
    );
    const pending = quorum.pending;
    const roleLabel = activeWork.roleLabel || TASK_ROLE_LABEL[activeWork.role];
    const waitingCopy =
      pending.length > 0
        ? waitingOnLabel(pending)
        : activeWork.role === 'generated'
          ? 'Ready for generated action'
          : `Waiting on ${roleLabel}`;

    return {
      phaseId: phase.id,
      phaseLabel: phase.label,
      targetId: activeWork.id,
      taskTitle: activeWork.title,
      role: activeWork.role,
      roleLabel,
      pendingPeople: pending,
      answeredPeople: quorum.answeredPeople,
      answeredCount: quorum.answered,
      totalCount: quorum.total,
      waitingCopy,
      source: 'work',
    };
  }

  if (phase.id === 'investigation') {
    const workRequiredDone = phaseWork
      .filter((item) => item.required && item.answerType !== 'generated')
      .every((item) =>
        isWorkItemAnswered(
          item,
          input.answers,
          input.participants,
          input.commanderParticipantId,
          input.investigationComplete,
        ),
      );

    if (workRequiredDone) {
      const question = input.questions.find((item) =>
        isQuestionIncomplete(item, input.participants, input.commanderParticipantId),
      );
      if (question?.assigneeRole) {
        const people = peopleForTaskRole(
          question.assigneeRole,
          input.participants,
          input.commanderParticipantId,
        );
        const quorum = taskQuorumStatus(question.roleAnswers, people);
        const roleLabel = question.roleLabel ?? TASK_ROLE_LABEL[question.assigneeRole];
        return {
          phaseId: phase.id,
          phaseLabel: phase.label,
          targetId: `collab-${question.id}`,
          taskTitle: question.text,
          role: question.assigneeRole,
          roleLabel,
          pendingPeople: quorum.pending,
          answeredPeople: quorum.answeredPeople,
          answeredCount: quorum.answered,
          totalCount: quorum.total,
          waitingCopy:
            quorum.pending.length > 0
              ? waitingOnLabel(quorum.pending)
              : `Waiting on ${roleLabel}`,
          source: 'collab',
        };
      }
    }
  }

  const gaps = input.currentPhaseGaps;
  if (gaps && gaps.length === 0) {
    const commanderParticipant = input.participants.find(
      (person) => person.id === input.commanderParticipantId,
    );
    const commanderPeople = peopleForPersonAssignee(
      input.commanderParticipantId,
      commanderParticipant?.name ?? 'Commander',
      input.participants,
      input.commanderParticipantId,
    );
    const commander = commanderPeople[0];
    return {
      phaseId: phase.id,
      phaseLabel: phase.label,
      targetId: phase.id,
      taskTitle: 'Complete Phase',
      role: null,
      roleLabel: 'Commander',
      pendingPeople: commanderPeople,
      answeredPeople: [],
      answeredCount: 0,
      totalCount: 1,
      waitingCopy: commander
        ? `Waiting on ${commander.name} to complete phase`
        : 'Waiting on Commander to complete phase',
      source: 'complete-phase',
    };
  }

  return {
    phaseId: phase.id,
    phaseLabel: phase.label,
    targetId: phase.id,
    taskTitle: 'Phase in progress',
    role: null,
    roleLabel: 'Response team',
    pendingPeople: [],
    answeredPeople: [],
    answeredCount: 0,
    totalCount: 0,
    waitingCopy: `Continue ${phase.label}`,
    source: 'work',
  };
}
