import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  Popover,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Select,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconDatabaseImport,
  IconLink,
  IconNotes,
  IconPaperclip,
  IconPencil,
  IconPlus,
  IconSettings,
  IconTrash,
  IconUpload,
  IconUserStar,
} from '@tabler/icons-react';
import { formatBytes } from '@monosuite/utils';
import { CURRENT_USER } from '../../../../shared/constants';
import {
  ROOM_SEVERITY_COLOR,
  canAddCommanderQuestion,
  type CommanderAssignee,
  type CommanderQuestion,
  type EvidenceItem,
  type EvidenceKind,
  type Participant,
  type RoomSeverity,
  type WorkflowStep,
} from '../../data';
import {
  ASSIGNABLE_TASK_ROLE_OPTIONS,
  formatTaskAnswerDisplay,
  isPersonInAssigneePool,
  peopleForPersonAssignee,
  peopleForTaskRole,
  TASK_ROLE_LABEL,
  taskQuorumStatus,
  type AssignableTaskRole,
} from '../../taskQuorum';
import { isChoiceAnswerValid, TaskChoiceControl } from '../TaskChoiceControl';
import { TaskQuorumProgress } from '../TaskQuorumProgress';
import { PHASE_GUIDANCE } from './workflowCanvasData';

const EVIDENCE_KIND_META: Record<
  EvidenceKind,
  { label: string; color: string; icon: typeof IconPaperclip }
> = {
  file: { label: 'File', color: 'teal', icon: IconPaperclip },
  link: { label: 'Link', color: 'accent', icon: IconLink },
  note: { label: 'Note', color: 'brand', icon: IconNotes },
  source: { label: 'Source', color: 'warning', icon: IconDatabaseImport },
};

export function evidenceNodeId(phaseId: string) {
  return `evidence-${phaseId}`;
}

export function commanderNodeId(id: string) {
  return `commander-${id}`;
}

export const TRIAGE_SEVERITY_NODE_ID = 'triage-severity';

export function EvidenceSummaryCard({
  count,
  selected,
}: {
  count: number;
  selected?: boolean;
}) {
  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--evidence"
      data-selected={selected ? 'true' : undefined}
      withBorder
      radius="md"
      p="sm"
    >
      <Group gap="xs" wrap="nowrap" mb={6}>
        <ThemeIcon variant="light" color="neutral" size="sm" radius="sm" aria-hidden>
          <IconPaperclip size={14} />
        </ThemeIcon>
        <Badge size="xs" variant="light" color="neutral">
          Evidence
        </Badge>
      </Group>
      <Text size="md" fw={700} lh={1.3}>
        {count === 0 ? 'No evidence yet' : `${count} attached`}
      </Text>
      <Text size="xs" c="dimmed" mt={4}>
        Open to review or add
      </Text>
    </Paper>
  );
}

export function TriageSeverityCard({
  severity,
  selected,
}: {
  severity: RoomSeverity;
  selected?: boolean;
}) {
  const tone = ROOM_SEVERITY_COLOR[severity];
  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--triage"
      data-selected={selected ? 'true' : undefined}
      data-severity={severity}
      withBorder
      radius="md"
      p="sm"
      style={{
        borderColor: `color-mix(in srgb, var(--mantine-color-${tone}-filled) 42%, var(--monosuite-color-border))`,
        background: `linear-gradient(
          145deg,
          color-mix(in srgb, var(--mantine-color-${tone}-filled) 12%, var(--monosuite-color-surface)),
          var(--monosuite-color-surface)
        )`,
      }}
    >
      <Group gap="xs" wrap="nowrap" mb={6} align="center">
        <ThemeIcon
          variant="light"
          color={tone}
          size="sm"
          radius="sm"
          aria-hidden
        >
          <IconAlertTriangle size={14} />
        </ThemeIcon>
        <Badge size="xs" variant="light" color={tone} className="monosuite-badge-with-icon">
          Severity
        </Badge>
      </Group>
      <Text size="md" fw={700} lh={1.3}>
        Incident severity
      </Text>
      <Badge mt={8} color={tone} variant="filled" className="monosuite-badge-with-icon">
        {severity}
      </Badge>
    </Paper>
  );
}

