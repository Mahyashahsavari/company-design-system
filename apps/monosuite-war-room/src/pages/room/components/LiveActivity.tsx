import { Group, Stack, Text, Timeline } from '@mantine/core';
import { IconActivity } from '@tabler/icons-react';
import type { HistoryEntry } from '../data';

interface LiveActivityProps {
  history: HistoryEntry[];
}

export function LiveActivity({ history }: LiveActivityProps) {
  const items = history.slice(0, 8);

  return (
    <Stack
      gap="xs"
      p="sm"
      h="100%"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 6,
        background: 'var(--mantine-color-body)',
        minWidth: 200,
        maxWidth: 240,
      }}
    >
      <Group gap={6}>
        <IconActivity size={14} />
        <Text size="xs" fw={700}>
          Live Activity
        </Text>
      </Group>
      <Timeline active={0} bulletSize={16} lineWidth={2}>
        {items.map((h) => (
          <Timeline.Item
            key={`${h.time}-${h.action}`}
            title={
              <Text size="xs" fw={h.highlight ? 700 : 500}>
                {h.actor} {h.action}
              </Text>
            }
          >
            <Text size="xs" c="dimmed">
              {h.time}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  );
}
