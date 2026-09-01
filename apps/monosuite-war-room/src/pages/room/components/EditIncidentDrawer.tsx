import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCalendar,
  IconPlus,
  IconTarget,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import {
  ATTACKER_ENTITIES,
  CUSTOM_FIELD_KEYS,
  CUSTOM_FIELD_VALUE_TYPES,
  INCIDENT,
  KILL_CHAIN_OPTIONS,
  MITRE_MAP,
  PRESSURE_OPTIONS,
  ROOM_SEVERITY_OPTIONS,
  VICTIM_ENTITIES,
  type ContextEntityField,
  type LinkedIncidentAlert,
  type ThreatEntity,
} from '../data';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import { LinkedIncidentAlertEditor, pruneLinkedAlerts } from './LinkedIncidentAlertEditor';

interface EditIncidentDrawerProps {
  opened: boolean;
  onClose: () => void;
  linkedAlerts: LinkedIncidentAlert[];
  onSave: (linkedAlerts: LinkedIncidentAlert[]) => void;
}

interface CustomFieldRow {
  id: string;
  key: string;
  valueType: string;
  value: string;
  fromAdapter: boolean;
}

interface EntityDraft {
  id: string;
  address: string;
  fromAdapter: boolean;
  fields: CustomFieldRow[];
}

const TACTIC_OPTIONS = [
  { value: 'credential-access', label: 'Credential Access' },
  { value: 'initial-access', label: 'Initial Access' },
  { value: 'lateral-movement', label: 'Lateral Movement' },
];

const KIND_UI = {
  attacker: {
    label: 'Attacker',
    description:
      'Each attacker has an address and its own fields. Adapter records stay read-only; you can add more attackers and extra fields.',
    addLabel: 'Add attacker',
    addressLabel: 'Attacker address',
    Icon: IconTarget,
    color: 'danger' as const,
  },
  victim: {
    label: 'Victim',
    description:
      'Each victim has an address and its own fields. Adapter records stay read-only; you can add more victims and extra fields.',
    addLabel: 'Add victim',
    addressLabel: 'Victim address',
    Icon: IconUser,
    color: 'teal' as const,
  },
};

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugFieldKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function inferValueType(field: ContextEntityField): string {
  if (/ip/i.test(field.label)) return 'IP';
  if (/reputation|\/\s*100/i.test(`${field.label} ${field.value}`)) return 'Number';
  return 'String';
}

function seedEntities(entities: ThreatEntity[], fromAdapter: boolean): EntityDraft[] {
  return entities.map((entity) => ({
    id: entity.id,
    address: entity.identifier,
    fromAdapter,
    fields: entity.fields
      .filter((field) => field.value.trim().length > 0)
      .map((field) => ({
        id: `${entity.id}-${slugFieldKey(field.label)}`,
        key: slugFieldKey(field.label),
        valueType: inferValueType(field),
        value: field.value,
        fromAdapter,
      })),
  }));
}

function emptyEntity(kind: 'attacker' | 'victim'): EntityDraft {
  return {
    id: nextId(kind === 'attacker' ? 'att' : 'vic'),
    address: '',
    fromAdapter: false,
    fields: [],
  };
}

function incidentFormSnapshot(value: {
  scenario: string;
  killChain: string | null;
  severity: string | null;
  tactic: string | null;
  technique: string | null;
  subtechnique: string | null;
  pressure: string | null;
  occurredAt: string;
  detectedAt: string;
  linkedRows: LinkedIncidentAlert[];
  attackers: EntityDraft[];
  victims: EntityDraft[];
}) {
  return JSON.stringify(value);
}

