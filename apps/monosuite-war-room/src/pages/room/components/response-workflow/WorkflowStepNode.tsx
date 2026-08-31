import { Badge, Group, Indicator, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import {
  IconBellRinging,
  IconCheck,
  IconFilter,
  IconHeartbeat,
  IconSearch,
  IconShieldLock,
} from '@tabler/icons-react';
import type { WorkflowStep } from '../../data';

const ICONS = {
  bell: IconBellRinging,
  filter: IconFilter,
  search: IconSearch,
  shield: IconShieldLock,
  heartbeat: IconHeartbeat,
} as const;

const STATUS_LABEL: Record<WorkflowStep['status'], string> = {
  completed: 'DONE',
  current: 'ACTIVE',
  pending: 'QUEUED',
};

interface WorkflowStepNodeProps {
  step: WorkflowStep;
  stepNumber: number;
  selected?: boolean;
  onSelect?: () => void;
}

export function WorkflowStepNode({
  step,
  stepNumber,
  selected = false,
  onSelect,
}: WorkflowStepNodeProps) {
  const Icon = ICONS[step.icon];
  const isCurrent = step.status === 'current';
  const isDone = step.status === 'completed';

  return (
    <UnstyledButton
      onClick={onSelect}
      aria-current={isCurrent ? 'step' : undefined}
      aria-label={`${step.label}, ${STATUS_LABEL[step.status]}`}
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        borderRadius: 'var(--mantine-radius-sm)',
        background: isCurrent
          ? 'var(--mantine-color-teal-light)'
          : selected
            ? 'var(--monosuite-color-surface)'
            : 'transparent',
        opacity: step.status === 'pending' ? 0.55 : 1,
      }}
    >
      {isCurrent ? (
        <Stack gap={4} px={10} py={6} justify="center" h="100%">
          <Group gap={8} wrap="nowrap">
            <Text size="xs" c="dimmed" ff="monospace" fw={700}>
              {String(stepNumber).padStart(2, '0')}
            </Text>
            <ThemeIcon size={28} radius="md" variant="filled" color="teal">
              <Icon size={16} />
            </ThemeIcon>
            <Text size="sm" fw={700} lh={1.2} lineClamp={1} style={{ minWidth: 0 }}>
              {step.label}
            </Text>
          </Group>
          <Group gap={8} wrap="nowrap">
            <Indicator processing color="teal" size={6} offset={2}>
              <Badge size="xs" color="teal" variant="filled">
                {STATUS_LABEL.current}
              </Badge>
            </Indicator>
            <Text size="xs" c="dimmed" truncate>
              {step.owner}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              {step.time}
            </Text>
          </Group>
        </Stack>
      ) : (
        <Stack gap={4} px={6} py={6} align="center" justify="center" h="100%">
          <ThemeIcon
            size={26}
            radius="md"
            variant={isDone ? 'filled' : 'light'}
            color={isDone ? 'teal' : 'neutral'}
          >
            {isDone ? <IconCheck size={14} stroke={2.5} /> : <Icon size={14} />}
          </ThemeIcon>
          <Text size="xs" fw={600} ta="center" lineClamp={1} lh={1.2}>
            {step.label}
          </Text>
          <Badge size="xs" color={isDone ? 'teal' : 'neutral'} variant={isDone ? 'light' : 'outline'}>
            {STATUS_LABEL[step.status]}
          </Badge>
        </Stack>
      )}
    </UnstyledButton>
  );
}
