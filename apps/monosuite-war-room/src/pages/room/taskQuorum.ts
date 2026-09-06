import { CURRENT_USER } from '../../shared/constants';
import type {
  AssignableTaskRole,
  ExecutionActionState,
  Participant,
  TaskPersonAnswer,
  TaskSelectionMode,
} from './data';
import { isRoomCommander, participantRoleLabel } from './data';

export type { AssignableTaskRole, TaskPersonAnswer, TaskSelectionMode };

export interface TaskRolePerson {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface TaskQuorumStatus {
  answered: number;
  total: number;
  pending: TaskRolePerson[];
  answeredPeople: TaskRolePerson[];
  isComplete: boolean;
}

export const TASK_ROLE_LABEL: Record<AssignableTaskRole, string> = {
  owner: 'Asset Owner',
  admin: 'Asset Admin',
  investigator: 'Investigator',
  generated: 'Generated action',
  responder: 'Responder',
};

export const TASK_ROLE_COLOR: Record<
  AssignableTaskRole,
  'warning' | 'teal' | 'accent' | 'success' | 'neutral'
> = {
  owner: 'accent',
  admin: 'warning',
  investigator: 'teal',
  generated: 'success',
  responder: 'teal',
};

export const ASSIGNABLE_TASK_ROLE_OPTIONS: { value: AssignableTaskRole; label: string }[] = [
  { value: 'owner', label: TASK_ROLE_LABEL.owner },
  { value: 'admin', label: TASK_ROLE_LABEL.admin },
  { value: 'investigator', label: TASK_ROLE_LABEL.investigator },
  { value: 'responder', label: TASK_ROLE_LABEL.responder },
];

/** Prototype: which participants hold which canvas work roles. */
export const PARTICIPANT_WORK_ROLES: Record<string, AssignableTaskRole[]> = {
  sarah: ['owner', 'investigator'],
  mike: ['admin', 'investigator'],
  alex: ['owner', 'admin'],
  harriette: ['investigator'],
};

export const OTHER_OPTION_VALUE = 'Other';

/**
 * Temporary demo override: local Commander can answer any role/person task and
 * their answer alone completes quorum so the full NIST walk is self-serve.
 * Remove when real multi-role participation is wired.
 */
export const DEMO_COMMANDER_FULL_ACCESS = true;

export function formatTaskAnswerDisplay(answer: TaskPersonAnswer): string {
  if (answer.executionItems?.length) {
    return answer.executionItems
      .map((item) => {
        const statusLabel =
          item.status === 'done' ? 'Done' : item.status === 'rejected' ? 'Rejected' : 'In progress';
        const bits = [
          item.action,
          statusLabel,
          item.duration ? `Duration ${item.duration}` : null,
          item.dueAt ? `Due ${item.dueAt}` : null,
          item.notes?.trim() || null,
        ].filter(Boolean);
        return bits.join(' · ');
      })
      .join(' | ');
  }
  const parts = answer.values.map((value) =>
    value === OTHER_OPTION_VALUE && answer.otherText?.trim()
      ? `Other: “${answer.otherText.trim()}”`
      : value,
  );
  const base = parts.join(' · ');
  const executionBits = [
    answer.executionStatus === 'done'
      ? 'Done'
      : answer.executionStatus === 'not_done'
        ? 'Not done'
        : null,
    answer.duration ? `Duration ${answer.duration}` : null,
    answer.dueAt ? `Due ${answer.dueAt}` : null,
    answer.description?.trim() ? answer.description.trim() : null,
  ].filter(Boolean);
  if (!executionBits.length) return base;
  return base ? `${base} · ${executionBits.join(' · ')}` : executionBits.join(' · ');
}

export function upsertPersonAnswer(
  current: TaskPersonAnswer[] | undefined,
  next: TaskPersonAnswer,
): TaskPersonAnswer[] {
  const list = current ?? [];
  const without = list.filter((item) => item.participantId !== next.participantId);
  return [...without, next];
}

export function answerFromPerson(
  answers: TaskPersonAnswer[] | undefined,
  participantId: string,
): TaskPersonAnswer | undefined {
  return answers?.find((item) => item.participantId === participantId);
}

export function rosterPeople(
  participants: Participant[],
  _commanderParticipantId: string,
): TaskRolePerson[] {
  const remote = participants
    .filter((person) => !person.removed)
    .map((person) => ({
      id: person.id,
      name: person.name,
      initials: person.initials,
      color: person.color,
    }));

  if (remote.some((person) => person.id === CURRENT_USER.id)) return remote;

  return [
    {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      color: 'brand',
    },
    ...remote,
  ];
}

function roomRoleForPerson(
  personId: string,
  participants: Participant[],
  commanderParticipantId: string,
): string {
  if (isRoomCommander(personId, commanderParticipantId)) return 'Commander';
  if (personId === CURRENT_USER.id) {
    return participantRoleLabel(CURRENT_USER.id, CURRENT_USER.roomRole, commanderParticipantId);
  }
  const match = participants.find((person) => person.id === personId);
  return match ? participantRoleLabel(match.id, match.role, commanderParticipantId) : 'Responder';
}

/** Resolve everyone who must answer a role-assigned task. */
export function peopleForTaskRole(
  role: AssignableTaskRole,
  participants: Participant[],
  commanderParticipantId: string,
): TaskRolePerson[] {
  const roster = rosterPeople(participants, commanderParticipantId);

  if (role === 'generated') return [];

  if (
    DEMO_COMMANDER_FULL_ACCESS &&
    isRoomCommander(CURRENT_USER.id, commanderParticipantId)
  ) {
    return roster.filter((person) => person.id === CURRENT_USER.id);
  }

  if (role === 'responder') {
    return roster.filter((person) => {
      const roomRole = roomRoleForPerson(person.id, participants, commanderParticipantId);
      return roomRole === 'Responder';
    });
  }

  return roster.filter((person) => (PARTICIPANT_WORK_ROLES[person.id] ?? []).includes(role));
}

export function peopleForPersonAssignee(
  assigneeId: string,
  assigneeName: string,
  participants: Participant[],
  commanderParticipantId: string,
): TaskRolePerson[] {
  if (
    DEMO_COMMANDER_FULL_ACCESS &&
    isRoomCommander(CURRENT_USER.id, commanderParticipantId)
  ) {
    return rosterPeople(participants, commanderParticipantId).filter(
      (person) => person.id === CURRENT_USER.id,
    );
  }

  const roster = rosterPeople(participants, commanderParticipantId);
  const match = roster.find((person) => person.id === assigneeId);
  if (match) return [match];
  return [
    {
      id: assigneeId,
      name: assigneeName,
      initials: assigneeName
        .split(' ')
        .map((part) => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: 'neutral',
    },
  ];
}

export function taskQuorumStatus(
  answers: TaskPersonAnswer[] | undefined,
  people: TaskRolePerson[],
): TaskQuorumStatus {
  const answeredIds = new Set((answers ?? []).map((item) => item.participantId));
  const answeredPeople = people.filter((person) => answeredIds.has(person.id));
  const pending = people.filter((person) => !answeredIds.has(person.id));
  const total = people.length;
  const answered = answeredPeople.length;
  return {
    answered,
    total,
    pending,
    answeredPeople,
    isComplete: total > 0 && answered >= total,
  };
}

export function isPersonInAssigneePool(participantId: string, people: TaskRolePerson[]): boolean {
  return people.some((person) => person.id === participantId);
}

export function waitingOnLabel(pending: TaskRolePerson[]): string {
  if (pending.length === 0) return '';
  if (pending.length === 1) return `Waiting on ${pending[0].name}`;
  if (pending.length === 2) return `Waiting on ${pending[0].name} and ${pending[1].name}`;
  return `Waiting on ${pending[0].name} +${pending.length - 1} more`;
}

export function makePersonAnswer(input: {
  participantId: string;
  participantName: string;
  values: string[];
  otherText?: string;
  duration?: string;
  dueAt?: string;
  description?: string;
  executionStatus?: 'done' | 'not_done';
  executionItems?: ExecutionActionState[];
}): TaskPersonAnswer {
  return {
    participantId: input.participantId,
    participantName: input.participantName,
    values: input.values,
    otherText: input.otherText?.trim() ? input.otherText.trim() : undefined,
    duration: input.duration?.trim() ? input.duration.trim() : undefined,
    dueAt: input.dueAt?.trim() ? input.dueAt.trim() : undefined,
    description: input.description?.trim() ? input.description.trim() : undefined,
    executionStatus: input.executionStatus,
    executionItems: input.executionItems,
    answeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
