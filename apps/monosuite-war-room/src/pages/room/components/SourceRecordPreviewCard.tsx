import { Badge, Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconLock, IconRefresh } from '@tabler/icons-react';
import {
  SOURCE_STATUS_COLOR,
  sourceSyncStatusLabel,
  type SourceRecordPreview,
} from '../data';

interface SourceRecordPreviewCardProps {
  preview: SourceRecordPreview;
  compact?: boolean;
}

/** Read-only preview of an adapter record before linking or in evidence list. */
export function SourceRecordPreviewCard({ preview, compact = false }: SourceRecordPreviewCardProps) {
  const syncColor = SOURCE_STATUS_COLOR[preview.syncStatus];
  const visibleFields = compact ? preview.fields.slice(0, 4) : preview.fields;

  return (
    <Box
      p={compact ? 'sm' : 'md'}
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        border: '1px solid var(--monosuite-color-border)',
        background: 'var(--monosuite-color-surface-sunken)',
      }}
    >
      <Stack gap={compact ? 8 : 'sm'}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.04em' }}>
              {preview.adapter} · {preview.recordTypeLabel}
            </Text>
            <Text size={compact ? 'sm' : 'md'} fw={700} lineClamp={2}>
              {preview.title}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              Record ID · {preview.recordId}
            </Text>
          </Stack>
          <Group gap={4} wrap="wrap" justify="flex-end" style={{ flexShrink: 0, maxWidth: 168 }}>
            <Badge
              size="xs"
              variant="light"
              color={syncColor}
              leftSection={<IconRefresh size={10} aria-hidden />}
            >
              {sourceSyncStatusLabel(preview.syncStatus)}
            </Badge>
            {preview.readOnly ? (
              <Badge
                size="xs"
                variant="light"
                color="neutral"
                leftSection={<IconLock size={10} aria-hidden />}
              >
                Read-only
              </Badge>
            ) : null}
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: compact ? 1 : 2 }} spacing={compact ? 6 : 'xs'}>
          {visibleFields.map((field) => (
            <Stack key={field.label} gap={2}>
              <Text size="10px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.03em' }}>
                {field.label}
              </Text>
              <Text size="xs" fw={500} lineClamp={2}>
                {field.value}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>

        {!compact ? (
          <Text size="xs" c="dimmed">
            Last synced {preview.lastSync}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
