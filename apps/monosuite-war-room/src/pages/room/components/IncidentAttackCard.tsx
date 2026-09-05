import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowDown,
  IconChevronDown,
  IconPencil,
  IconRadar2,
  IconShield,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { LinkedIncidentAlert } from '../data';
import { useRoomIncident } from '../RoomScenarioContext';
import { SeverityIcon, severityColor } from '../severity';
import { LinkedIncidentAlertList } from './LinkedIncidentAlertEditor';
import { MetadataLabelValueRow } from './MetadataLabelValueRow';

interface IncidentAttackCardProps {
  compact?: boolean;
  previewCount?: number;
  linkedAlerts?: LinkedIncidentAlert[];
}

export const INCIDENT_FIELD_COUNT = 5;

function FieldTable({
  fields,
}: {
  fields: readonly { label: string; value: string }[];
}) {
  if (fields.length === 0) return null;

  return (
    <Stack
      gap={0}
      className="monosuite-threat-rail-fields monosuite-threat-rail-field-table"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        background: 'var(--monosuite-color-surface-sunken)',
        border: '1px solid var(--monosuite-color-border)',
      }}
    >
      {fields.map((field, index) => (
        <Box
          key={field.label}
          px="xs"
          py={4}
          style={
            index < fields.length - 1
              ? { borderBottom: '1px solid var(--monosuite-color-border)' }
              : undefined
          }
        >
          <MetadataLabelValueRow label={field.label} value={field.value} />
        </Box>
      ))}
    </Stack>
  );
}

/** Incident / attack hub — focal node in the threat chain rail. */
export function IncidentAttackCard({
  compact = false,
  previewCount: previewCountProp,
  linkedAlerts = [],
}: IncidentAttackCardProps) {
  const incident = useRoomIncident();
  const incidentFields = [
    { label: 'Threat actor', value: incident.threatActor },
    { label: 'Tactic', value: incident.mitreTactic },
    { label: 'Source', value: incident.source },
    { label: 'Occurred', value: incident.occurred },
    { label: 'Detected', value: incident.detected },
  ] as const;
  const [expanded, setExpanded] = useState(false);
  const staticPreviewCount = compact ? 2 : incidentFields.length;
  const previewCount = previewCountProp ?? staticPreviewCount;
  const previewFields = incidentFields.slice(0, previewCount);
  const moreFields = incidentFields.slice(previewCount);
  const hasMore = moreFields.length > 0;

  useEffect(() => {
    setExpanded(false);
  }, [previewCount]);

  const summary = (
    <Stack gap={6} style={{ minWidth: 0 }}>
      <Group gap={6} wrap="wrap">
        <Badge size="xs" variant="outline" color="neutral" radius="sm">
          {incident.id}
        </Badge>
      </Group>

      <Text size="sm" fw={700} lh={1.3} lineClamp={compact ? 2 : undefined}>
        {incident.title}
      </Text>

      <Group gap={6} wrap="nowrap" align="flex-start">
        <Badge size="sm" variant="light" color="accent" radius="sm">
          {incident.mitreId}
        </Badge>
        <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 0 }} lineClamp={2}>
          {incident.mitreTechnique} · {incident.source}
        </Text>
      </Group>
    </Stack>
  );

  const moreDetails = (
    <Stack gap={0}>
      <FieldTable fields={compact ? moreFields : incidentFields} />
    </Stack>
  );

  return (
    <Box
      className="monosuite-threat-rail-card monosuite-threat-rail-card--incident"
      style={{ position: 'relative', paddingLeft: THREAT_RAIL_CARD_GUTTER, paddingRight: 2 }}
    >
      <ThreatRailNodeDot tone="accent" pulse />

      <Stack
        gap={6}
        p="xs"
        className="monosuite-threat-rail-card-body"
        style={{
          borderRadius: 'var(--mantine-radius-md)',
          background: `linear-gradient(
            145deg,
            color-mix(in srgb, var(--mantine-color-accent-filled) 14%, var(--monosuite-color-surface)),
            var(--monosuite-color-surface)
          )`,
          border: '1px solid color-mix(in srgb, var(--mantine-color-accent-filled) 32%, var(--monosuite-color-border))',
          boxShadow: 'var(--mantine-shadow-xs)',
          minWidth: 0,
        }}
      >
          <Group gap={6} wrap="nowrap" justify="space-between" align="flex-start" style={{ minWidth: 0 }}>
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--mantine-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--mantine-color-accent-filled) 18%, transparent)',
                  flexShrink: 0,
                }}
              >
                <IconShield size={13} color="var(--mantine-color-accent-filled)" aria-hidden />
              </Box>
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="10px" fw={700} tt="uppercase" c="accent" style={{ letterSpacing: '0.1em' }}>
                  Incident
                </Text>
                <Text size="xs" fw={700}>
                  Attack vector
                </Text>
              </Stack>
            </Group>
            <Badge
              size="xs"
              variant="light"
              color={severityColor(incident.severity)}
              radius="sm"
              leftSection={<SeverityIcon severity={incident.severity} size={11} />}
              style={{ flexShrink: 0 }}
            >
              {incident.severity}
            </Badge>
          </Group>

        {compact ? (
          <>
            <div className="monosuite-threat-rail-card-main">
              {summary}
              {previewFields.length > 0 ? <FieldTable fields={previewFields} /> : null}
              {hasMore ? (
                <>
                  <Collapse expanded={expanded}>{moreDetails}</Collapse>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="accent"
                    onClick={() => setExpanded((open) => !open)}
                    rightSection={
                      <IconChevronDown
                        size={12}
                        style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                      />
                    }
                  >
                    {expanded ? 'Less' : `More (${moreFields.length})`}
                  </Button>
                </>
              ) : null}
            </div>
            <div className="monosuite-threat-rail-card-footer">
              <LinkedIncidentAlertList rows={linkedAlerts} />
            </div>
          </>
        ) : (
          <>
            <div className="monosuite-threat-rail-card-main">
              {summary}
              {moreDetails}
            </div>
            <div className="monosuite-threat-rail-card-footer">
              <LinkedIncidentAlertList rows={linkedAlerts} />
            </div>
          </>
        )}
      </Stack>
    </Box>
  );
}