export function CommanderQuestionCard({
  question,
  selected,
}: {
  question: CommanderQuestion;
  selected?: boolean;
}) {
  const answeredCount = question.roleAnswers?.length ?? (question.answer ? 1 : 0);

  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--commander"
      data-selected={selected ? 'true' : undefined}
      data-required={question.required ? 'true' : undefined}
      withBorder
      radius="md"
      p="sm"
    >
      <Group gap="xs" wrap="nowrap" mb={6}>
        <ThemeIcon variant="light" color="brand" size="sm" radius="sm" aria-hidden>
          <IconUserStar size={14} />
        </ThemeIcon>
        <Badge size="xs" variant="filled" color="brand">
          Custom
        </Badge>
        <Badge size="xs" variant="light" color={question.required ? 'warning' : 'neutral'}>
          {question.required ? 'Required' : 'Optional'}
        </Badge>
      </Group>
      <Text size="md" fw={700} lh={1.3} lineClamp={3}>
        {question.title}
      </Text>
      <Text size="xs" c="dimmed" mt={6}>
        Answer by · {question.assigneeName}
      </Text>
      {answeredCount > 0 ? (
        <Text size="xs" c="success" mt={4} lineClamp={1}>
          {answeredCount} answer{answeredCount === 1 ? '' : 's'}
        </Text>
      ) : null}
    </Paper>
  );
}

export function DetectedPhaseInspector({
  title,
  description,
  severity,
  onOpenIncidentContext,
  incidentContextOpen = false,
  evidenceItems,
  onAddEvidence,
  onRemoveEvidence,
}: {
  title: string;
  description: string;
  severity: RoomSeverity;
  onOpenIncidentContext?: () => void;
  incidentContextOpen?: boolean;
  evidenceItems: EvidenceItem[];
  onAddEvidence?: (kind?: EvidenceKind) => void;
  onRemoveEvidence?: (id: string) => void;
}) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon variant="light" color="neutral" size="sm" radius="sm" aria-hidden>
            <IconAlertTriangle size={14} />
          </ThemeIcon>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Discovered incident
          </Text>
        </Group>
        <Box
          p="sm"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface-sunken)',
          }}
        >
          <Group gap={6} mb={6}>
            <Badge color={ROOM_SEVERITY_COLOR[severity]} variant="light" size="sm">
              {severity}
            </Badge>
          </Group>
          <Text size="sm" fw={700} lh={1.4}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" mt={6} lh={1.5}>
            {description}
          </Text>
        </Box>
      </Stack>
      <Text size="sm" lh={1.5} c="dimmed">
        {PHASE_GUIDANCE.detected}
      </Text>
      {onOpenIncidentContext ? (
        <Button
          variant={incidentContextOpen ? 'default' : 'light'}
          color="teal"
          fullWidth
          onClick={onOpenIncidentContext}
        >
          {incidentContextOpen ? 'Hide incident context' : 'View incident context'}
        </Button>
      ) : null}
      <PhaseEvidenceInspector
        items={evidenceItems}
        onAdd={onAddEvidence}
        onRemove={onRemoveEvidence}
      />
    </Stack>
  );
}

