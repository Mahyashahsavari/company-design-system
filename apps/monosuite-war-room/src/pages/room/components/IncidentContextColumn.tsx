import { ActionIcon, Badge, Box, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useMemo } from 'react';
import {
  IconBoxMultiple,
  IconLayoutSidebarLeftExpand,
  IconRadar2,
  IconRoute2,
  IconShield,
} from '@tabler/icons-react';
import {
  ASSETS,
  ATTACKER_ENTITIES,
  INCIDENT,
  VICTIM_ENTITIES,
  entityFields,
  type LinkedIncidentAlert,
} from '../data';
import { ROOM_SIDE_PANEL_DEFAULT_WIDTH } from '../../../shared/constants';
import { useThreatRailFieldBudget } from '../hooks/useThreatRailFieldBudget';
import {
  IncidentAttackCard,
  INCIDENT_FIELD_COUNT,
  THREAT_RAIL_CARD_BODY_OFFSET,
  THREAT_RAIL_CHAIN_INSET,
  THREAT_RAIL_TIMELINE_LEFT,
  ThreatFlowConnector,
  ThreatRailHeader,
} from './IncidentAttackCard';
import { ThreatEntityPanel } from './ThreatEntityPanel';
import { ResizableRoomSidePanel } from './ResizableRoomSidePanel';

interface IncidentContextColumnProps {
  attackerId: string;
  victimId: string;
  onAttackerChange: (id: string) => void;
  onVictimChange: (id: string) => void;
  onEditIncident?: () => void;
  linkedAlerts?: LinkedIncidentAlert[];
  /** Standard side panel width unless the user resizes the rail. */
  panelWidth?: number;
  onPanelWidthChange?: (width: number) => void;
  minPanelWidth?: number;
  maxPanelWidth?: number;
  /** @deprecated use panelWidth from room layout */
  defaultWidth?: number;
  /** Full-width stacked rail for the mobile room view. */
  fullWidth?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenAffectedEntities?: () => void;
  onOpenAttackMap?: () => void;
}

