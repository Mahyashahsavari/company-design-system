import { Box, Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useMemo } from 'react';
import { ATTACKER_ENTITIES, VICTIM_ENTITIES, entityFields } from '../data';
import { useThreatRailFieldBudget } from '../hooks/useThreatRailFieldBudget';
import {
  IncidentAttackCard,
  INCIDENT_FIELD_COUNT,
  THREAT_RAIL_TIMELINE_LEFT,
  ThreatFlowConnector,
  ThreatRailHeader,
} from './IncidentAttackCard';
import { ThreatEntityPanel } from './ThreatEntityPanel';

interface IncidentContextColumnProps {
  attackerId: string;
  victimId: string;
  onAttackerChange: (id: string) => void;
  onVictimChange: (id: string) => void;
  onViewIncident?: () => void;
}

/** Left SOC threat chain rail — scrolls naturally; preview rows adapt to viewport height. */
export function IncidentContextColumn({
  attackerId,
  victimId,
  onAttackerChange,
  onVictimChange,
  onViewIncident,
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
      [entityFields(attacker).length, INCIDENT_FIELD_COUNT, entityFields(victim).length] as [
        number,
        number,
        number,
      ],
    [attacker, victim],
  );

  const [attackerPreview, incidentPreview, victimPreview] = useThreatRailFieldBudget(
    scrollHeight,
    fieldTotals,
  );

  return (
    <Box
      w={{ base: 248, lg: 268, xl: 288 }}
      pr={8}
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
              var(--mantine-color-danger-filled),
              var(--mantine-color-accent-filled),
              var(--mantine-color-teal-filled)
            )`,
          }}
        />

        <Box px={4} pt={6} pb={4} style={{ flexShrink: 0 }}>
          <ThreatRailHeader />
        </Box>

        <Box ref={scrollRef} className="monosuite-threat-rail-scroll">
          <Box
            className="monosuite-threat-rail-chain"
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

            <ThreatEntityPanel
              kind="attacker"
              entities={ATTACKER_ENTITIES}
              selectedId={attackerId}
              onSelect={onAttackerChange}
              railNode
              railCompact
              previewCount={attackerPreview}
            />

            <ThreatFlowConnector caption="executes" />

            <IncidentAttackCard
              compact
              previewCount={incidentPreview}
              onViewDetails={onViewIncident}
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
  );
}
