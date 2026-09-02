import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconDatabaseImport,
  IconLink,
  IconLock,
  IconNotes,
  IconPaperclip,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { formatBytes } from '@monosuite/utils';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';
import {
  hostnameFromUrl,
  SOURCE_STATUS_COLOR,
  sourceSyncStatusLabel,
  type EvidenceItem,
  type EvidenceKind,
} from '../data';
import { SourceRecordPreviewCard } from './SourceRecordPreviewCard';

interface EvidencePanelProps {
  items: EvidenceItem[];
  onAdd: (kind: EvidenceKind) => void;
  onRemove?: (id: string) => void;
}

type EvidenceFilter = 'all' | EvidenceKind;

const KIND_META: Record<
  EvidenceKind,
  { label: string; color: string; icon: typeof IconPaperclip }
> = {
  file: { label: 'File', color: 'teal', icon: IconPaperclip },
  link: { label: 'Link', color: 'accent', icon: IconLink },
  note: { label: 'Note', color: 'brand', icon: IconNotes },
  source: { label: 'Source', color: 'warning', icon: IconDatabaseImport },
};

const FILTERS: { value: EvidenceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'file', label: 'Files' },
  { value: 'source', label: 'Sources' },
  { value: 'link', label: 'Links' },
  { value: 'note', label: 'Notes' },
];