export function TriagePhaseInspector({
  severity,
  notes,
  onNotesChange,
  evidenceItems,
  onAddEvidence,
  onRemoveEvidence,
}: {
  severity: RoomSeverity;
  notes: string;
  onNotesChange?: (value: string) => void;
  evidenceItems?: EvidenceItem[];
  onAddEvidence?: (kind?: EvidenceKind) => void;
  onRemoveEvidence?: (id: string) => void;
}) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon
            variant="light"
            color={ROOM_SEVERITY_COLOR[severity]}
            size="sm"
            radius="sm"
            aria-hidden
          >
            <IconAlertTriangle size={14} />
          </ThemeIcon>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Incident severity
          </Text>
        </Group>
        <Box
          p="sm"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface-sunken)',
          }}
        >
          <Text size="sm" lh={1.5}>
            Severity discovered from the linked incident signal.
          </Text>
          <Badge mt="sm" color={ROOM_SEVERITY_COLOR[severity]} variant="filled" size="lg">
            {severity}
          </Badge>
        </Box>
      </Stack>
      <Textarea
        label="Triage notes"
        placeholder="Record triage rationale, exceptions, or handoff notes…"
        minRows={3}
        autosize
        maxRows={8}
        value={notes}
        onChange={(event) => onNotesChange?.(event.currentTarget.value)}
      />
      {evidenceItems ? (
        <PhaseEvidenceInspector
          items={evidenceItems}
          onAdd={onAddEvidence}
          onRemove={onRemoveEvidence}
        />
      ) : null}
    </Stack>
  );
}