export function EditIncidentDrawer({ opened, onClose, linkedAlerts, onSave }: EditIncidentDrawerProps) {
  const mappedLocked = INCIDENT.fromAdapter;

  const [scenario, setScenario] = useState(INCIDENT.scenario);
  const [killChain, setKillChain] = useState<string | null>(INCIDENT.killChain);
  const [severity, setSeverity] = useState<string | null>(INCIDENT.severity);
  const [tactic, setTactic] = useState<string | null>('credential-access');
  const [technique, setTechnique] = useState<string | null>('valid-accounts');
  const [subtechnique, setSubtechnique] = useState<string | null>('domain-accounts');
  const [pressure, setPressure] = useState<string | null>('Medium');
  const [occurredAt, setOccurredAt] = useState('2026-08-24T21:42');
  const [detectedAt, setDetectedAt] = useState('2026-08-24T21:47');
  const [entityTab, setEntityTab] = useState<string | null>('victim');
  const [linkedRows, setLinkedRows] = useState<LinkedIncidentAlert[]>(linkedAlerts);
  const [attackers, setAttackers] = useState<EntityDraft[]>(() =>
    seedEntities(ATTACKER_ENTITIES, mappedLocked),
  );
  const [victims, setVictims] = useState<EntityDraft[]>(() =>
    seedEntities(VICTIM_ENTITIES, mappedLocked),
  );
  const [baseline, setBaseline] = useState('');

  useEffect(() => {
    if (!opened) return;
    const nextAttackers = seedEntities(ATTACKER_ENTITIES, mappedLocked);
    const nextVictims = seedEntities(VICTIM_ENTITIES, mappedLocked);
    const next = {
      scenario: INCIDENT.scenario,
      killChain: INCIDENT.killChain,
      severity: INCIDENT.severity,
      tactic: 'credential-access' as string | null,
      technique: 'valid-accounts' as string | null,
      subtechnique: 'domain-accounts' as string | null,
      pressure: 'Medium' as string | null,
      occurredAt: '2026-08-24T21:42',
      detectedAt: '2026-08-24T21:47',
      linkedRows: linkedAlerts,
      attackers: nextAttackers,
      victims: nextVictims,
    };
    setScenario(next.scenario);
    setKillChain(next.killChain);
    setSeverity(next.severity);
    setTactic(next.tactic);
    setTechnique(next.technique);
    setSubtechnique(next.subtechnique);
    setPressure(next.pressure);
    setOccurredAt(next.occurredAt);
    setDetectedAt(next.detectedAt);
    setEntityTab('victim');
    setLinkedRows(next.linkedRows);
    setAttackers(next.attackers);
    setVictims(next.victims);
    setBaseline(incidentFormSnapshot(next));
  }, [opened, mappedLocked, linkedAlerts]);

  const techniqueOptions = useMemo(() => {
    if (!tactic || !MITRE_MAP[tactic]) return [];
    return Object.entries(MITRE_MAP[tactic].techniques).map(([value, item]) => ({
      value,
      label: item.label,
    }));
  }, [tactic]);

  const subtechniqueOptions = useMemo(() => {
    if (!tactic || !technique || !MITRE_MAP[tactic]?.techniques[technique]) return [];
    return Object.entries(MITRE_MAP[tactic].techniques[technique].subtechniques).map(
      ([value, label]) => ({ value, label }),
    );
  }, [tactic, technique]);

  const dirty =
    Boolean(baseline) &&
    incidentFormSnapshot({
      scenario,
      killChain,
      severity,
      tactic,
      technique,
      subtechnique,
      pressure,
      occurredAt,
      detectedAt,
      linkedRows,
      attackers,
      victims,
    }) !== baseline;
  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(opened, dirty, onClose);

  return (
    <>
    <Drawer
      opened={opened}
      onClose={requestClose}
      title="Edit Incident"
      position="right"
      size="xl"
      padding={0}
      data-testid="edit-incident-drawer"
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        header: {
          padding: 'var(--mantine-spacing-md)',
          borderBottom: '1px solid var(--monosuite-color-border)',
        },
        body: {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        },
      }}
    >
      <ScrollArea style={{ flex: 1 }} type="auto" px="md" py="md">
        <Stack gap="lg">
          {mappedLocked ? (
            <Alert color="teal" variant="light" title={`From adapter · ${INCIDENT.source}`}>
              Mapped incident fields are read-only. You can still add attackers or victims, and extra
              fields on each record.
            </Alert>
          ) : null}

          <Stack gap="sm">
            <TextInput
              label="Incident scenario"
              placeholder="Not mapped yet"
              required
              readOnly={mappedLocked}
              value={scenario}
              onChange={(event) => setScenario(event.currentTarget.value)}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Select
                label="Cyber Attack Kill Chain"
                placeholder="Pick one"
                required
                disabled={mappedLocked}
                data={KILL_CHAIN_OPTIONS}
                value={killChain}
                onChange={setKillChain}
              />
              <Select
                label="Incident Severity"
                placeholder="Pick one"
                required
                disabled={mappedLocked}
                data={[...ROOM_SEVERITY_OPTIONS]}
                value={severity}
                onChange={setSeverity}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap={6}>
            <Text fw={700} size="sm">
              MITRE ATT&CK Mapping
            </Text>
            <Text size="xs" c="dimmed">
              Map the incident to the relevant MITRE ATT&CK tactic, technique, and sub-technique.
              Select a tactic first to see the corresponding techniques and sub-techniques.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Select
                label="Tactic"
                placeholder="Search & Select tactic"
                required
                searchable={!mappedLocked}
                disabled={mappedLocked}
                data={TACTIC_OPTIONS}
                value={tactic}
                onChange={(value) => {
                  setTactic(value);
                  setTechnique(null);
                  setSubtechnique(null);
                  setPressure(null);
                }}
              />
              <Select
                label="Technique"
                placeholder="Select a tactic first"
                required
                searchable={!mappedLocked}
                disabled={mappedLocked || !tactic}
                data={techniqueOptions}
                value={technique}
                onChange={(value) => {
                  setTechnique(value);
                  setSubtechnique(null);
                  setPressure(null);
                }}
              />
              <Select
                label="Sub-technique"
                placeholder="Select a technique first"
                required
                searchable={!mappedLocked}
                disabled={mappedLocked || !technique}
                data={subtechniqueOptions}
                value={subtechnique}
                onChange={setSubtechnique}
              />
              <Select
                label="Pressure (Optional)"
                placeholder="Select pressure"
                disabled={mappedLocked}
                data={PRESSURE_OPTIONS}
                value={pressure}
                onChange={setPressure}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap={6}>
            <Text fw={700} size="sm">
              Timing Incident
            </Text>
            <Text size="xs" c="dimmed">
              Specify when the incident occurred and when it was detected or identified.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Incident Occur Time"
                type="datetime-local"
                required
                readOnly={mappedLocked}
                disabled={mappedLocked}
                leftSection={<IconCalendar size={16} />}
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.currentTarget.value)}
              />
              <TextInput
                label="Incident Detection Time"
                type="datetime-local"
                required
                readOnly={mappedLocked}
                disabled={mappedLocked}
                leftSection={<IconCalendar size={16} />}
                value={detectedAt}
                onChange={(event) => setDetectedAt(event.currentTarget.value)}
              />
            </SimpleGrid>
          </Stack>

          <LinkedIncidentAlertEditor rows={linkedRows} onChange={setLinkedRows} />

          <Tabs value={entityTab} onChange={setEntityTab}>
            <Tabs.List>
              <Tabs.Tab value="victim" leftSection={<IconUser size={16} />}>
                <Group gap={6} wrap="nowrap">
                  Victim
                  <Badge size="xs" variant="light" color="teal" circle>
                    {victims.length}
                  </Badge>
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="attacker" leftSection={<IconTarget size={16} />}>
                <Group gap={6} wrap="nowrap">
                  Attacker
                  <Badge size="xs" variant="light" color="danger" circle>
                    {attackers.length}
                  </Badge>
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="victim" pt="md">
              <EntityKindEditor kind="victim" entities={victims} onChange={setVictims} />
            </Tabs.Panel>

            <Tabs.Panel value="attacker" pt="md">
              <EntityKindEditor kind="attacker" entities={attackers} onChange={setAttackers} />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </ScrollArea>

      <Group
        justify="flex-end"
        gap="sm"
        px="md"
        py="sm"
        style={{
          borderTop: '1px solid var(--monosuite-color-border)',
          background: 'var(--monosuite-color-surface)',
        }}
      >
        <Button
          onClick={() => {
            onSave(pruneLinkedAlerts(linkedRows));
            onClose();
          }}
        >
          Save
        </Button>
        <Button variant="default" onClick={requestClose}>
          Cancel
        </Button>
      </Group>
    </Drawer>
    <DiscardChangesModal opened={confirming} onKeepEditing={keepEditing} onDiscard={discard} />
    </>
  );
}

