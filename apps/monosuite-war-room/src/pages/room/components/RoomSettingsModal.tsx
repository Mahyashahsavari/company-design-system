import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import {
  CONNECTED_SOURCES,
  getWorkflowDefinition,
  ROOM_TAG_SUGGESTIONS,
  ROOM_WORKFLOW_OPTIONS,
  type RoomSettingsDraft,
} from '../data';
import {
  isPapLevel,
  isRoomVisibility,
  isTlpLevel,
  PAP_FIELD_DESCRIPTION,
  PAP_FIELD_HELP,
  PAP_OPTIONS,
  papOption,
  ROOM_VISIBILITY_OPTIONS,
  TLP_FIELD_DESCRIPTION,
  TLP_FIELD_HELP,
  TLP_OPTIONS,
  TLP_STRICT_CHECKBOX_DESCRIPTION,
  TLP_STRICT_CHECKBOX_LABEL,
  tlpOption,
  toStoredTlp,
  visibilityOption,
} from '../roomPolicy';
import { PapMark, ProtocolMark, TlpMark } from './ProtocolMark';
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

const POLICY_INPUT_ORDER = ['label', 'input', 'description', 'error'] as const;

function RequiredMark() {
  return (
    <Text
      component="span"
      c="var(--mantine-color-error)"
      inherit
      aria-hidden
      style={{ marginInlineStart: 4 }}
    >
      *
    </Text>
  );
}

function FieldHelpLabel({
  label,
  help,
}: {
  label: string;
  help: string;
}) {
  return (
    <Box
      component="span"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}
    >
      <Text component="span" size="sm" fw={500}>
        {label}
        <RequiredMark />
      </Text>
      <Tooltip
        label={help}
        multiline
        maw={320}
        withArrow
        openDelay={200}
        events={{ hover: true, focus: true, touch: true }}
      >
        <ActionIcon variant="subtle" color="neutral" size="sm" aria-label={`About ${label}`}>
          <IconInfoCircle size={16} aria-hidden />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}

export function RoomSettingsModal({ opened, initial, onClose, onSave }: RoomSettingsModalProps) {
  const [draft, setDraft] = useState<RoomSettingsDraft>(initial);

  useEffect(() => {
    if (opened) setDraft(initial);
  }, [opened, initial]);

  const canSave =
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    Boolean(draft.visibility && draft.tlp.level && draft.pap);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(opened, dirty, onClose);
  const visibilityHelp = visibilityOption(draft.visibility).description;

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
            label="Room visibility"
            required
            allowDeselect={false}
            data={[...ROOM_VISIBILITY_OPTIONS]}
            value={draft.visibility}
            onChange={(value) => {
              if (!isRoomVisibility(value)) return;
              setDraft((current) => ({ ...current, visibility: value }));
            }}
            description={visibilityHelp}
            inputWrapperOrder={[...POLICY_INPUT_ORDER]}
            renderOption={({ option }) => {
              const item = visibilityOption(option.value as typeof draft.visibility);
              return (
                <Stack gap={2} py={4}>
                  <Text size="sm" fw={600}>
                    {item.label}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    {item.description}
                  </Text>
                </Stack>
              );
            }}
            data-testid="room-visibility-select"
          />

          <Stack gap="xs">
            <Select
              label={<FieldHelpLabel label="TLP" help={TLP_FIELD_HELP} />}
              required
              withAsterisk={false}
              allowDeselect={false}
              data={[...TLP_OPTIONS]}
              value={draft.tlp.level}
              onChange={(value) => {
                if (!isTlpLevel(value)) return;
                setDraft((current) => ({
                  ...current,
                  tlp: toStoredTlp(value, current.tlp.strict),
                }));
              }}
              description={TLP_FIELD_DESCRIPTION}
              inputWrapperOrder={[...POLICY_INPUT_ORDER]}
              maxDropdownHeight={320}
              comboboxProps={{ withinPortal: false }}
              renderOption={({ option }) => {
                const item = tlpOption(option.value as typeof draft.tlp.level);
                return (
                  <Stack gap={4} py={4}>
                    <ProtocolMark protocol="TLP" level={item.value} />
                    <Text size="xs" c="dimmed" lh={1.4}>
                      {item.description}
                    </Text>
                  </Stack>
                );
              }}
              data-testid="room-tlp-select"
            />
            <TlpMark policy={draft.tlp} />
            {draft.tlp.level === 'AMBER' ? (
              <Checkbox
                label={TLP_STRICT_CHECKBOX_LABEL}
                description={TLP_STRICT_CHECKBOX_DESCRIPTION}
                checked={draft.tlp.strict}
                onChange={() => {
                  setDraft((current) => ({
                    ...current,
                    tlp: toStoredTlp('AMBER', !current.tlp.strict),
                  }));
                }}
                data-testid="room-tlp-strict-checkbox"
              />
            ) : null}
          </Stack>

          <Stack gap="xs">
            <Select
              label={<FieldHelpLabel label="PAP" help={PAP_FIELD_HELP} />}
              required
              withAsterisk={false}
              allowDeselect={false}
              data={[...PAP_OPTIONS]}
              value={draft.pap}
              onChange={(value) => {
                if (!isPapLevel(value)) return;
                setDraft((current) => ({ ...current, pap: value }));
              }}
              description={PAP_FIELD_DESCRIPTION}
              inputWrapperOrder={[...POLICY_INPUT_ORDER]}
              maxDropdownHeight={320}
              comboboxProps={{ withinPortal: false }}
              renderOption={({ option }) => {
                const item = papOption(option.value as typeof draft.pap);
                return (
                  <Stack gap={4} py={4}>
                    <ProtocolMark protocol="PAP" level={item.value} />
                    <Text size="xs" c="dimmed" lh={1.4}>
                      {item.description}
                    </Text>
                  </Stack>
                );
              }}
              data-testid="room-pap-select"
            />
            <PapMark level={draft.pap} />
          </Stack>

          <Select
            label={
              <WorkflowInfoLabel
                size="sm"
                fw={500}
                required
                workflowName={getWorkflowDefinition(draft.workflow)?.label}
                workflowDescription={getWorkflowDefinition(draft.workflow)?.description}
              />
            }
            required
            withAsterisk={false}
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
                  tlp: toStoredTlp(draft.tlp.level, draft.tlp.strict),
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