export function PhaseEvidenceInspector({
  items,
  onAdd,
  onRemove,
}: {
  items: EvidenceItem[];
  onAdd?: (kind?: EvidenceKind) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon variant="light" color="neutral" size="sm" radius="sm" aria-hidden>
            <IconPaperclip size={14} />
          </ThemeIcon>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Evidence
            <Text span c="dimmed" fw={600}>
              {' '}
              · {items.length}
            </Text>
          </Text>
        </Group>
        {onAdd ? (
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <Button size="compact-xs" variant="light" color="teal" leftSection={<IconPlus size={12} />}>
                Add
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Add evidence</Menu.Label>
              <Menu.Item leftSection={<IconUpload size={16} />} onClick={() => onAdd('file')}>
                Upload file
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDatabaseImport size={16} />}
                onClick={() => onAdd('source')}
              >
                Link source record
              </Menu.Item>
              <Menu.Item leftSection={<IconLink size={16} />} onClick={() => onAdd('link')}>
                Reference link
              </Menu.Item>
              <Menu.Item leftSection={<IconNotes size={16} />} onClick={() => onAdd('note')}>
                Evidence note
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : null}
      </Group>

      {items.length === 0 ? (
        <Box
          p="sm"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface-sunken)',
          }}
        >
          <Text size="sm" c="dimmed">
            No evidence attached to this phase yet.
          </Text>
        </Box>
      ) : (
        <Stack gap={6}>
          {items.map((item) => {
            const meta = EVIDENCE_KIND_META[item.kind];
            const Icon = meta.icon;
            return (
              <Box
                key={item.id}
                p="sm"
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  border: '1px solid var(--monosuite-color-border)',
                  background: 'var(--monosuite-color-surface)',
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                  <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0, flex: 1 }}>
                    <ThemeIcon variant="light" color={meta.color} size="md" radius="sm" aria-hidden>
                      <Icon size={16} />
                    </ThemeIcon>
                    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                      <Group gap={6} wrap="nowrap">
                        <Badge size="xs" variant="light" color={meta.color}>
                          {meta.label}
                        </Badge>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {item.by} · {item.time}
                        </Text>
                      </Group>
                      <Text size="sm" fw={600} lineClamp={2}>
                        {item.name}
                      </Text>
                      {item.sizeBytes != null ? (
                        <Text size="xs" c="dimmed">
                          {formatBytes(item.sizeBytes)}
                        </Text>
                      ) : null}
                      {item.note ? (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {item.note}
                        </Text>
                      ) : null}
                    </Stack>
                  </Group>
                  {onRemove ? (
                    <Tooltip label="Remove evidence">
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => onRemove(item.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  ) : null}
                </Group>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

export function CommanderQuestionInspector({
  question,
  canAnswer,
  canManage = false,
  draft,
  onDraftChange,
  choiceValues,
  onChoiceValuesChange,
  choiceOther,
  onChoiceOtherChange,
  onSave,
  onUpdate,
  onRemove,
  assigneeOptions = [],
  participants = [],
  commanderParticipantId = '',
}: {
  question: CommanderQuestion;
  canAnswer: boolean;
  canManage?: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  choiceValues: string[];
  onChoiceValuesChange: (values: string[]) => void;
  choiceOther: string;
  onChoiceOtherChange: (value: string) => void;
  onSave: () => void;
  onUpdate?: (input: {
    title: string;
    assignee: CommanderAssignee;
    required: boolean;
  }) => void;
  onRemove?: () => void;
  assigneeOptions?: { value: string; label: string }[];
  participants?: Participant[];
  commanderParticipantId?: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assigneePeople =
    question.assignee.type === 'role'
      ? peopleForTaskRole(question.assignee.role, participants, commanderParticipantId)
      : peopleForPersonAssignee(
          question.assignee.id,
          question.assignee.name,
          participants,
          commanderParticipantId,
        );
  const quorum = taskQuorumStatus(question.roleAnswers, assigneePeople);
  const inPool = isPersonInAssigneePool(CURRENT_USER.id, assigneePeople);
  const selectValid =
    question.answerType === 'select'
      ? isChoiceAnswerValid(choiceValues, choiceOther, question.selectionMode)
      : draft.trim().length > 0;
  const canSubmit = canAnswer && inPool && selectValid && !quorum.isComplete;

  return (
    <Stack gap="md">
      <Group gap={6} justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap={6}>
          <Badge variant="filled" color="brand" size="sm">
            Custom
          </Badge>
          <Badge variant="light" color={question.required ? 'warning' : 'neutral'} size="sm">
            {question.required ? 'Required' : 'Optional'}
          </Badge>
        </Group>
        {canManage ? (
          <Group gap={4} wrap="nowrap">
            <Tooltip label="Edit custom question">
              <ActionIcon
                variant="subtle"
                color="neutral"
                size="sm"
                aria-label="Edit custom question"
                onClick={() => setEditOpen(true)}
              >
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete custom question">
              <ActionIcon
                variant="subtle"
                color="danger"
                size="sm"
                aria-label="Delete custom question"
                onClick={() => setConfirmDelete(true)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : null}
      </Group>
      <Text size="sm" fw={700} lh={1.45}>
        {question.title}
      </Text>

      <TaskQuorumProgress
        roleLabel={question.assigneeName}
        role={question.assignee.type === 'role' ? question.assignee.role : undefined}
        quorum={quorum}
      />

      {(question.roleAnswers ?? []).length > 0 ? (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Submitted answers
          </Text>
          {(question.roleAnswers ?? []).map((answer) => (
            <Paper
              key={answer.participantId}
              withBorder
              radius="sm"
              p="sm"
              bg="var(--monosuite-color-surface-sunken)"
            >
              <Text size="xs" fw={700}>
                {answer.participantName} · {answer.answeredAt}
              </Text>
              <Text size="sm" lh={1.45}>
                {formatTaskAnswerDisplay(answer)}
              </Text>
            </Paper>
          ))}
        </Stack>
      ) : question.answer ? (
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="xs" c="dimmed" fw={700} mb={4}>
            Answer
          </Text>
          <Text size="sm" lh={1.5}>
            {question.answer}
          </Text>
        </Paper>
      ) : null}

      {!quorum.isComplete && inPool && canAnswer ? (
        <Stack gap="sm">
          {question.answerType === 'select' && question.options?.length ? (
            <TaskChoiceControl
              options={question.options}
              selectionMode={question.selectionMode}
              allowOther={question.allowOther}
              values={choiceValues}
              otherText={choiceOther}
              onValuesChange={onChoiceValuesChange}
              onOtherTextChange={onChoiceOtherChange}
              label="Your answer"
            />
          ) : (
            <Textarea
              label="Your answer"
              placeholder="Write the response…"
              minRows={3}
              autosize
              maxRows={8}
              value={draft}
              onChange={(event) => onDraftChange(event.currentTarget.value)}
            />
          )}
          <Group justify="flex-end">
            <Button color="brand" disabled={!canSubmit} onClick={onSave}>
              Submit answer
            </Button>
          </Group>
        </Stack>
      ) : !quorum.isComplete && !inPool ? (
        <Text size="xs" c="dimmed">
          Waiting for {question.assigneeName} to respond.
        </Text>
      ) : null}

      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit custom question"
        centered
        size="md"
      >
        <AddCommanderQuestionFormInner
          phaseId={question.phaseId}
          assigneeOptions={assigneeOptions}
          initialTitle={question.title}
          initialAssignee={question.assignee}
          initialRequired={question.required}
          submitLabel="Save changes"
          onSubmit={(input) => {
            onUpdate?.({
              title: input.title,
              assignee: input.assignee,
              required: input.required,
            });
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete custom question?"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed" lh={1.5}>
            This removes “{question.title}” from the phase. The action is recorded in Activity.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              leftSection={<IconTrash size={14} />}
              onClick={() => {
                onRemove?.();
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export function AddCommanderQuestionForm({
  phaseId,
  assigneeOptions,
  onSubmit,
  iconOnly = false,
}: {
  phaseId: string;
  assigneeOptions: { value: string; label: string }[];
  onSubmit: (input: {
    phaseId: string;
    title: string;
    assignee: CommanderAssignee;
    required: boolean;
  }) => void;
  iconOnly?: boolean;
}) {
  const [opened, setOpened] = useState(false);

  if (!canAddCommanderQuestion(phaseId)) return null;

  return (
    <>
      {iconOnly ? (
        <Tooltip label="Custom question">
          <ActionIcon
            variant="light"
            color="brand"
            size="sm"
            radius="sm"
            aria-label="Custom question"
            onClick={() => setOpened(true)}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Button
          variant="light"
          color="brand"
          fullWidth
          leftSection={<IconPlus size={14} />}
          onClick={() => setOpened(true)}
        >
          Custom question
        </Button>
      )}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Custom question"
        centered
        size="md"
      >
        <AddCommanderQuestionFormInner
          phaseId={phaseId}
          assigneeOptions={assigneeOptions}
          onSubmit={(input) => {
            onSubmit(input);
            setOpened(false);
          }}
          onCancel={() => setOpened(false)}
        />
      </Modal>
    </>
  );
}

function AddCommanderQuestionFormInner({
  phaseId,
  assigneeOptions,
  onSubmit,
  onCancel,
  initialTitle = '',
  initialAssignee,
  initialRequired = true,
  submitLabel = 'Add question',
}: {
  phaseId: string;
  assigneeOptions: { value: string; label: string }[];
  onSubmit: (input: {
    phaseId: string;
    title: string;
    assignee: CommanderAssignee;
    required: boolean;
  }) => void;
  onCancel?: () => void;
  initialTitle?: string;
  initialAssignee?: CommanderAssignee;
  initialRequired?: boolean;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [assigneeKind, setAssigneeKind] = useState<'role' | 'person'>(
    initialAssignee?.type === 'person' ? 'person' : 'role',
  );
  const [role, setRole] = useState<AssignableTaskRole>(
    initialAssignee?.type === 'role' ? initialAssignee.role : 'investigator',
  );
  const [personId, setPersonId] = useState(
    initialAssignee?.type === 'person'
      ? initialAssignee.id
      : (assigneeOptions[0]?.value ?? ''),
  );
  const [required, setRequired] = useState(initialRequired);

  const assigneeReady = assigneeKind === 'role' ? Boolean(role) : Boolean(personId);

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Optional custom question for this phase. Assign a role quorum or a single person.
      </Text>
      <TextInput
        label="Question title"
        placeholder="What should the assignee confirm?"
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        data-autofocus
      />
      <Select
        label="Assign to"
        data={[
          { value: 'role', label: 'Role (quorum)' },
          { value: 'person', label: 'Person' },
        ]}
        value={assigneeKind}
        onChange={(value) => setAssigneeKind(value === 'person' ? 'person' : 'role')}
        allowDeselect={false}
      />
      {assigneeKind === 'role' ? (
        <Select
          label="Role"
          data={ASSIGNABLE_TASK_ROLE_OPTIONS}
          value={role}
          onChange={(value) => setRole((value as AssignableTaskRole) ?? 'investigator')}
          allowDeselect={false}
        />
      ) : (
        <Select
          label="Person"
          data={assigneeOptions}
          value={personId || null}
          onChange={(value) => setPersonId(value ?? '')}
          allowDeselect={false}
        />
      )}
      <Switch
        label="Required to finish phase"
        checked={required}
        onChange={(event) => setRequired(event.currentTarget.checked)}
      />
      <Group justify="flex-end" gap="xs">
        {onCancel ? (
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          color="brand"
          leftSection={submitLabel === 'Add question' ? <IconPlus size={14} /> : <IconPencil size={14} />}
          disabled={!title.trim() || !assigneeReady}
          onClick={() => {
            const assignee: CommanderAssignee =
              assigneeKind === 'role'
                ? { type: 'role', role }
                : {
                    type: 'person',
                    id: personId,
                    name:
                      assigneeOptions.find((option) => option.value === personId)?.label ??
                      TASK_ROLE_LABEL.investigator,
                  };
            onSubmit({
              phaseId,
              title: title.trim(),
              assignee,
              required,
            });
            setTitle('');
            setRequired(true);
          }}
        >
          {submitLabel}
        </Button>
      </Group>
    </Stack>
  );
}

export function PhasePolicyControl({
  step,
  isCommander,
  skipped,
  onSetSkippable,
  onSkip,
}: {
  step: WorkflowStep;
  isCommander: boolean;
  skipped: boolean;
  onSetSkippable?: (phaseId: string, skippable: boolean) => void;
  onSkip?: (phaseId: string) => void;
}) {
  const skippable = Boolean(step.skippable);

  return (
    <Popover
      width={280}
      position="bottom-end"
      shadow="md"
      withArrow
      withinPortal
      middlewares={{ flip: true, shift: true }}
    >
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          color="neutral"
          size="sm"
          radius="sm"
          aria-label="Phase settings"
          title="Phase settings"
        >
          <IconSettings size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p="sm">
        <Stack gap="sm">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Phase settings
          </Text>
          <Group gap={6}>
            <Badge color={skippable ? 'neutral' : 'teal'} variant="light" size="sm">
              {skippable ? 'Skippable' : 'Required'}
            </Badge>
            {skipped ? (
              <Badge color="neutral" variant="outline" size="sm">
                Skipped
              </Badge>
            ) : null}
          </Group>
          {isCommander ? (
            <Switch
              label="Participants may skip this phase"
              description="When on, responders can continue without finishing this phase."
              checked={skippable}
              onChange={(event) => onSetSkippable?.(step.id, event.currentTarget.checked)}
            />
          ) : (
            <Text size="sm" c="dimmed" lh={1.45}>
              {skippable
                ? 'This phase can be skipped by participants.'
                : 'This phase is required to progress.'}
            </Text>
          )}
          {!isCommander && skippable && !skipped ? (
            <Button
              variant="light"
              color="neutral"
              size="xs"
              fullWidth
              onClick={() => onSkip?.(step.id)}
            >
              Skip phase
            </Button>
          ) : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

/** @deprecated Prefer PhasePolicyControl in the inspector header. */
export function PhaseSkippableControls(props: {
  step: WorkflowStep;
  isCommander: boolean;
  skipped: boolean;
  onSetSkippable?: (phaseId: string, skippable: boolean) => void;
  onSkip?: (phaseId: string) => void;
}) {
  return <PhasePolicyControl {...props} />;
}
