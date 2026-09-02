import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Badge,
  Collapse,
  Group,
  Menu,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconCheck, IconChevronDown, IconTarget, IconUser } from '@tabler/icons-react';
import {
  splitEntityFields,
  type ContextEntityField,
  type ThreatEntity,
  type ThreatEntityKind,
} from '../data';
import { ThreatRailNodeDot } from './IncidentAttackCard';
import { MetadataLabelValueRow } from './MetadataLabelValueRow';

interface ThreatEntityPanelProps {
  kind: ThreatEntityKind;
  entities: ThreatEntity[];
  selectedId: string;
  onSelect: (id: string) => void;
  railNode?: boolean;
  railCompact?: boolean;
  previewCount?: number;
}

const RAIL_PREVIEW_FIELDS = 2;
const COMPACT_CRITICAL_LIMIT = 3;

const KIND_UI = {
  attacker: {
    label: 'Attacker',
    subtitle: 'Threat origin',
    color: 'danger' as const,
    nodeTone: 'danger' as const,
    Icon: IconTarget,
    gradient: `linear-gradient(
      160deg,
      color-mix(in srgb, var(--mantine-color-danger-filled) 11%, var(--monosuite-color-surface)),
      var(--monosuite-color-surface)
    )`,
    border: 'color-mix(in srgb, var(--mantine-color-danger-filled) 30%, var(--monosuite-color-border))',
    accent: 'var(--mantine-color-danger-filled)',
  },
  victim: {
    label: 'Victim',
    subtitle: 'Impacted asset',
    color: 'teal' as const,
    nodeTone: 'teal' as const,
    Icon: IconUser,
    gradient: `linear-gradient(
      160deg,
      color-mix(in srgb, var(--mantine-color-teal-filled) 11%, var(--monosuite-color-surface)),
      var(--monosuite-color-surface)
    )`,
    border: 'color-mix(in srgb, var(--mantine-color-teal-filled) 30%, var(--monosuite-color-border))',
    accent: 'var(--mantine-color-teal-filled)',
  },
};

export function ThreatEntityPanel({
  kind,
  entities,
  selectedId,
  onSelect,
  railNode = false,
  railCompact = false,
  previewCount: previewCountProp,
}: ThreatEntityPanelProps) {
  const { ref, width } = useElementSize();
  const compact = width > 0 && width < 260;
  const ui = KIND_UI[kind];
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0];
  const selectedIndex = Math.max(
    0,
    entities.findIndex((entity) => entity.id === selected.id),
  );
  const multi = entities.length > 1;
  const { critical, secondary } = splitEntityFields(selected);
  const orderedFields = [...critical, ...secondary];
  const staticPreviewCount = railCompact ? RAIL_PREVIEW_FIELDS : COMPACT_CRITICAL_LIMIT;
  const previewCount = previewCountProp ?? staticPreviewCount;
  const previewFields = orderedFields.slice(0, previewCount);
  const moreFields = orderedFields.slice(previewCount);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [selected.id, compact, railCompact, previewCount]);

  const fieldBoxStyle = {
    borderRadius: 'var(--mantine-radius-sm)',
    background: 'var(--monosuite-color-surface-sunken)',
    border: '1px solid var(--monosuite-color-border)',
  };

  const fieldsSection =
    orderedFields.length > 0 ? (
      <Stack gap={6} className="monosuite-threat-rail-fields">
        <Stack gap={0} className="monosuite-threat-rail-field-table" style={fieldBoxStyle}>
          {previewFields.map((field, index) => (
            <Box
              key={field.label}
              px="xs"
              py={railCompact ? 4 : 5}
              style={
                index < previewFields.length - 1 || (moreOpen && moreFields.length > 0)
                  ? { borderBottom: '1px solid var(--monosuite-color-border)' }
                  : undefined
              }
            >
              <FieldRow field={field} />
            </Box>
          ))}
          {moreFields.length > 0 ? (
            <Collapse expanded={moreOpen}>
              {moreFields.map((field, index) => (
                <Box
                  key={field.label}
                  px="xs"
                  py={railCompact ? 4 : 5}
                  style={
                    index < moreFields.length - 1
                      ? { borderBottom: '1px solid var(--monosuite-color-border)' }
                      : undefined
                  }
                >
                  <FieldRow field={field} />
                </Box>
              ))}
            </Collapse>
          ) : null}
        </Stack>

        {moreFields.length > 0 ? (
          <Button
            size="compact-xs"
            variant="subtle"
            color={ui.color}
            onClick={() => setMoreOpen((open) => !open)}
            rightSection={
              <IconChevronDown
                size={12}
                style={{ transform: moreOpen ? 'rotate(180deg)' : undefined }}
              />
            }
          >
            {moreOpen ? 'Less' : `More (${moreFields.length})`}
          </Button>
        ) : null}
      </Stack>
    ) : null;

  const panel = (
    <Stack
      ref={ref}
      gap={railCompact ? 6 : 10}
      p={railCompact ? 'xs' : 'sm'}
      className="monosuite-threat-rail-card-body"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        background: ui.gradient,
        border: `1px solid ${ui.border}`,
        borderLeft: `3px solid ${ui.accent}`,
        boxShadow: 'var(--mantine-shadow-xs)',
        minWidth: 0,
      }}
    >
      <Group gap={6} wrap="nowrap" justify="space-between" style={{ flexShrink: 0 }}>
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size={railCompact ? 24 : 28}
            radius="sm"
            variant="light"
            color={ui.color}
            aria-hidden
          >
            <ui.Icon size={railCompact ? 13 : 15} />
          </ThemeIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="10px" fw={700} tt="uppercase" c={ui.color} style={{ letterSpacing: '0.1em' }}>
              {ui.label}
            </Text>
            <Text size="xs" c="dimmed">
              {ui.subtitle}
            </Text>
          </Stack>
        </Group>
        <Badge size="sm" variant="light" color={ui.color} style={{ flexShrink: 0 }}>
          {entities.length}
        </Badge>
      </Group>

      <EntitySwitcher
        kind={kind}
        entities={entities}
        selected={selected}
        selectedIndex={selectedIndex}
        multi={multi}
        accent={ui.color}
        compact={railCompact}
        menuWidth={width > 0 ? Math.max(200, width - 16) : 248}
        onSelect={onSelect}
      />

      {fieldsSection}
    </Stack>
  );

  if (!railNode) return panel;

  return (
    <Box className="monosuite-threat-rail-card" style={{ position: 'relative', paddingLeft: 28, paddingRight: 2 }}>
      <ThreatRailNodeDot tone={ui.nodeTone} />
      {panel}
    </Box>
  );
}

