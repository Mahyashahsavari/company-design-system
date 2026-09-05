import { Box, Group, Stack, Text } from '@mantine/core';
import { IconArrowRight, IconTarget, IconUser } from '@tabler/icons-react';
import type { ThreatEntity } from '../data';
import { useRoomIncident } from '../RoomScenarioContext';

interface ThreatRelationshipProps {
  attacker: ThreatEntity;
  victim: ThreatEntity;
  attackerCount: number;
  victimCount: number;
}

export function ThreatRelationship({
  attacker,
  victim,
  attackerCount,
  victimCount,
}: ThreatRelationshipProps) {
  const incident = useRoomIncident();
  const inspecting = attackerCount > 1 || victimCount > 1;
  const attackerMeta =
    attacker.fields.find((field) => field.label === 'Threat Actor')?.value ?? incident.threatActor;
  const technique = incident.scenario;

  return (
    <>
      <Group
        hiddenFrom="xl"
        gap="xs"
        wrap="nowrap"
        px="sm"
        py={6}
        align="center"
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
          background: 'var(--monosuite-color-surface-sunken)',
          flexShrink: 0,
          minWidth: 0,
        }}
        aria-label="Inspecting threat relationship"
      >
        <Text size="xs" fw={700} ff="monospace" truncate style={{ flex: 1, minWidth: 0 }}>
          {attacker.identifier}
        </Text>
        <IconArrowRight size={14} aria-hidden color="var(--mantine-color-danger-filled)" />
        <Text size="xs" c="dimmed" truncate>
          {technique}
        </Text>
        <IconArrowRight size={14} aria-hidden color="var(--mantine-color-danger-filled)" />
        <Text size="xs" fw={700} ff="monospace" truncate style={{ flex: 1, minWidth: 0 }} ta="right">
          {victim.identifier}
        </Text>
      </Group>

      <Group
        visibleFrom="xl"
        gap="md"
        wrap="nowrap"
        px="sm"
        py={6}
        align="center"
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
          background: 'var(--monosuite-color-surface-sunken)',
          flexShrink: 0,
        }}
      >
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <IconTarget size={16} color="var(--mantine-color-danger-filled)" />
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.04em' }}>
              {inspecting ? 'Inspecting attacker' : 'Attacker'}
            </Text>
            <Text size="sm" fw={700} ff="monospace" truncate>
              {attacker.identifier}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {attackerMeta}
            </Text>
          </Stack>
        </Group>

        <Stack gap={2} align="center" style={{ flex: '1.2 1 0', minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" justify="center">
            <Box
              style={{
                flex: 1,
                height: 2,
                background: 'var(--mantine-color-danger-filled)',
                opacity: 0.35,
              }}
            />
            <IconArrowRight size={16} color="var(--mantine-color-danger-filled)" />
            <Box
              style={{
                flex: 1,
                height: 2,
                background: 'var(--mantine-color-danger-filled)',
                opacity: 0.35,
              }}
            />
          </Group>
          <Text size="xs" fw={700} ta="center" lineClamp={1}>
            {technique}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace" ta="center">
            {incident.mitreId}
          </Text>
        </Stack>

        <Group gap="xs" wrap="nowrap" justify="flex-end" style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={0} style={{ minWidth: 0 }} align="flex-end">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.04em' }}>
              {inspecting ? 'Inspecting victim' : 'Victim'}
            </Text>
            <Text size="sm" fw={700} ff="monospace" truncate>
              {victim.identifier}
            </Text>
            {victim.secondaryIdentifier ? (
              <Text size="xs" c="dimmed" ff="monospace" truncate>
                {victim.secondaryIdentifier}
              </Text>
            ) : null}
          </Stack>
          <IconUser size={16} color="var(--monosuite-color-text-muted)" />
        </Group>
      </Group>
    </>
  );
}