export function ThreatRailHeader({
  onEdit,
}: {
  onEdit?: () => void;
}) {
  return (
    <Group gap={8} wrap="nowrap" justify="space-between" style={{ flexShrink: 0 }}>
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        <Box
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--mantine-radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in srgb, var(--mantine-color-brand-filled) 12%, var(--monosuite-color-surface-sunken))',
            border: '1px solid var(--monosuite-color-border)',
            flexShrink: 0,
          }}
        >
          <IconRadar2 size={14} color="var(--mantine-color-brand-filled)" aria-hidden />
        </Box>
        <Text size="sm" fw={700}>
          Incident context
        </Text>
      </Group>
      {onEdit ? (
        <Tooltip label="Edit incident, attacker, and affected entities" withArrow>
          <ActionIcon
            variant="transparent"
            color="accent"
            size="sm"
            aria-label="Edit incident context"
            data-testid="edit-incident-button"
            onClick={onEdit}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </Group>
  );
}

export function ThreatFlowConnector({ caption }: { caption: string }) {
  return (
    <Box py={2} pl={10} pr={2} style={{ flexShrink: 0 }}>
      <Group gap={8} wrap="nowrap" align="center">
        <Box style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <IconArrowDown size={14} color="var(--mantine-color-accent-filled)" aria-hidden />
        </Box>
        <Badge
          size="xs"
          variant="light"
          color="neutral"
          radius="sm"
          tt="uppercase"
          style={{ letterSpacing: '0.1em', fontWeight: 700 }}
        >
          {caption}
        </Badge>
      </Group>
    </Box>
  );
}

export function ThreatRailNodeDot({
  tone,
  pulse = false,
}: {
  tone: 'danger' | 'accent' | 'teal';
  pulse?: boolean;
}) {
  const color = `var(--mantine-color-${tone}-filled)`;

  return (
    <Box
      aria-hidden
      style={{
        position: 'absolute',
        left: 10,
        top: 14,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        border: '2px solid var(--monosuite-color-surface)',
        boxShadow: pulse
          ? `0 0 0 3px color-mix(in srgb, ${color} 28%, transparent)`
          : `0 0 0 2px color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    />
  );
}

export const THREAT_RAIL_CHAIN_INSET = 4;
export const THREAT_RAIL_CARD_GUTTER = 28;
/** Chain inset + timeline gutter — aligns quick actions with card bodies. */
export const THREAT_RAIL_CARD_BODY_OFFSET = THREAT_RAIL_CHAIN_INSET + THREAT_RAIL_CARD_GUTTER;
export const THREAT_RAIL_TIMELINE_LEFT = 14;
