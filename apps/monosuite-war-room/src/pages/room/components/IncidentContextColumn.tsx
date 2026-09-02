import { ActionIcon, Badge, Box, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ROOM_UTILITY_WIDTH } from '../../../shared/constants';
import { useThreatRailFieldBudget } from '../hooks/useThreatRailFieldBudget';
import {
  IncidentAttackCard,
  INCIDENT_FIELD_COUNT,
  THREAT_RAIL_TIMELINE_LEFT,
  ThreatFlowConnector,
  ThreatRailHeader,
} from './IncidentAttackCard';
import { ThreatEntityPanel } from './ThreatEntityPanel';

const RAIL_MIN_WIDTH = 248;
const RAIL_MAX_WIDTH = 440;
const RAIL_COMPACT_WIDTH = 52;

interface IncidentContextColumnProps {
  attackerId: string;
  victimId: string;
  onAttackerChange: (id: string) => void;
  onVictimChange: (id: string) => void;
  onEditIncident?: () => void;
  linkedAlerts?: LinkedIncidentAlert[];
  /** Matches expanded Room Utility unless the user resizes the rail. */
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
  defaultWidth = ROOM_UTILITY_WIDTH,
  fullWidth = false,
  collapsed = false,
  onToggleCollapse,
  onOpenAffectedEntities,
  onOpenAttackMap,
}: IncidentContextColumnProps) {
  const { ref: scrollRef, height: scrollHeight } = useElementSize();
  const [width, setWidth] = useState(() =>
    Math.max(RAIL_MIN_WIDTH, Math.min(RAIL_MAX_WIDTH, defaultWidth)),
  );
  const [dragging, setDragging] = useState(false);
  const userResized = useRef(false);
  const dragStart = useRef({ x: 0, width: defaultWidth });

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

  const clampWidth = useCallback((next: number) => {
    setWidth(Math.max(RAIL_MIN_WIDTH, Math.min(RAIL_MAX_WIDTH, Math.round(next))));
  }, []);

  useEffect(() => {
    if (userResized.current) return;
    clampWidth(defaultWidth);
  }, [clampWidth, defaultWidth]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      userResized.current = true;
      setDragging(true);
      dragStart.current = { x: event.clientX, width };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [width],
  );

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event: PointerEvent) => {
      clampWidth(dragStart.current.width + (event.clientX - dragStart.current.x));
    };
    const onUp = () => setDragging(false);

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [clampWidth, dragging]);

  return (
    <Box
      h="100%"
      style={{
        display: 'flex',
        flexShrink: 0,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <Box
        w={fullWidth ? '100%' : compact ? RAIL_COMPACT_WIDTH : width}
        mr={compact ? 6 : 0}
        h="100%"
        style={{
          flexShrink: fullWidth ? 1 : 0,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {compact ? (
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
                style={{ position: 'relative', paddingLeft: 4, paddingRight: 4, paddingBottom: 8 }}
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

                <IncidentAttackCard
                  compact
                  previewCount={incidentPreview}
                  linkedAlerts={linkedAlerts}
                />

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
        )}
      </Box>

      {!fullWidth && !compact && (
        <Box
          className="monosuite-threat-rail-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize attack chain"
          aria-valuenow={width}
          aria-valuemin={RAIL_MIN_WIDTH}
          aria-valuemax={RAIL_MAX_WIDTH}
          data-dragging={dragging ? 'true' : undefined}
          data-testid="attack-chain-resize"
          onPointerDown={onPointerDown}
        />
      )}
    </Box>
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
    <Group gap={6} px={4} pb={7} wrap="nowrap" style={{ flexShrink: 0 }}>
      <Button
        size="compact-sm"
        variant="light"
        color="teal"
        leftSection={<IconBoxMultiple size={14} />}
        onClick={onOpenAffectedEntities}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Group gap={5} wrap="nowrap">
          <Text size="xs" fw={700} truncate>Affected entities</Text>
          <Badge size="xs" variant="filled" color="teal">{ASSETS.length}</Badge>
          {critical > 0 ? <Badge size="xs" variant="light" color="danger">{critical} critical</Badge> : null}
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
