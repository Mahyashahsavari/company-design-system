import { ActionIcon, Button, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';

interface ContributionNoteProps {
  author: string;
  text: string;
  time?: string;
  edited?: boolean;
  own: boolean;
  editing: boolean;
  draft: string;
  saveLabel?: string;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRequestDelete: () => void;
}

/** Author row, body, and own-only edit/delete controls for answers, comments, and chat. */
export function ContributionNote({
  author,
  text,
  time,
  edited,
  own,
  editing,
  draft,
  saveLabel = 'Save',
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
}: ContributionNoteProps) {
  const canSave = draft.trim().length > 0;
  const dirty = editing && draft !== text;
  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(editing, dirty, onCancelEdit);
  const ref = useClickOutside<HTMLDivElement>(
    () => {
      if (editing && !confirming) requestClose();
    },
    undefined,
    undefined,
    editing && !confirming,
  );

  return (
    <Stack gap={6} ref={ref}>
      <Group justify="space-between" wrap="nowrap" gap="xs" align="flex-start">
        <Group gap={6} wrap="wrap" style={{ minWidth: 0, flex: 1 }}>
          <Text size="xs" fw={700}>
            {author}
          </Text>
          {time ? (
            <Text size="xs" c="dimmed">
              {time}
            </Text>
          ) : null}
          {edited ? (
            <Text size="xs" c="dimmed">
              Edited
            </Text>
          ) : null}
        </Group>
        {own && !editing ? (
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Edit">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="neutral"
                aria-label="Edit"
                onClick={onStartEdit}
              >
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="danger"
                aria-label="Delete"
                onClick={onRequestDelete}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : null}
      </Group>

      {editing ? (
        <Stack gap="xs">
          <Textarea
            aria-label="Edit text"
            minRows={2}
            autosize
            value={draft}
            onChange={(event) => onDraftChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSave) {
                event.preventDefault();
                onSaveEdit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                requestClose();
              }
            }}
          />
          <Group gap="xs">
            <Button size="compact-xs" onClick={onSaveEdit} disabled={!canSave}>
              {saveLabel}
            </Button>
            <Button size="compact-xs" variant="subtle" onClick={requestClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : (
        <Text size="sm" style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}>
          {text}
        </Text>
      )}
      <DiscardChangesModal
        opened={confirming}
        onKeepEditing={keepEditing}
        onDiscard={discard}
        title="Discard edits?"
        description="Your edits to this note will be discarded."
      />
    </Stack>
  );
}
