import { Avatar, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { TaskQuorumStatus, TaskRolePerson } from '../taskQuorum';
import { TASK_ROLE_COLOR, waitingOnLabel, type AssignableTaskRole } from '../taskQuorum';

interface TaskQuorumProgressProps {
  roleLabel: string;
  role?: AssignableTaskRole;
  quorum: TaskQuorumStatus;
  compact?: boolean;
}

function PersonChip({
  person,
  answered,
}: {
  person: TaskRolePerson;
  answered: boolean;
}) {
  return (
    <Tooltip label={`${person.name}${answered ? ' · answered' : ' · waiting'}`} withArrow>
      <Avatar
        size={22}
        radius="xl"
        color={answered ? 'success' : person.color}
        variant={answered ? 'filled' : 'light'}
        style={{ opacity: answered ? 1 : 0.55 }}
      >
        {person.initials}
      </Avatar>
    </Tooltip>
  );
}

/** Progress for role-assigned tasks: N of M answered + waiting copy. */
export function TaskQuorumProgress({
  roleLabel,
  role,
  quorum,
  compact = false,
}: TaskQuorumProgressProps) {
  const color = role ? TASK_ROLE_COLOR[role] : 'neutral';
  const waiting = waitingOnLabel(quorum.pending);

  return (
    <Stack gap={compact ? 4 : 6}>
      <Group gap={6} wrap="wrap">
        <Badge size="xs" variant="light" color={color}>
          Answer by · {roleLabel}
        </Badge>
        <Badge size="xs" variant={quorum.isComplete ? 'filled' : 'outline'} color={quorum.isComplete ? 'success' : 'neutral'}>
          {quorum.answered} of {quorum.total} answered
        </Badge>
      </Group>
      {quorum.total > 0 ? (
        <Group gap={4} wrap="nowrap">
          {quorum.answeredPeople.map((person) => (
            <PersonChip key={person.id} person={person} answered />
          ))}
          {quorum.pending.map((person) => (
            <PersonChip key={person.id} person={person} answered={false} />
          ))}
        </Group>
      ) : null}
      {!quorum.isComplete && waiting ? (
        <Text size="xs" c="dimmed">
          {waiting}
        </Text>
      ) : null}
      {quorum.isComplete ? (
        <Text size="xs" c="success">
          All assignees have answered
        </Text>
      ) : null}
    </Stack>
  );
}
