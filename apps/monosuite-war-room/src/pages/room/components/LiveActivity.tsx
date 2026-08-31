import { Badge, Box, Group, ScrollArea, Stack, Text, Timeline } from '@mantine/core';
import {
  IconActivity,
  IconClipboardCheck,
  IconFileSearch,
  IconMap2,
  IconPaperclip,
  IconRoute,
  IconUserPlus,
} from '@tabler/icons-react';
import type { HistoryEntry } from '../data';

interface LiveActivityProps {
  history: HistoryEntry[];
  /** @deprecated Use variant instead */
  compact?: boolean;
  variant?: 'rail' | 'compact' | 'sidebar';
}

function activityIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes('joined')) return IconUserPlus;
  if (a.includes('sync')) return IconActivity;
  if (a.includes('mitre')) return IconMap2;
  if (a.includes('evidence')) return IconPaperclip;
  if (a.includes('finding')) return IconFileSearch;
  if (a.includes('decision')) return IconClipboardCheck;
  if (a.includes('workflow')) return IconRoute;
  return IconActivity;
}

/** Operational timeline — slides in as investigation activity rail. */
export function LiveActivity({ history, compact, variant }: LiveActivityProps) {
  const resolvedVariant = variant ?? (compact ? 'compact' : 'sidebar');
  const limit = resolvedVariant === 'rail' ? 24 : resolvedVariant === 'compact' ? 5 : 8;
  const items = history.slice(0, limit);

  if (resolvedVariant === 'rail') {
    return (
      <ScrollArea h="100%" type="hover" px="sm" py="sm">
        <Timeline active={0} bulletSize={20} lineWidth={2}>
          {items.map((h) => {
            const Icon = activityIcon(h.action);
            return (
              <Timeline.Item
                key={`${h.time}-${h.action}`}
                bullet={
                  <Box
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 'var(--mantine-radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: h.highlight
                        ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 16%, var(--monosuite-color-surface-sunken))'
                        : 'var(--monosuite-color-surface-sunken)',
                      border: `1px solid ${h.highlight ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 40%, var(--monosuite-color-border))' : 'var(--monosuite-color-border)'}`,
                    }}
                  >
                    <Icon size={10} />
                  </Box>
                }
                title={
                  <Text size="xs" fw={h.highlight ? 700 : 500} lh={1.35}>
                    <Text span fw={700}>
                      {h.actor}
                    </Text>{' '}
                    {h.action}
                  </Text>
                }
              >
                <Text size="10px" c="dimmed" ff="monospace">
                  {h.time}
                </Text>
              </Timeline.Item>
            );
          })}
        </Timeline>
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
        <Timeline active={0} bulletSize={18} lineWidth={2}>
          {items.map((h) => {
            const Icon = activityIcon(h.action);
            return (
              <Timeline.Item
                key={`${h.time}-${h.action}`}
                bullet={<Icon size={10} />}
                title={
                  <Text size="xs" fw={h.highlight ? 700 : 500} lineClamp={2}>
                    {h.actor} {h.action}
                  </Text>
                }
              >
                <Text size="xs" c="dimmed">
                  {h.time}
                </Text>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </ScrollArea>
    </Stack>
  );
}