/** Persistent incident context rail — full detail or a compact always-visible summary. */
export function IncidentContextColumn({
  attackerId,
  victimId,
  onAttackerChange,
  onVictimChange,
  onEditIncident,
  linkedAlerts = [],
  panelWidth,
  onPanelWidthChange,
  minPanelWidth,
  maxPanelWidth,
  defaultWidth = ROOM_SIDE_PANEL_DEFAULT_WIDTH,
  fullWidth = false,
  collapsed = false,
  onToggleCollapse,
  onOpenAffectedEntities,
  onOpenAttackMap,
}: IncidentContextColumnProps) {
  const { ref: scrollRef, height: scrollHeight } = useElementSize();

  const attacker = useMemo(
    () => ATTACKER_ENTITIES.find((entity) => entity.id === attackerId) ?? ATTACKER_ENTITIES[0],
    [attackerId],
  );
  const victim = useMemo(
    () => VICTIM_ENTITIES.find((entity) => entity.id === victimId) ?? VICTIM_ENTITIES[0],
    [victimId],
  );

  const fieldTotals = useMemo(
    () =>
      [INCIDENT_FIELD_COUNT, entityFields(attacker).length, entityFields(victim).length] as [
        number,
        number,
        number,
      ],
    [attacker, victim],
  );

  const [incidentPreview, attackerPreview, victimPreview] = useThreatRailFieldBudget(
    scrollHeight,
    fieldTotals,
  );

  const allFieldsVisible =
    incidentPreview >= fieldTotals[0] &&
    attackerPreview >= fieldTotals[1] &&
    victimPreview >= fieldTotals[2];
  const compact = collapsed && !fullWidth;

  const railBody = compact ? (
    <CompactIncidentContextRail
      onExpand={onToggleCollapse}
      onOpenAffectedEntities={onOpenAffectedEntities}
      onOpenAttackMap={onOpenAttackMap}
    />
  ) : (
    <Stack
      gap={0}
      h="100%"
      p="xs"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--monosuite-color-surface)',
        border: '1px solid var(--monosuite-color-border)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(
                90deg,
                var(--mantine-color-accent-filled),
                var(--mantine-color-danger-filled),
                var(--mantine-color-teal-filled)
              )`,
        }}
      />

      <Box px={4} pt={6} pb={4} style={{ flexShrink: 0 }}>
        <ThreatRailHeader
          onEdit={onEditIncident}
          onCollapse={fullWidth ? undefined : onToggleCollapse}
        />
      </Box>

      <ContextQuickActions
        onOpenAffectedEntities={onOpenAffectedEntities}
        onOpenAttackMap={onOpenAttackMap}
      />

      <Box ref={scrollRef} className="monosuite-threat-rail-scroll">
        <Box
          className={
            allFieldsVisible
              ? 'monosuite-threat-rail-chain monosuite-threat-rail-chain--fill'
              : 'monosuite-threat-rail-chain'
          }
          style={{
            position: 'relative',
            paddingLeft: THREAT_RAIL_CHAIN_INSET,
            paddingRight: THREAT_RAIL_CHAIN_INSET,
            paddingBottom: 8,
          }}
        >
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              left: THREAT_RAIL_TIMELINE_LEFT,
              top: 12,
              bottom: 12,
              width: 2,
              background: `repeating-linear-gradient(
                    to bottom,
                    color-mix(in srgb, var(--mantine-color-accent-filled) 45%, transparent) 0,
                    color-mix(in srgb, var(--mantine-color-accent-filled) 45%, transparent) 5px,
                    transparent 5px,
                    transparent 10px
                  )`,
            }}
          />

          <IncidentAttackCard compact previewCount={incidentPreview} linkedAlerts={linkedAlerts} />

          <ThreatFlowConnector caption="from" />

          <ThreatEntityPanel
            kind="attacker"
            entities={ATTACKER_ENTITIES}
            selectedId={attackerId}
            onSelect={onAttackerChange}
            railNode
            railCompact
            previewCount={attackerPreview}
          />

          <ThreatFlowConnector caption="against" />

          <ThreatEntityPanel
            kind="victim"
            entities={VICTIM_ENTITIES}
            selectedId={victimId}
            onSelect={onVictimChange}
            railNode
            railCompact
            previewCount={victimPreview}
          />
        </Box>
      </Box>
    </Stack>
  );

  if (fullWidth) {
    return (
      <Box className="monosuite-room-context-panel" w="100%" h="100%" style={{ minWidth: 0, minHeight: 0 }}>
        {railBody}
      </Box>
    );
  }

  return (
    <ResizableRoomSidePanel
      className="monosuite-room-context-panel"
      collapsed={compact}
      width={panelWidth ?? defaultWidth}
      onWidthChange={onPanelWidthChange}
      minWidth={minPanelWidth}
      maxWidth={maxPanelWidth}
      resizeEdge="trailing"
      data-testid="attack-chain-resize"
    >
      {railBody}
    </ResizableRoomSidePanel>
  );
}

function CompactIncidentContextRail({
  onExpand,
  onOpenAffectedEntities,
  onOpenAttackMap,
}: {
  onExpand?: () => void;
  onOpenAffectedEntities?: () => void;
  onOpenAttackMap?: () => void;
}) {
  return (
    <Stack
      gap={8}
      align="center"
      h="100%"
      py="xs"
      px={4}
      style={{
        position: 'relative',
        overflow: 'hidden auto',
        borderRadius: 'var(--mantine-radius-md)',
        background: 'var(--monosuite-color-surface)',
        border: '1px solid var(--monosuite-color-border)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: '0 0 auto',
          height: 3,
          background:
            'linear-gradient(90deg, var(--mantine-color-accent-filled), var(--mantine-color-danger-filled), var(--mantine-color-teal-filled))',
        }}
      />
      <Tooltip label="Expand incident context" position="right" withArrow>
        <ActionIcon
          mt={4}
          variant="light"
          color="brand"
          size="lg"
          aria-label="Expand incident context"
          onClick={onExpand}
        >
          <IconLayoutSidebarLeftExpand size={18} />
        </ActionIcon>
      </Tooltip>
      <Box my={2} style={{ width: 24, height: 1, background: 'var(--monosuite-color-border)' }} />
      <Tooltip label={`${INCIDENT.id} · ${INCIDENT.severity}`} position="right" withArrow>
        <ActionIcon variant="subtle" color="accent" size="lg" aria-label="Incident summary">
          <IconShield size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={`${ATTACKER_ENTITIES.length} attacker entities`} position="right" withArrow>
        <ActionIcon variant="subtle" color="danger" size="lg" aria-label="Attacker entities">
          <IconRadar2 size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={`${ASSETS.length} affected entities`} position="right" withArrow>
        <ActionIcon
          variant="subtle"
          color="teal"
          size="lg"
          aria-label="Open affected entities"
          onClick={onOpenAffectedEntities}
        >
          <IconBoxMultiple size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Open attack map" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          color="accent"
          size="lg"
          aria-label="Open attack map"
          onClick={onOpenAttackMap}
        >
          <IconRoute2 size={18} />
        </ActionIcon>
      </Tooltip>
    </Stack>
  );
}

function ContextQuickActions({
  onOpenAffectedEntities,
  onOpenAttackMap,
}: {
  onOpenAffectedEntities?: () => void;
  onOpenAttackMap?: () => void;
}) {
  const critical = ASSETS.filter((asset) => asset.severity === 'critical').length;

  return (
    <Group
      gap={6}
      pl={THREAT_RAIL_CARD_BODY_OFFSET}
      pr={THREAT_RAIL_CHAIN_INSET}
      pb={7}
      wrap="nowrap"
      style={{ flexShrink: 0 }}
    >
      <Button
        size="compact-sm"
        variant="light"
        color="teal"
        leftSection={<IconBoxMultiple size={14} />}
        onClick={onOpenAffectedEntities}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Group gap={5} wrap="nowrap">
          <Text size="xs" fw={700} truncate>
            Affected entities
          </Text>
          <Badge size="xs" variant="filled" color="teal">
            {ASSETS.length}
          </Badge>
          {critical > 0 ? (
            <Badge size="xs" variant="light" color="danger">
              {critical} critical
            </Badge>
          ) : null}
        </Group>
      </Button>
      <Tooltip label="Open evidence-aware attack map" withArrow>
        <Button
          size="compact-sm"
          variant="light"
          color="accent"
          leftSection={<IconRoute2 size={14} />}
          onClick={onOpenAttackMap}
          aria-label="Open attack map"
        >
          Map
        </Button>
      </Tooltip>
    </Group>
  );
}