function EntityKindEditor({
  kind,
  entities,
  onChange,
}: {
  kind: 'attacker' | 'victim';
  entities: EntityDraft[];
  onChange: (entities: EntityDraft[]) => void;
}) {
  const ui = KIND_UI[kind];

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        {ui.description}
      </Text>

      {entities.length === 0 ? (
        <Box
          p="md"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px dashed var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface-sunken)',
          }}
        >
          <Text size="sm" c="dimmed">
            No {ui.label.toLowerCase()}s yet. Add the first {ui.label.toLowerCase()} to map an
            address and fields.
          </Text>
        </Box>
      ) : (
        entities.map((entity, index) => (
          <EntityCard
            key={entity.id}
            kind={kind}
            index={index}
            entity={entity}
            canRemove={!entity.fromAdapter}
            onChange={(next) =>
              onChange(entities.map((item) => (item.id === entity.id ? next : item)))
            }
            onRemove={() => onChange(entities.filter((item) => item.id !== entity.id))}
          />
        ))
      )}

      <Button
        variant="light"
        color={ui.color}
        leftSection={<IconPlus size={16} />}
        onClick={() => onChange([...entities, emptyEntity(kind)])}
        style={{ alignSelf: 'flex-start' }}
      >
        {ui.addLabel}
      </Button>
    </Stack>
  );
}

