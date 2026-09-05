import { useEffect, useState } from 'react';
import { Box, Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { ROOM_ROLE_COLOR, ROOM_ROLE_EMOJI, roomRoleColor } from '../data';

export interface TransferCommandCandidate {
  id: string;
  name: string;
  role: string;
}

interface TransferCommandModalProps {
  opened: boolean;
  commanderName: string;
  candidates: TransferCommandCandidate[];
  onClose: () => void;
  onConfirm: (participantId: string) => void;
}

/** Confirm transferring room command to another participant. */
export function TransferCommandModal({
  opened,
  commanderName,
  candidates,
  onClose,
  onConfirm,
}: TransferCommandModalProps) {
  const [nextCommanderId, setNextCommanderId] = useState<string | null>(null);

  useEffect(() => {
    if (opened) setNextCommanderId(null);
  }, [opened]);

  const options = candidates.map((person) => ({
    value: person.id,
    label: `${person.name} · ${person.role}`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text fw={700}>Transfer command</Text>
          <Text size="sm" c="dimmed" fw={400}>
            Choose who will lead the room after {commanderName} steps down
          </Text>
        </Stack>
      }
      centered
      size="md"
      data-testid="transfer-command-modal"
    >
      <Stack gap="md">
        <Select
          label="New commander"
          placeholder="Select a participant"
          data={options}
          value={nextCommanderId}
          onChange={setNextCommanderId}
          searchable
          nothingFoundMessage="No eligible participants"
          leftSection={
            <Text component="span" size="sm" lh={1} aria-hidden>
              {ROOM_ROLE_EMOJI.Commander}
            </Text>
          }
          renderOption={({ option }) => {
            const person = candidates.find((candidate) => candidate.id === option.value);
            const role = person?.role ?? 'Responder';
            return (
              <Group gap="xs" wrap="nowrap">
                <Box
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: `var(--mantine-color-${roomRoleColor(role)}-filled)`,
                  }}
                />
                <Text size="sm">
                  {person?.name ?? option.label}
                  {' · '}
                  <Text component="span" c={roomRoleColor(role)} fw={600}>
                    {role}
                  </Text>
                </Text>
              </Group>
            );
          }}
        />

        <Text size="xs" c="dimmed">
          The current commander cannot leave or be removed until command is transferred.
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            color={ROOM_ROLE_COLOR.Commander}
            disabled={!nextCommanderId}
            onClick={() => nextCommanderId && onConfirm(nextCommanderId)}
            data-testid="transfer-command-confirm"
          >
            Transfer command
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
