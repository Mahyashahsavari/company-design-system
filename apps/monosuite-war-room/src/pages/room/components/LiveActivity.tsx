import { Badge, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { IconActivity } from '@tabler/icons-react';
import type { HistoryEntry } from '../data';
import { HistoryTimeline } from './HistoryPanel';

interface LiveActivityProps {
  history: HistoryEntry[];
  /** @deprecated Use variant instead */
  compact?: boolean;
  variant?: 'rail' | 'compact' | 'sidebar';
}

/** Operational timeline — slides in as investigation activity rail. */
export function LiveActivity({ history, compact, variant }: LiveActivityProps) {
  const resolvedVariant = variant ?? (compact ? 'compact' : 'sidebar');
  const limit = resolvedVariant === 'rail' ? 24 : resolvedVariant === 'compact' ? 5 : 8;
  const items = history.slice(0, limit);

  if (resolvedVariant === 'rail') {
    return (
      <ScrollArea h="100%" type="hover" px="sm" py="sm">
        {items.length === 0 ? (
          <Text size="xs" c="dimmed">
            No activity yet
          </Text>
        ) : (
          <HistoryTimeline items={items} density="rail" />
        )}
      </ScrollArea>
    );
  }

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        background: 'var(--monosuite-color-surface-sunken)',
        minWidth: resolvedVariant === 'compact' ? 168 : 200,
        maxWidth: resolvedVariant === 'compact' ? 200 : 240,
        height: '100%',
        minHeight: 0,
      }}
    >
      <Group gap={6} justify="space-between">
        <Group gap={6}>
          <IconActivity size={14} />
          <Text size="xs" fw={700}>
            Live Activity
          </Text>
        </Group>
        <Badge size="xs" color="success" variant="dot">
          Live
        </Badge>
      </Group>
      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="hover">
        <HistoryTimeline items={items} density="rail" />
      </ScrollArea>
    </Stack>
  );
}
