import { Box, Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ATTACKER_ENTITIES,
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

interface IncidentContextColumnProps {
  attackerId: string;
  victimId: string;
  onAttackerChange: (id: string) => void;
  onVictimChange: (id: string) => void;
  onEditIncident?: () => void;
  linkedAlerts?: LinkedIncidentAlert[];
  /** Matches expanded Room Utility unless the user resizes the rail. */
  defaultWidth?: number;
}

/** Left SOC threat chain rail — scrolls naturally; preview rows adapt to viewport height. */
export function IncidentContextColumn({
  attackerId,
  victimId,
  onAttackerChange,
  onVictimChange,
  onEditIncident,
  linkedAlerts = [],
  defaultWidth = ROOM_UTILITY_WIDTH,
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
        w={width}
        h="100%"
        style={{
          flexShrink: 0,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
            <ThreatRailHeader onEdit={onEditIncident} />
          </Box>

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
      </Box>

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
    </Box>
  );
}