export function EvidencePanel({ items, onAdd, onRemove }: EvidencePanelProps) {
  const [filter, setFilter] = useState<EvidenceFilter>('all');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      file: items.filter((item) => item.kind === 'file').length,
      source: items.filter((item) => item.kind === 'source').length,
      link: items.filter((item) => item.kind === 'link').length,
      note: items.filter((item) => item.kind === 'note').length,
    }),
    [items],
  );

  const visible = filter === 'all' ? items : items.filter((item) => item.kind === filter);

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap">
        <Text fw={700} size="sm">
          Evidence{' '}
          <Text span c="dimmed" fw={400}>
            · {items.length}
          </Text>
        </Text>
        <Menu shadow="md" width={240} position="bottom-end">
          <Menu.Target>
            <Button size="compact-xs" variant="light" leftSection={<IconPlus size={12} />}>
              Add
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Add evidence</Menu.Label>
            <Menu.Item leftSection={<IconUpload size={16} />} onClick={() => onAdd('file')}>
              Upload file
            </Menu.Item>
            <Menu.Item leftSection={<IconDatabaseImport size={16} />} onClick={() => onAdd('source')}>
              Link source record
            </Menu.Item>
            <Menu.Item leftSection={<IconLink size={16} />} onClick={() => onAdd('link')}>
              Reference link
            </Menu.Item>
            <Menu.Item leftSection={<IconNotes size={16} />} onClick={() => onAdd('note')}>
              Evidence note
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

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
            <IconPaperclip size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600} ta="center">
            {items.length === 0 ? 'No evidence yet' : 'No evidence in this view'}
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            {items.length === 0
              ? 'Upload a file, link a source record, add a reference URL, or capture an investigator note.'
              : 'Try another filter, or add evidence of this type.'}
          </Text>
        </Stack>
      ) : (
        <Stack gap={6}>
          {visible.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              expanded={expandedNote === item.id}
              sourceExpanded={expandedSource === item.id}
              onToggleNote={() =>
                setExpandedNote((current) => (current === item.id ? null : item.id))
              }
              onToggleSource={() =>
                setExpandedSource((current) => (current === item.id ? null : item.id))
              }
              onRemove={onRemove}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function EvidenceCard({
  item,
  expanded,
  sourceExpanded,
  onToggleNote,
  onToggleSource,
  onRemove,
}: {
  item: EvidenceItem;
  expanded: boolean;
  sourceExpanded: boolean;
  onToggleNote: () => void;
  onToggleSource: () => void;
  onRemove?: (id: string) => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  if (item.kind === 'source' && item.source) {
    return (
      <SourceEvidenceCard
        item={item}
        meta={meta}
        expanded={sourceExpanded}
        onToggle={onToggleSource}
        onRemove={onRemove}
      />
    );
  }

  const subtitle = evidenceSubtitle(item);

  return (
    <Box
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        background: 'var(--monosuite-color-surface-sunken)',
        border: '1px solid var(--monosuite-color-border)',
      }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" color={meta.color} size="lg" style={{ flexShrink: 0 }}>
          <Icon size={16} />
        </ThemeIcon>
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" justify="space-between">
            {item.kind === 'link' && item.url ? (
              <Anchor
                href={item.url}
                target="_blank"
                rel="noreferrer"
                size="sm"
                fw={600}
                underline="hover"
                lineClamp={1}
                style={{ minWidth: 0, flex: 1 }}
              >
                {item.name}
              </Anchor>
            ) : item.kind === 'note' ? (
              <UnstyledButton
                onClick={onToggleNote}
                aria-expanded={expanded}
                style={{ flex: 1, minWidth: 0 }}
              >
                <TruncatedTooltipText size="sm" fw={600} tooltip={item.name}>
                  {item.name}
                </TruncatedTooltipText>
              </UnstyledButton>
            ) : (
              <TruncatedTooltipText size="sm" fw={600} tooltip={item.name}>
                {item.name}
              </TruncatedTooltipText>
            )}
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Badge size="xs" variant="light" color={meta.color} tt="uppercase">
                {meta.label}
              </Badge>
              {onRemove ? (
                <Tooltip label="Remove evidence">
                  <ActionIcon
                    variant="subtle"
                    color="danger"
                    size="sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onRemove(item.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
            </Group>
          </Group>
          <TruncatedTooltipText size="xs" c="dimmed" tooltip={subtitle}>
            {subtitle}
          </TruncatedTooltipText>
          {item.kind === 'note' && expanded && item.note ? (
            <Text
              size="xs"
              style={{
                padding: 'var(--mantine-spacing-xs)',
                borderRadius: 'var(--mantine-radius-sm)',
                background: 'var(--monosuite-color-surface)',
                border: '1px solid var(--monosuite-color-border)',
              }}
            >
              {item.note}
            </Text>
          ) : null}
        </Stack>
      </Group>
    </Box>
  );
}

function SourceEvidenceCard({
  item,
  meta,
  expanded,
  onToggle,
  onRemove,
}: {
  item: EvidenceItem;
  meta: (typeof KIND_META)['source'];
  expanded: boolean;
  onToggle: () => void;
  onRemove?: (id: string) => void;
}) {
  const source = item.source!;
  const syncColor = SOURCE_STATUS_COLOR[source.syncStatus];
  const Icon = meta.icon;
  const provenance = `${item.by} · ${item.time}`;

  return (
    <Box
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        background: 'var(--monosuite-color-surface-sunken)',
        border: '1px solid var(--monosuite-color-border)',
      }}
    >
      <Stack gap="sm">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color={meta.color} size="lg" style={{ flexShrink: 0 }}>
            <Icon size={16} />
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6} wrap="nowrap" justify="space-between" align="flex-start">
              <UnstyledButton onClick={onToggle} aria-expanded={expanded} style={{ flex: 1, minWidth: 0 }}>
                <TruncatedTooltipText size="sm" fw={600} tooltip={item.name}>
                  {item.name}
                </TruncatedTooltipText>
              </UnstyledButton>
              <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                <Badge size="xs" variant="light" color={meta.color} tt="uppercase">
                  {meta.label}
                </Badge>
                {onRemove ? (
                  <Tooltip label="Remove linked record">
                    <ActionIcon
                      variant="subtle"
                      color="danger"
                      size="sm"
                      aria-label={`Remove linked record ${source.recordId}`}
                      onClick={() => onRemove(item.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
              </Group>
            </Group>

            <Group gap={6} wrap="wrap">
              <Text size="xs" c="dimmed">
                {source.adapter} · {source.recordTypeLabel}
              </Text>
              <Text size="xs" ff="monospace" c="dimmed">
                Record ID · {source.recordId}
              </Text>
            </Group>

            <Group gap={4} wrap="wrap">
              <Badge
                size="xs"
                variant="light"
                color={syncColor}
                leftSection={<IconRefresh size={10} aria-hidden />}
              >
                {sourceSyncStatusLabel(source.syncStatus)}
              </Badge>
              {source.readOnly ? (
                <Badge
                  size="xs"
                  variant="light"
                  color="neutral"
                  leftSection={<IconLock size={10} aria-hidden />}
                >
                  Read-only
                </Badge>
              ) : null}
              <Text size="xs" c="dimmed">
                Synced {source.lastSync}
              </Text>
            </Group>

            <Text size="xs" c="dimmed">
              Linked by {provenance}
            </Text>
          </Stack>
        </Group>

        {expanded ? (
          <SourceRecordPreviewCard
            preview={{
              recordId: source.recordId,
              recordType: source.recordType,
              recordTypeLabel: source.recordTypeLabel,
              adapterId: source.adapterId,
              adapter: source.adapter,
              title: item.name,
              syncStatus: source.syncStatus,
              readOnly: source.readOnly,
              lastSync: source.lastSync,
              fields: source.fields,
            }}
            compact
          />
        ) : (
          <Button variant="subtle" color="neutral" size="compact-xs" onClick={onToggle}>
            Show record preview
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function evidenceSubtitle(item: EvidenceItem): string {
  const provenance = `${item.by} · ${item.time}`;
  if (item.kind === 'file') {
    const size = item.sizeBytes != null ? ` · ${formatBytes(item.sizeBytes)}` : '';
    return `${item.type}${size} · ${provenance}`;
  }
  if (item.kind === 'link') {
    return `${item.url ? hostnameFromUrl(item.url) : 'Link'} · ${provenance}`;
  }
  return provenance;
}
