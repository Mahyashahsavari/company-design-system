import { Badge, Box, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { IconArrowRight, IconFingerprint, IconRoute2 } from '@tabler/icons-react';
import { INCIDENT, type ThreatEntity } from '../data';

interface AttackMapModalProps {
  opened: boolean;
  onClose: () => void;
  attacker: ThreatEntity;
  victim: ThreatEntity;
}

/** Evidence-aware relationship map. It is deliberately labelled as a hypothesis until confirmed. */
export function AttackMapModal({ opened, onClose, attacker, victim }: AttackMapModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" wrap="nowrap">
          <IconRoute2 size={19} color="var(--mantine-color-accent-filled)" />
          <Text fw={800}>Attack map</Text>
          <Badge color="warning" variant="light">Hypothesis · unconfirmed</Badge>
        </Group>
      }
      size="min(1080px, calc(100vw - 32px))"
      centered
      overlayProps={{ backgroundOpacity: 0.38, blur: 2 }}
    >
      <Stack gap="md">
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="xs" c="dimmed">
            Relationships are assembled from room context. Every link must retain its evidence source and confidence; the map is not treated as fact until confirmed.
          </Text>
        </Paper>

        <Box className="monosuite-attack-map">
          <AttackNode tone="danger" eyebrow="Threat origin" title={attacker.identifier} detail="Splunk · observed" />
          <AttackEdge label="Valid credentials" source="Splunk SPL-8847291" />
          <AttackNode tone="warning" eyebrow="Identity" title="svc-backup" detail="Inferred · needs confirmation" />
          <AttackEdge label="Remote service" source={`${INCIDENT.mitreId} · ${INCIDENT.mitreTechnique}`} />
          <AttackNode tone="teal" eyebrow="Impacted entity" title={victim.identifier} detail={`${victim.secondaryIdentifier ?? 'Asset'} · room context`} />
        </Box>

        <Group gap="xs" wrap="wrap">
          <Badge variant="outline" color="neutral">Technique · {INCIDENT.mitreId}</Badge>
          <Badge variant="outline" color="neutral">Tactic · {INCIDENT.mitreTactic}</Badge>
          <Badge variant="outline" color="neutral">Source · Splunk</Badge>
        </Group>
      </Stack>
    </Modal>
  );
}

function AttackNode({
  tone,
  eyebrow,
  title,
  detail,
}: {
  tone: 'danger' | 'warning' | 'teal';
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <Paper className="monosuite-attack-map-node" data-tone={tone} withBorder radius="md" p="md">
      <Group gap="sm" wrap="nowrap">
        <Box className="monosuite-attack-map-node-icon" data-tone={tone}>
          <IconFingerprint size={20} />
        </Box>
        <Stack gap={1} style={{ minWidth: 0 }}>
          <Text size="10px" fw={800} tt="uppercase" c={tone} style={{ letterSpacing: '0.08em' }}>{eyebrow}</Text>
          <Text size="sm" fw={800} ff="monospace" truncate>{title}</Text>
          <Text size="xs" c="dimmed" truncate>{detail}</Text>
        </Stack>
      </Group>
    </Paper>
  );
}

function AttackEdge({ label, source }: { label: string; source: string }) {
  return (
    <Stack className="monosuite-attack-map-edge" gap={3} align="center">
      <IconArrowRight size={22} color="var(--mantine-color-dimmed)" />
      <Text size="10px" fw={700}>{label}</Text>
      <Text size="9px" c="dimmed" ta="center">{source}</Text>
    </Stack>
  );
}
