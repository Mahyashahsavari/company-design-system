import { Button, Group, Modal, Stack, Text } from '@mantine/core';

interface DiscardChangesModalProps {
  opened: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  title?: string;
  description?: string;
}

/** Confirm leaving a form with unsaved edits. Sits above drawers and other modals. */
export function DiscardChangesModal({
  opened,
  onKeepEditing,
  onDiscard,
  title = 'Discard changes?',
  description = 'You have unsaved changes. If you leave, they will be discarded.',
}: DiscardChangesModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onKeepEditing}
      title={title}
      size="sm"
      centered
      zIndex={500}
      closeOnClickOutside
      data-testid="discard-changes-modal"
    >
      <Stack gap="md">
        <Text size="sm">{description}</Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button color="danger" variant="filled" onClick={onDiscard}>
            Discard
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