function EntityCard({
  kind,
  index,
  entity,
  canRemove,
  onChange,
  onRemove,
}: {
  kind: 'attacker' | 'victim';
  index: number;
  entity: EntityDraft;
  canRemove: boolean;
  onChange: (entity: EntityDraft) => void;
  onRemove: () => void;
}) {
  const ui = KIND_UI[kind];
  const Icon = ui.Icon;
  const title = `${ui.label} ${index + 1}`;

  return (
    <Box
      p="sm"
      data-testid={`${kind}-card`}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--monosuite-color-surface)',
        border: `1px solid color-mix(in srgb, var(--mantine-color-${ui.color}-filled) 28%, var(--monosuite-color-border))`,
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={28} radius="sm" variant="light" color={ui.color}>
              <Icon size={14} />
            </ThemeIcon>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" fw={700}>
                {title}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {entity.address || 'No address yet'}
              </Text>
            </Stack>
          </Group>
          <Group gap={6} wrap="nowrap">
            {entity.fromAdapter ? (
              <Badge size="xs" variant="light" color="teal">
                Adapter
              </Badge>
            ) : (
              <Badge size="xs" variant="light" color="neutral">
                Manual
              </Badge>
            )}
            {canRemove ? (
              <ActionIcon
                variant="subtle"
                color="danger"
                aria-label={`Remove ${title.toLowerCase()}`}
                onClick={onRemove}
              >
                <IconTrash size={16} />
              </ActionIcon>
            ) : null}
          </Group>
        </Group>

        <TextInput
          label={ui.addressLabel}
          placeholder="Enter IP or FQDN address"
          required
          readOnly={entity.fromAdapter}
          value={entity.address}
          onChange={(event) => onChange({ ...entity, address: event.currentTarget.value })}
        />

        <CustomFieldList
          rows={entity.fields}
          onChange={(fields) => onChange({ ...entity, fields })}
        />
      </Stack>
    </Box>
  );
}

function CustomFieldList({
  rows,
  onChange,
}: {
  rows: CustomFieldRow[];
  onChange: (rows: CustomFieldRow[]) => void;
}) {
  const fieldData = useMemo(() => {
    const extras = rows
      .filter((row) => row.key && !CUSTOM_FIELD_KEYS.some((option) => option.value === row.key))
      .map((row) => ({ value: row.key, label: row.key }));
    return [...CUSTOM_FIELD_KEYS, ...extras];
  }, [rows]);

  return (
    <Stack gap={8}>
      <Text size="sm" fw={600}>
        Custom fields
      </Text>
      {rows.length === 0 ? (
        <Text size="xs" c="dimmed">
          No fields yet. Add a field to capture extra context for this record.
        </Text>
      ) : (
        rows.map((row, index) => (
          <Group key={row.id} gap="xs" wrap="nowrap" align="flex-end">
            <Select
              label={index === 0 ? 'Field' : undefined}
              placeholder="Field"
              data={fieldData}
              searchable={!row.fromAdapter}
              disabled={row.fromAdapter}
              value={row.key || null}
              onChange={(value) =>
                onChange(
                  rows.map((item) => (item.id === row.id ? { ...item, key: value ?? '' } : item)),
                )
              }
              style={{ flex: 1, minWidth: 0 }}
            />
            <Select
              label={index === 0 ? 'Value type' : undefined}
              placeholder="Type"
              data={CUSTOM_FIELD_VALUE_TYPES}
              disabled={row.fromAdapter}
              value={row.valueType}
              onChange={(value) =>
                value &&
                onChange(
                  rows.map((item) => (item.id === row.id ? { ...item, valueType: value } : item)),
                )
              }
              style={{ width: 110, flexShrink: 0 }}
            />
            <TextInput
              label={index === 0 ? 'Value' : undefined}
              placeholder="Value"
              readOnly={row.fromAdapter}
              disabled={row.fromAdapter}
              value={row.value}
              onChange={(event) =>
                onChange(
                  rows.map((item) =>
                    item.id === row.id ? { ...item, value: event.currentTarget.value } : item,
                  ),
                )
              }
              style={{ flex: 1.2, minWidth: 0 }}
            />
            {!row.fromAdapter ? (
              <ActionIcon
                variant="subtle"
                color="danger"
                aria-label="Remove custom field"
                onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
              >
                <IconTrash size={16} />
              </ActionIcon>
            ) : (
              <Box w={28} style={{ flexShrink: 0 }} aria-hidden />
            )}
          </Group>
        ))
      )}
      <Button
        size="compact-xs"
        variant="subtle"
        color="teal"
        leftSection={<IconPlus size={14} />}
        onClick={() =>
          onChange([
            ...rows,
            {
              id: nextId('field'),
              key: '',
              valueType: 'String',
              value: '',
              fromAdapter: false,
            },
          ])
        }
        style={{ alignSelf: 'flex-start' }}
      >
        Add field
      </Button>
    </Stack>
  );
}
