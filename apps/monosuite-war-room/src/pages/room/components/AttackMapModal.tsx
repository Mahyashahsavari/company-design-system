import { ActionIcon, Badge, CloseButton, Group, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { IconMaximize, IconMaximizeOff, IconRoute2 } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { ThreatEntity } from '../data';
import { useRoomIncident } from '../RoomScenarioContext';
import { AttackMapCanvas } from './AttackMapCanvas';

interface AttackMapModalProps {
  opened: boolean;
  onClose: () => void;
  attackers: ThreatEntity[];
  victims: ThreatEntity[];
}

/** Evidence-aware attack graph — force layout with adapter provenance. */
export function AttackMapModal({ opened, onClose, attackers, victims }: AttackMapModalProps) {
  const incident = useRoomIncident();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!opened) setFullscreen(false);
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen={fullscreen}
      withCloseButton={false}
      title={
        <Group gap="xs" wrap="nowrap" justify="space-between" style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <IconRoute2 size={19} color="var(--mantine-color-warning-filled)" />
            <Text fw={800}>Attack map</Text>
            <Badge color="warning" variant="light" visibleFrom="xs">
              Hypothesis · unconfirmed
            </Badge>
            <Text size="xs" c="dimmed" ff="monospace" visibleFrom="sm">
              {incident.id}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} withArrow>
              <ActionIcon
                variant="subtle"
                color="neutral"
                size="md"
                aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-pressed={fullscreen}
                data-testid="attack-map-fullscreen"
                onClick={() => setFullscreen((value) => !value)}
              >
                {fullscreen ? <IconMaximizeOff size={16} /> : <IconMaximize size={16} />}
              </ActionIcon>
            </Tooltip>
            <CloseButton aria-label="Close attack map" onClick={onClose} />
          </Group>
        </Group>
      }
      size="min(1180px, calc(100vw - 24px))"
      centered
      overlayProps={{ backgroundOpacity: 0.38, blur: 2 }}
      classNames={{
        content: 'monosuite-attack-map-modal',
        header: 'monosuite-attack-map-modal-header',
        body: 'monosuite-attack-map-modal-body',
      }}
      styles={{
        content: fullscreen
          ? { height: '100dvh', maxHeight: '100dvh', display: 'flex', flexDirection: 'column' }
          : { maxHeight: 'min(900px, calc(100dvh - 24px))' },
        title: { flex: 1, marginRight: 0, width: '100%' },
      }}
    >
      <Stack gap="sm" className="monosuite-attack-map-modal-stack">
        <Text size="xs" c="dimmed">
          Hover a node for details. Click a node to expand or collapse its branch. Adapter edges stay
          dashed.
        </Text>
        {opened ? (
          <div
            className="monosuite-attack-map-canvas-host"
            data-fullscreen={fullscreen ? 'true' : 'false'}
          >
            <AttackMapCanvas
              incident={incident}
              attackers={attackers}
              victims={victims}
              fullscreen={fullscreen}
            />
          </div>
        ) : null}
      </Stack>
    </Modal>
  );
}
