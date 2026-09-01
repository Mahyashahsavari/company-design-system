import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Pill,
  PillsInput,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  INCIDENT,
  LINK_SOURCE_OPTIONS,
  MANUAL_LINK_SOURCE,
  type LinkedAlertEntry,
  type LinkedIncidentAlert,
} from '../data';

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

interface LinkedIncidentAlertEditorProps {
  rows: LinkedIncidentAlert[];
  onChange: (rows: LinkedIncidentAlert[]) => void;
}

function sourceOptions(rows: LinkedIncidentAlert[], currentSource: string) {
  const used = new Set(rows.map((row) => row.source).filter(Boolean));
  const names = INCIDENT.fromAdapter ? LINK_SOURCE_OPTIONS : [MANUAL_LINK_SOURCE];
  return names.map((name) => ({
    value: name,
    label: name,
    disabled: used.has(name) && name !== currentSource,
  }));
}

function emptyGroup(): LinkedIncidentAlert {
  return {
    id: nextId('link'),
    source: INCIDENT.fromAdapter ? '' : MANUAL_LINK_SOURCE,
    alerts: [],
  };
}

/** One adapter group with auto-discovered alerts plus manually added Incident IDs. */
export function LinkedIncidentAlertEditor({ rows, onChange }: LinkedIncidentAlertEditorProps) {
  const updateRow = (id: string, next: LinkedIncidentAlert) =>
    onChange(rows.map((row) => (row.id === id ? next : row)));

  return (
    <Stack gap="sm">
      <div>
        <Text fw={700} size="sm">
          Linked Incident/Alert
        </Text>
        <Text size="xs" c="dimmed">
          Auto-found IDs stay in the field and cannot be removed. You can still add more IDs to the
          same adapter.
        </Text>
      </div>
      <Stack gap="sm">
        {rows.map((row) => (
          <AdapterLinkRow
            key={row.id}
            row={row}
            sourceData={sourceOptions(rows, row.source)}
            onChange={(next) => updateRow(row.id, next)}
            onRemove={
              row.alerts.some((alert) => alert.fromAdapter)
                ? undefined
                : () => onChange(rows.filter((item) => item.id !== row.id))
            }
          />
        ))}
        <Button
          size="compact-xs"
          variant="subtle"
          color="teal"
          leftSection={<IconPlus size={14} />}
          onClick={() => onChange([...rows, emptyGroup()])}
          style={{ alignSelf: 'flex-start' }}
        >
          Add adapter
        </Button>
      </Stack>
    </Stack>
  );
}

function AdapterLinkRow({
  row,
  sourceData,
  onChange,
  onRemove,
}: {
  row: LinkedIncidentAlert;
  sourceData: { value: string; label: string; disabled: boolean }[];
  onChange: (row: LinkedIncidentAlert) => void;
  onRemove?: () => void;
}) {
  const [draft, setDraft] = useState('');
  const sourceLocked = row.alerts.some((alert) => alert.fromAdapter) || !INCIDENT.fromAdapter;
  const canAdd = Boolean(row.source);

  const addDraft = () => {
    const value = draft.trim();
    if (!value || !canAdd) return;
    const exists = row.alerts.some((alert) => alert.value.toLowerCase() === value.toLowerCase());
    if (!exists) {
      onChange({
        ...row,
        alerts: [...row.alerts, { id: nextId('alert'), value, fromAdapter: false }],
      });
    }
    setDraft('');
  };

  return (
    <Box
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--monosuite-color-border)',
        background: 'var(--monosuite-color-surface)',
      }}
    >
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <Select
            label="Adapter"
            placeholder="Select adapter"
            data={sourceData}
            value={row.source || null}
            disabled={sourceLocked}
            onChange={(value) => value && onChange({ ...row, source: value })}
            style={{ flex: 1, minWidth: 0 }}
          />
          {onRemove ? (
            <ActionIcon
              variant="subtle"
              color="danger"
              aria-label="Remove adapter"
              onClick={onRemove}
              mb={4}
            >
              <IconTrash size={16} />
            </ActionIcon>
          ) : null}
        </Group>

        <PillsInput
          label="Add incident or alert IDs"
          description="Type an ID and press Enter. Auto-found IDs stay locked in this field."
          disabled={!canAdd}
        >
          <Pill.Group>
            {row.alerts.map((alert) => (
              <Tooltip
                key={alert.id}
                label="Found by adapter — cannot remove"
                disabled={!alert.fromAdapter}
                withArrow
              >
                <Pill
                  withRemoveButton={!alert.fromAdapter}
                  onRemove={() =>
                    onChange({
                      ...row,
                      alerts: row.alerts.filter((item) => item.id !== alert.id),
                    })
                  }
                >
                  {alert.value}
                </Pill>
              </Tooltip>
            ))}
            <PillsInput.Field
              type="visible"
              aria-label="Add incident or alert ID"
              placeholder={
                !canAdd
                  ? 'Select an adapter first'
                  : row.alerts.length > 0
                    ? 'Add another ID'
                    : 'Type an ID, then press Enter'
              }
              disabled={!canAdd}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onBlur={addDraft}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  addDraft();
                  return;
                }
                if (event.key === 'Backspace' && draft.length === 0) {
                  const lastManual = [...row.alerts].reverse().find((item) => !item.fromAdapter);
                  if (lastManual) {
                    event.preventDefault();
                    onChange({
                      ...row,
                      alerts: row.alerts.filter((item) => item.id !== lastManual.id),
                    });
                  }
                }
              }}
            />
          </Pill.Group>
        </PillsInput>
      </Stack>
    </Box>
  );
}

function linkedGroups(rows: LinkedIncidentAlert[]) {
  return rows
    .map((row) => ({
      source: row.source || MANUAL_LINK_SOURCE,
      values: row.alerts
        .map((alert) => alert.value.trim())
        .filter((value) => value.length > 0),
    }))
    .filter((group) => group.values.length > 0);
}

interface LinkedIncidentAlertListProps {
  rows: LinkedIncidentAlert[];
}

/** Compact Attack Chain summary of linked alerts and manual incident IDs. */
export function LinkedIncidentAlertList({ rows }: LinkedIncidentAlertListProps) {
  const groups = linkedGroups(rows);

  if (groups.length === 0) {
    return (
      <Text size="xs" c="dimmed" className="monosuite-threat-rail-linked">
        No linked incident or alert.
      </Text>
    );
  }

  return (
    <Stack gap={6} className="monosuite-threat-rail-linked">
      <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
        Linked incident / alert
      </Text>
      <Stack
        gap={0}
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
          background: 'var(--monosuite-color-surface-sunken)',
          border: '1px solid var(--monosuite-color-border)',
        }}
      >
        {groups.map((group, index) => (
          <Box
            key={group.source}
            px="xs"
            py={4}
            style={
              index < groups.length - 1
                ? { borderBottom: '1px solid var(--monosuite-color-border)' }
                : undefined
            }
          >
            <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start" w="100%">
              <Text size="xs" c="dimmed" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {group.source}
              </Text>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }} align="flex-end">
                {group.values.map((value) => (
                  <Text key={value} size="xs" fw={600} ta="right" truncate title={value}>
                    {value}
                  </Text>
                ))}
              </Stack>
            </Group>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export function pruneLinkedAlerts(rows: LinkedIncidentAlert[]): LinkedIncidentAlert[] {
  return rows
    .map((row) => ({
      ...row,
      alerts: row.alerts.filter((alert) => alert.value.trim().length > 0) satisfies LinkedAlertEntry[],
    }))
    .filter((row) => row.source.trim().length > 0 && row.alerts.length > 0);
}
