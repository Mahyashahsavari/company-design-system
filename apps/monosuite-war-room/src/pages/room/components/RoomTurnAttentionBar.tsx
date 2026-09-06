import { Avatar, Badge, Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconFlag, IconHourglass, IconRoute2 } from '@tabler/icons-react';
import { TASK_ROLE_COLOR, type TaskRolePerson } from '../taskQuorum';
import type { RoomTurnAttention } from '../roomTurn';

interface RoomTurnAttentionBarProps {
  turn: RoomTurnAttention;
  onOpenTask?: (targetId: string) => void;
}

/** Compact animated cue: current phase + who the room is waiting on. */
export function RoomTurnAttentionBar({ turn, onOpenTask }: RoomTurnAttentionBarProps) {
  const isCompletePhase = turn.source === 'complete-phase';
  const roleBadgeColor =
    turn.role && turn.role in TASK_ROLE_COLOR ? TASK_ROLE_COLOR[turn.role] : 'neutral';
  const multiAssignee = turn.totalCount > 1;
  const canOpen = Boolean(onOpenTask && turn.targetId);

  return (
    <UnstyledButton
      className="monosuite-room-turn-attention"
      aria-live="polite"
      data-testid="room-turn-attention"
      data-role={turn.role ?? (isCompletePhase ? 'commander' : 'neutral')}
      data-attention={isCompletePhase ? 'complete' : 'waiting'}
      data-clickable={canOpen ? 'true' : undefined}
      onClick={() => {
        if (canOpen) onOpenTask?.(turn.targetId);
      }}
      disabled={!canOpen}
      aria-label={`Open pending task: ${turn.taskTitle}. ${turn.waitingCopy}`}
    >
      <Group gap={8} wrap="nowrap" align="center" justify="space-between">
        <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
          <div className="monosuite-room-turn-attention-icon" aria-hidden>
            {isCompletePhase ? <IconFlag size={14} /> : <IconHourglass size={14} />}
          </div>
          <Group gap={6} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
            <Badge
              size="xs"
              variant="light"
              color={isCompletePhase ? 'warning' : 'teal'}
              leftSection={<IconRoute2 size={10} />}
              className="monosuite-badge-with-icon"
              style={{ flexShrink: 0 }}
            >
              {turn.phaseLabel}
            </Badge>
            <Badge
              size="xs"
              variant="outline"
              color={isCompletePhase ? 'warning' : roleBadgeColor}
              style={{ flexShrink: 0 }}
            >
              {turn.roleLabel}
            </Badge>
            {multiAssignee ? (
              <Badge size="xs" variant="outline" color="neutral" style={{ flexShrink: 0 }}>
                {turn.answeredCount}/{turn.totalCount}
              </Badge>
            ) : null}
            <Text size="xs" fw={700} lineClamp={1} style={{ minWidth: 0 }}>
              {turn.waitingCopy}
              <Text span size="xs" c="dimmed" fw={500}>
                {' · '}
                {turn.taskTitle}
              </Text>
            </Text>
          </Group>
        </Group>
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }} align="center">
          {turn.totalCount > 0 ? (
            <RolePeopleStack answered={turn.answeredPeople} pending={turn.pendingPeople} />
          ) : null}
          {canOpen ? (
            <IconChevronRight
              size={14}
              className="monosuite-room-turn-attention-chevron"
              aria-hidden
            />
          ) : null}
        </Group>
      </Group>
    </UnstyledButton>
  );
}

function RolePeopleStack({
  answered,
  pending,
}: {
  answered: TaskRolePerson[];
  pending: TaskRolePerson[];
}) {
  const visibleAnswered = answered.slice(0, 2);
  const visiblePending = pending.slice(0, Math.max(0, 3 - visibleAnswered.length));
  const hidden =
    answered.length + pending.length - visibleAnswered.length - visiblePending.length;

  return (
    <Group gap={3} wrap="nowrap" aria-label="Role assignees">
      {visibleAnswered.map((person) => (
        <Tooltip key={person.id} label={`${person.name} · answered`} withArrow>
          <Avatar size={22} radius="xl" color="success" variant="filled">
            {person.initials}
          </Avatar>
        </Tooltip>
      ))}
      {visiblePending.map((person) => (
        <Tooltip key={person.id} label={`${person.name} · waiting`} withArrow>
          <Avatar
            size={22}
            radius="xl"
            color={person.color}
            variant="light"
            className="monosuite-room-turn-attention-avatar"
          >
            {person.initials}
          </Avatar>
        </Tooltip>
      ))}
      {hidden > 0 ? (
        <Avatar size={22} radius="xl" color="neutral" variant="outline">
          +{hidden}
        </Avatar>
      ) : null}
    </Group>
  );
}
