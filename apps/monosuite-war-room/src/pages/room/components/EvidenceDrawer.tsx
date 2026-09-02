import { Box, Drawer, ScrollArea, Stack, Text } from '@mantine/core';
import type { EvidenceItem, EvidenceKind } from '../data';
import { EvidencePanel } from './EvidencePanel';

interface EvidenceDrawerProps {
  opened: boolean;
  onClose: () => void;
  items: EvidenceItem[];
  onAdd: (kind: EvidenceKind) => void;
  onRemove?: (id: string) => void;
}

/** Evidence is part of the durable incident record, not a collaboration-panel tab. */
export function EvidenceDrawer({ opened, onClose, items, onAdd, onRemove }: EvidenceDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={
        <Stack gap={1}>
          <Text fw={700}>Incident evidence</Text>
          <Text size="xs" c="dimmed" fw={400}>
            Canonical evidence record for this room
          </Text>
        </Stack>
      }
      overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
    >
      <ScrollArea h="calc(100dvh - 92px)" type="auto">
        <Box pr="xs" pb="xl">
          <EvidencePanel items={items} onAdd={onAdd} onRemove={onRemove} />
        </Box>
      </ScrollArea>
    </Drawer>
  );
}
