import { Badge, Group, Indicator, Stack, Text, ThemeIcon } from '@mantine/core';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import {
  IconBellRinging,
  IconCheck,
  IconFilter,
  IconHeartbeat,
  IconSearch,
  IconShieldLock,
} from '@tabler/icons-react';
import type { WorkflowNodeData } from './types';

const ICONS = {
  bell: IconBellRinging,
  filter: IconFilter,
  search: IconSearch,
  shield: IconShieldLock,
  heartbeat: IconHeartbeat,
} as const;

const STATUS_LABEL: Record<WorkflowNodeData['status'], string> = {
  completed: 'DONE',
  current: 'ACTIVE',
  pending: 'QUEUED',
};

export function WorkflowStepNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  const Icon = ICONS[data.icon];
  const isCurrent = data.status === 'current';
  const isDone = data.status === 'completed';
  const isPending = data.status === 'pending';

  const borderColor = isCurrent
    ? 'var(--mantine-color-teal-filled)'
    : isDone
      ? 'var(--mantine-color-teal-light-color)'
      : 'var(--mantine-color-default-border)';

  const background = isCurrent
    ? 'linear-gradient(135deg, var(--mantine-color-teal-light) 0%, var(--mantine-color-body) 70%)'
    : isDone
      ? 'var(--mantine-color-body)'
      : 'var(--monosuite-color-surface-sunken)';

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          background: isPending
            ? 'var(--mantine-color-default-border)'
            : 'var(--mantine-color-teal-filled)',
          border: '2px solid var(--mantine-color-body)',
        }}
      />

      <Stack
        gap={8}
        p="sm"
        style={{
          width: 196,
          borderRadius: 8,
          border: `1px solid ${borderColor}`,
          borderLeft: `3px solid ${
            isCurrent
              ? 'var(--mantine-color-teal-filled)'
              : isDone
                ? 'var(--mantine-color-teal-light-color)'
                : 'var(--mantine-color-default-border)'
          }`,
          background,
          boxShadow: isCurrent
            ? '0 0 0 1px color-mix(in srgb, var(--mantine-color-teal-filled) 20%, transparent), 0 8px 20px color-mix(in srgb, var(--mantine-color-teal-filled) 12%, transparent)'
            : 'var(--mantine-shadow-xs)',
          opacity: isPending ? 0.78 : 1,
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap={6}>
          <Text
            size="xs"
            ff="monospace"
            c="dimmed"
            fw={700}
            style={{ letterSpacing: '0.08em' }}
          >
            STEP {String(data.stepNumber).padStart(2, '0')}
          </Text>
          {isCurrent ? (
            <Indicator processing color="teal" size={7} offset={2}>
              <Badge size="xs" color="teal" variant="filled" radius="sm">
                {STATUS_LABEL.current}
              </Badge>
            </Indicator>
          ) : (
            <Badge
              size="xs"
              color={isDone ? 'teal' : 'neutral'}
              variant={isDone ? 'light' : 'outline'}
              radius="sm"
            >
              {STATUS_LABEL[data.status]}
            </Badge>
          )}
        </Group>

        <Group gap={10} wrap="nowrap" align="flex-start">
          <ThemeIcon
            size={34}
            radius="md"
            variant={isDone ? 'filled' : isCurrent ? 'light' : 'default'}
            color={isDone || isCurrent ? 'teal' : 'neutral'}
            style={{
              flexShrink: 0,
              boxShadow: isCurrent
                ? '0 0 12px color-mix(in srgb, var(--mantine-color-teal-filled) 35%, transparent)'
                : undefined,
            }}
          >
            {isDone ? <IconCheck size={18} stroke={2.5} /> : <Icon size={18} />}
          </ThemeIcon>

          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Text size="sm" fw={700} lh={1.25} lineClamp={2}>
              {data.label}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {data.owner}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              {data.time}
            </Text>
          </Stack>
        </Group>
      </Stack>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          background:
            isDone || isCurrent
              ? 'var(--mantine-color-teal-filled)'
              : 'var(--mantine-color-default-border)',
          border: '2px solid var(--mantine-color-body)',
        }}
      />
    </>
  );
}