function EntitySwitcher({
  kind,
  entities,
  selected,
  selectedIndex,
  multi,
  accent,
  compact: railCompact = false,
  menuWidth,
  onSelect,
}: {
  kind: ThreatEntityKind;
  entities: ThreatEntity[];
  selected: ThreatEntity;
  selectedIndex: number;
  multi: boolean;
  accent: 'danger' | 'teal';
  compact?: boolean;
  menuWidth: number;
  onSelect: (id: string) => void;
}) {
  const positionLabel = `${selectedIndex + 1} / ${entities.length}`;
  const role = KIND_UI[kind].label.toLowerCase();

  if (!multi) {
    return <IdentifierBlock entity={selected} accent={accent} compact={railCompact} />;
  }

  return (
    <Menu position="bottom-start" width={menuWidth} shadow="md" withinPortal>
      <Menu.Target>
        <UnstyledButton
          w="100%"
          aria-label={`Select ${role}, ${selected.identifier}, ${positionLabel}`}
          aria-haspopup="listbox"
          style={{ minWidth: 0, borderRadius: 'var(--mantine-radius-sm)' }}
        >
          <IdentifierBlock
            entity={selected}
            accent={accent}
            compact={railCompact}
            trailing={
              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                <Text size="xs" c="dimmed" fw={600}>
                  {positionLabel}
                </Text>
                <IconChevronDown size={14} aria-hidden />
              </Group>
            }
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Select {role}</Menu.Label>
        {entities.map((entity, index) => {
          const isSelected = entity.id === selected.id;
          return (
            <Menu.Item
              key={entity.id}
              onClick={() => onSelect(entity.id)}
              aria-current={isSelected ? 'true' : undefined}
              leftSection={
                isSelected ? (
                  <IconCheck size={14} color={`var(--mantine-color-${accent}-filled)`} />
                ) : (
                  <span style={{ display: 'inline-block', width: 14 }} />
                )
              }
              rightSection={
                <Text size="xs" c="dimmed">
                  {index + 1}/{entities.length}
                </Text>
              }
            >
              <Text size="sm" fw={isSelected ? 700 : 500} truncate>
                {entity.identifier}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

function IdentifierBlock({
  entity,
  accent,
  compact = false,
  trailing,
}: {
  entity: ThreatEntity;
  accent: 'danger' | 'teal';
  compact?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      px={compact ? 8 : 10}
      py={compact ? 5 : 8}
      style={{
        minWidth: 0,
        borderRadius: 'var(--mantine-radius-sm)',
        background: 'var(--monosuite-color-surface)',
        border: `1px solid color-mix(in srgb, var(--mantine-color-${accent}-filled) 22%, var(--monosuite-color-border))`,
      }}
    >
      <Text
        size="sm"
        fw={700}
        truncate
        style={{ flex: 1, minWidth: 0, letterSpacing: '0.02em' }}
      >
        {entity.identifier}
      </Text>
      {trailing}
    </Group>
  );
}

function FieldRow({ field }: { field: ContextEntityField }) {
  return <MetadataLabelValueRow label={field.label} value={field.value} />;
}
