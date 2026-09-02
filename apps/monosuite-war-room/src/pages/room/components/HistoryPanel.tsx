import { useMemo, useState } from 'react';
import { Badge, Button, Group, Stack, Text, ThemeIcon, Timeline } from '@mantine/core';
import {
  IconActivity,
  IconClipboardCheck,
  IconFileSearch,
  IconHistory,
  IconMap2,
  IconPaperclip,
  IconRoute,
  IconUserPlus,
} from '@tabler/icons-react';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';
import type { HistoryEntry } from '../data';

export type HistoryEventKind =
  | 'people'
  | 'evidence'
  | 'intel'
  | 'finding'
  | 'decision'
  | 'workflow'
  | 'system'
  | 'activity';

type HistoryFilter = 'all' | 'key' | 'people' | 'system';

const EVENT_META: Record<
  HistoryEventKind,
  { label: string; color: string; icon: typeof IconActivity }
> = {
  people: { label: 'People', color: 'teal', icon: IconUserPlus },
  evidence: { label: 'Evidence', color: 'accent', icon: IconPaperclip },
  intel: { label: 'Intel', color: 'brand', icon: IconMap2 },
  finding: { label: 'Finding', color: 'warning', icon: IconFileSearch },
  decision: { label: 'Decision', color: 'success', icon: IconClipboardCheck },
  workflow: { label: 'Workflow', color: 'teal', icon: IconRoute },
  system: { label: 'System', color: 'neutral', icon: IconActivity },
  activity: { label: 'Activity', color: 'teal', icon: IconActivity },
};

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'key', label: 'Key' },
  { value: 'people', label: 'People' },
  { value: 'system', label: 'System' },
];

export function classifyHistoryEntry(entry: HistoryEntry): HistoryEventKind {
  const action = entry.action.toLowerCase();
  const system = entry.actor.toLowerCase() === 'system';

  if (action.includes('joined') || action.includes('invited') || action.includes('removed')) {
    return 'people';
  }
  if (action.includes('evidence')) return 'evidence';
  if (action.includes('mitre') || action.includes('ioc')) return 'intel';
  if (action.includes('finding')) return 'finding';
  if (action.includes('decision')) return 'decision';
  if (action.includes('workflow')) return 'workflow';
  if (system) return 'system';
  if (entry.highlight) return 'finding';
  return 'activity';
}

function matchesFilter(entry: HistoryEntry, filter: HistoryFilter): boolean {
  const kind = classifyHistoryEntry(entry);
  if (filter === 'all') return true;
  if (filter === 'key') return entry.highlight || kind === 'finding' || kind === 'decision';
  if (filter === 'people') return kind === 'people';
  return kind === 'system' || kind === 'workflow';
}

interface HistoryPanelProps {
  items: HistoryEntry[];
}

export function HistoryPanel({ items }: HistoryPanelProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const counts = useMemo(
    () => ({
      all: items.length,
      key: items.filter((item) => matchesFilter(item, 'key')).length,
      people: items.filter((item) => matchesFilter(item, 'people')).length,
      system: items.filter((item) => matchesFilter(item, 'system')).length,
    }),
    [items],
  );

  const visible = filter === 'all' ? items : items.filter((item) => matchesFilter(item, filter));

  return (
    <Stack gap="sm">
      <Text fw={700} size="sm">
        Room activity{' '}
        <Text span c="dimmed" fw={400}>
          · {items.length}
        </Text>
      </Text>

      <Group gap={4} wrap="wrap">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            size="compact-xs"
            variant={filter === item.value ? 'light' : 'subtle'}
            color={filter === item.value ? 'teal' : 'neutral'}
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
          >
            {item.label} {counts[item.value]}
          </Button>
        ))}
      </Group>

      {visible.length === 0 ? (
        <Stack
          gap={6}
          align="center"
          py="md"
          px="sm"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            background: 'var(--monosuite-color-surface-sunken)',
          }}
        >
          <ThemeIcon variant="light" color="teal" size="lg">
            <IconHistory size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600} ta="center">
            {items.length === 0 ? 'No history yet' : 'No events in this view'}
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            {items.length === 0
              ? 'Room actions, decisions, and system updates will appear here.'
              : 'Try another filter to see more of the operational timeline.'}
          </Text>
        </Stack>
      ) : (
        <HistoryTimeline items={visible} density="panel" />
      )}
    </Stack>
  );
}

export function HistoryTimeline({
  items,
  density = 'panel',
}: {
  items: HistoryEntry[];
  density?: 'panel' | 'rail';
}) {
  const bulletSize = density === 'rail' ? 20 : 24;
  const iconSize = density === 'rail' ? 10 : 12;

  return (
    <Timeline active={0} bulletSize={bulletSize} lineWidth={2} color="teal">
      {items.map((entry, index) => {
        const kind = classifyHistoryEntry(entry);
        const meta = EVENT_META[kind];
        const Icon = meta.icon;
        const tooltip = `${entry.time} · ${entry.actor} ${entry.action}`;

        return (
          <Timeline.Item
            key={`${entry.time}-${entry.actor}-${entry.action}-${index}`}
            color={meta.color}
            bullet={
              <ThemeIcon
                size={bulletSize - 2}
                variant="light"
                color={meta.color}
                radius="xl"
                aria-hidden
              >
                <Icon size={iconSize} />
              </ThemeIcon>
            }
            title={
              density === 'panel' ? (
                <TruncatedTooltipText size="sm" fw={600} lh={1.35} tooltip={tooltip}>
                  {capitalizeAction(entry.action)}
                </TruncatedTooltipText>
              ) : (
                <Text size="xs" fw={entry.highlight ? 700 : 500} lh={1.35} lineClamp={2}>
                  <Text span fw={700}>
                    {entry.actor}
                  </Text>{' '}
                  {entry.action}
                </Text>
              )
            }
          >
            {density === 'panel' ? (
              <Stack gap={4}>
                <Group gap={6} wrap="nowrap">
                  <Text size="xs" c="dimmed" truncate>
                    {entry.actor}
                  </Text>
                  <Badge size="xs" variant="light" color={meta.color} tt="none">
                    {meta.label}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" ff="monospace">
                  {entry.time}
                </Text>
              </Stack>
            ) : (
              <Text size="10px" c="dimmed" ff="monospace">
                {entry.time}
              </Text>
            )}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}

function capitalizeAction(action: string): string {
  if (!action) return action;
  return action.charAt(0).toUpperCase() + action.slice(1);
}
