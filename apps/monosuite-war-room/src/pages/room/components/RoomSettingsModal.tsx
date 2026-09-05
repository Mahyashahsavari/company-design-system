import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import {
  CONNECTED_SOURCES,
  getWorkflowDefinition,
  ROOM_TAG_SUGGESTIONS,
  ROOM_WORKFLOW_OPTIONS,
  type RoomSettingsDraft,
} from '../data';
import { WorkflowInfoLabel } from './response-workflow/WorkflowInfoLabel';

interface RoomSettingsModalProps {
  opened: boolean;
  initial: RoomSettingsDraft;
  onClose: () => void;
  onSave: (next: RoomSettingsDraft) => void;
}

const ADAPTER_OPTIONS = CONNECTED_SOURCES.map((source) => ({
  value: source.id,
  label: source.adapter,
}));

export function RoomSettingsModal({ opened, initial, onClose, onSave }: RoomSettingsModalProps) {
  const [draft, setDraft] = useState<RoomSettingsDraft>(initial);

  useEffect(() => {
    if (opened) setDraft(initial);
  }, [opened, initial]);

  const canSave = draft.title.trim().length > 0 && draft.description.trim().length > 0;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(opened, dirty, onClose);

  return (
    <>
      <Modal
        opened={opened}
        onClose={requestClose}
        size="xl"
        centered
        data-testid="room-settings-modal"
        title={
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Room Settings
            </Text>
            <Text size="sm" c="dimmed" fw={400}>
              Define what happened and how the room should guide the response
            </Text>
          </Stack>
        }
      >
        <Stack gap="md">
          <TextInput
            label="Room Title"
            placeholder="Enter your room title"
            required
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.currentTarget.value }))
            }
          />

          <Textarea
            label="Initial Description"
            placeholder="What happened, why a room is needed, and the current known impact"
            required
            minRows={3}
            autosize
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.currentTarget.value }))
            }
          />

          <Select
            label={
              <WorkflowInfoLabel
                size="sm"
                fw={500}
                workflowName={getWorkflowDefinition(draft.workflow)?.label}
                workflowDescription={getWorkflowDefinition(draft.workflow)?.description}
              />
            }
            required
            data={[...ROOM_WORKFLOW_OPTIONS]}
            value={draft.workflow}
            onChange={(value) => value && setDraft((current) => ({ ...current, workflow: value }))}
          />

          <TagsInput
            label="Tag"
            placeholder="Enter tags"
            data={ROOM_TAG_SUGGESTIONS}
            value={draft.tags}
            onChange={(tags) => setDraft((current) => ({ ...current, tags }))}
            clearable
          />

          <Stack gap="md">
            <AdapterReferenceField
              label="Incident References"
              value={draft.incidentReferences}
              onChange={(incidentReferences) =>
                setDraft((current) => ({ ...current, incidentReferences }))
              }
            />
            <AdapterReferenceField
              label="Attacker References"
              value={draft.attackerReferences}
              onChange={(attackerReferences) =>
                setDraft((current) => ({ ...current, attackerReferences }))
              }
            />
            <AdapterReferenceField
              label="Victim References"
              value={draft.victimReferences}
              onChange={(victimReferences) =>
                setDraft((current) => ({ ...current, victimReferences }))
              }
            />
          </Stack>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSave}
              onClick={() => {
                onSave({
                  ...draft,
                  title: draft.title.trim(),
                  description: draft.description.trim(),
                });
                onClose();
              }}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
      <DiscardChangesModal opened={confirming} onKeepEditing={keepEditing} onDiscard={discard} />
    </>
  );
}

function AdapterReferenceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <MultiSelect
      label={label}
      placeholder="Search and select adapter"
      searchable
      clearable
      data={ADAPTER_OPTIONS}
      value={value}
      onChange={onChange}
      leftSection={<IconPlus size={16} color="var(--mantine-color-teal-filled)" />}
      nothingFoundMessage="No adapters"
    />
  );
}
