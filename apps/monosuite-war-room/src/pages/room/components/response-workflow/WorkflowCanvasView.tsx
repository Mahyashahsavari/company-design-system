import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowBackUp,
  IconBriefcase,
  IconCheck,
  IconChevronRight,
  IconClipboardList,
  IconLock,
  IconMessageQuestion,
  IconRadio,
  IconRoute2,
  IconScale,
  IconSearch,
  IconShieldCheck,
  IconTool,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { CURRENT_USER } from '../../../../shared/constants';
import type {
  CommanderAssignee,
  CommanderQuestion,
  EvidenceItem,
  EvidenceKind,
  Participant,
  Question,
  RoomSeverity,
  WorkflowStep,
} from '../../data';
import {
  formatTaskAnswerDisplay,
  isPersonInAssigneePool,
  makePersonAnswer,
  peopleForPersonAssignee,
  peopleForTaskRole,
  TASK_ROLE_COLOR,
  TASK_ROLE_LABEL,
  taskQuorumStatus,
  upsertPersonAnswer,
} from '../../taskQuorum';
import {
  isWorkItemAnswered,
  summarizeWorkAnswers,
  workDependsSatisfiedWithCatalog,
  workItemQuorum,
  type WorkAnswersState,
} from '../../workAnswers';
import { isChoiceAnswerValid, TaskChoiceControl } from '../TaskChoiceControl';
import { TaskQuorumProgress } from '../TaskQuorumProgress';
import {
  COLLAB_THREADS,
  PHASE_GUIDANCE,
  WORKFLOW_CANVAS_WORK,
  threadsForPhase,
  workItemsForPhase,
  type CollabThreadDef,
  type WorkflowWorkItem,
  type WorkflowWorkRole,
} from './workflowCanvasData';
import {
  AddCommanderQuestionForm,
  CommanderQuestionCard,
  CommanderQuestionInspector,
  DetectedPhaseInspector,
  EvidenceSummaryCard,
  PhaseEvidenceInspector,
  PhasePolicyControl,
  TRIAGE_SEVERITY_NODE_ID,
  TriagePhaseInspector,
  TriageSeverityCard,
  commanderNodeId,
} from './workflowCanvasPhaseExtras';
import { ResponseJourneyView } from './ResponseJourneyView';

interface WorkflowCanvasViewProps {
  steps: WorkflowStep[];
  workflowName?: string;
  questions?: Question[];
  onSubmitCollabAnswer?: (questionId: number, text: string) => void;
  onRecordDecision?: (questionId: number, values: string[], otherText?: string) => void;
  fillHeight?: boolean;
  isCommander?: boolean;
  participants: Participant[];
  commanderParticipantId: string;
  evidence?: EvidenceItem[];
  commanderQuestions?: CommanderQuestion[];
  incidentTitle?: string;
  incidentDescription?: string;
  incidentSeverity?: RoomSeverity;
  triageNotes?: string;
  onTriageNotesChange?: (value: string) => void;
  onOpenIncidentContext?: () => void;
  incidentContextOpen?: boolean;
  onAddEvidence?: (kind?: EvidenceKind, phaseId?: string | null) => void;
  onRemoveEvidence?: (id: string) => void;
  onAddCommanderQuestion?: (input: {
    phaseId: string;
    title: string;
    assignee: CommanderAssignee;
    required: boolean;
  }) => void;
  onUpdateCommanderQuestion?: (
    id: string,
    input: {
      title: string;
      assignee: CommanderAssignee;
      required: boolean;
    },
  ) => void;
  onRemoveCommanderQuestion?: (id: string) => void;
  onAnswerCommanderQuestion?: (
    id: string,
    payload: { values: string[]; otherText?: string },
  ) => void;
  onSetPhaseSkippable?: (phaseId: string, skippable: boolean) => void;
  onSkipPhase?: (phaseId: string) => void;
  skippedPhases?: string[];
  assigneeOptions?: { value: string; label: string }[];
  workItems?: WorkflowWorkItem[];
  collabThreads?: CollabThreadDef[];
  completedPhaseIds?: string[];
  onCompletePhase?: (phaseId: string) => void;
}

type CanvasPhaseStatus = 'done' | 'active' | 'locked' | 'queued';
type WorkRuntimeStatus = 'open' | 'answered' | 'blocked' | 'ready';
type CollabKind = 'question' | 'finding' | 'decision';

interface PhaseNodeData {
  label: string;
  number: string;
  meta: string;
  status: CanvasPhaseStatus;
  selected: boolean;
  expanded: boolean;
  evidenceCount: number;
  phaseId: string;
  [key: string]: unknown;
}

interface WorkNodeData {
  title: string;
  roleLabel: string;
  role: WorkflowWorkRole;
  meta: string;
  status: WorkRuntimeStatus;
  selected: boolean;
  [key: string]: unknown;
}

interface CollabNodeData {
  kind: CollabKind;
  code: string;
  title: string;
  meta: string;
  statusLabel: string;
  selected: boolean;
  focus: boolean;
  trail: boolean;
  blocked: boolean;
  blockedReason: string | null;
  threadLabel: string;
  answerPreview: string | null;
  /** Who should respond on this item. */
  assigneeLabel: string;
  /** Short action cue when this item is the active turn. */
  actionHint: string | null;
  [key: string]: unknown;
}

interface ThreadNodeData {
  label: string;
  meta: string;
  [key: string]: unknown;
}

interface EvidenceNodeData {
  phaseId: string;
  count: number;
  selected: boolean;
  [key: string]: unknown;
}

interface TriageSeverityNodeData {
  severity: RoomSeverity;
  selected: boolean;
  [key: string]: unknown;
}

interface CommanderQuestionNodeData {
  question: CommanderQuestion;
  selected: boolean;
  [key: string]: unknown;
}

type PhaseFlowNode = Node<PhaseNodeData, 'phaseNode'>;
type WorkFlowNode = Node<WorkNodeData, 'workNode'>;
type CollabFlowNode = Node<CollabNodeData, 'collabNode'>;
type ThreadFlowNode = Node<ThreadNodeData, 'threadNode'>;
type EvidenceFlowNode = Node<EvidenceNodeData, 'evidenceNode'>;
type TriageSeverityFlowNode = Node<TriageSeverityNodeData, 'triageSeverityNode'>;
type CommanderQuestionFlowNode = Node<CommanderQuestionNodeData, 'commanderQuestionNode'>;
type CanvasNode =
  | PhaseFlowNode
  | WorkFlowNode
  | CollabFlowNode
  | ThreadFlowNode
  | EvidenceFlowNode
  | TriageSeverityFlowNode
  | CommanderQuestionFlowNode;

const ROLE_ICON: Record<WorkflowWorkRole, typeof IconBriefcase> = {
  owner: IconBriefcase,
  admin: IconTool,
  investigator: IconSearch,
  generated: IconShieldCheck,
  responder: IconUsers,
};

const PHASE_Y = 28;
/**
 * First child-row Y under phase cards. Phase chrome = number + title (≤2) + meta (≤2)
 * + evidence strip; 168 was too tight and overlapped work/triage cards.
 */
const WORK_Y = 228;
const SYSTEM_Y = WORK_Y;
/** Card CSS width — keep in sync with `.monosuite-workflow-canvas-node--work`. */
const CARD_WIDTH = 204;
/** Horizontal stride: card width + clear gutter (was 280 → cards nearly touched). */
const ITEM_GAP_X = CARD_WIDTH + 72;
/**
 * Vertical stride between lanes. Cards grew taller (quorum meta / collab hints);
 * 180 caused row overlaps — keep well above estimated card height.
 */
const LANE_GAP_Y = 236;
/** Extra air before collab threads under the work grid. */
const THREAD_OFFSET_Y = 36;
/** Phase card CSS width — keep in sync with `.monosuite-workflow-canvas-node--phase`. */
const PHASE_CARD_WIDTH = 180;
/** Minimum clear gap between phase cards so connectors stay readable. */
const PHASE_GAP_X = 48;
const PHASE_ORIGIN_X = 24;
const NODE_MOVE_TRANSITION = 'box-shadow 280ms ease, opacity 220ms ease';

/** How many work-item rows the investigation board uses. */
const INVESTIGATION_WORK_ROWS = 2;

/** Left-edge stride between phase cards; scales slightly with phase count. */
function phaseSlotWidth(stepCount: number): number {
  if (stepCount <= 5) return PHASE_CARD_WIDTH + PHASE_GAP_X + 8;
  if (stepCount <= 7) return PHASE_CARD_WIDTH + PHASE_GAP_X;
  return PHASE_CARD_WIDTH + Math.max(32, PHASE_GAP_X - 8);
}

/**
 * Fit the workflow into the visible React Flow viewport (left of the inspector).
 * - No child cards: frame the full phase spine (nothing slides under panels).
 * - With child cards: fit that phase cluster so the phase + cards are fully visible.
 */
function fitCanvasToView(
  flowInstance: ReactFlowInstance<CanvasNode, Edge>,
  expandedPhaseId: string | null,
  duration = 280,
  workCatalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
) {
  const all = flowInstance.getNodes();
  if (all.length === 0) return;

  const phaseNodes = all.filter((node) => node.type === 'phaseNode');
  const cluster = expandedPhaseId
    ? all.filter((node) => {
        if (node.id === expandedPhaseId) return true;
        if (node.type === 'workNode') {
          return findWorkItem(node.id, workCatalog)?.phaseId === expandedPhaseId;
        }
        if (node.type === 'triageSeverityNode') {
          return expandedPhaseId === 'triage';
        }
        if (node.type === 'commanderQuestionNode') {
          return (
            (node.data as CommanderQuestionNodeData).question.phaseId === expandedPhaseId
          );
        }
        if (expandedPhaseId === 'investigation') {
          return node.type === 'collabNode' || node.type === 'threadNode';
        }
        return false;
      })
    : [];

  const hasChildren = cluster.some((node) => node.id !== expandedPhaseId);
  const targets =
    hasChildren && cluster.length > 0
      ? cluster
      : phaseNodes.length > 0
        ? phaseNodes
        : all;

  flowInstance.fitView({
    nodes: targets,
    padding: hasChildren ? 0.28 : 0.2,
    duration,
    maxZoom: hasChildren ? 1.35 : 1,
    minZoom: 0.35,
  });
}

function CanvasEdgeSync({ nodeIds }: { nodeIds: string[] }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const signature = nodeIds.join('|');

  useEffect(() => {
    const ids = signature ? signature.split('|') : [];
    // After width/layout changes, re-measure handles so edges snap to dots.
    const frame = window.requestAnimationFrame(() => {
      ids.forEach((id) => updateNodeInternals(id));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [signature, updateNodeInternals]);

  return null;
}

function phaseColumns(
  steps: WorkflowStep[],
  expandedPhaseId: string | null,
): Map<string, { x: number; width: number; expanded: boolean }> {
  const columns = new Map<string, { x: number; width: number; expanded: boolean }>();
  const slot = phaseSlotWidth(steps.length);
  steps.forEach((step, index) => {
    columns.set(step.id, {
      x: PHASE_ORIGIN_X + index * slot,
      width: slot,
      expanded: step.id === expandedPhaseId,
    });
  });
  return columns;
}

function PhaseFlowCard({ data }: NodeProps<PhaseFlowNode>) {
  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--phase"
      data-status={data.status}
      data-selected={data.selected ? 'true' : undefined}
      data-expanded={data.expanded ? 'true' : 'false'}
      withBorder
      radius="sm"
      p="sm"
    >
      <Handle type="target" position={Position.Top} id="top" className="monosuite-workflow-canvas-handle" />
      <Handle type="target" position={Position.Left} id="left" className="monosuite-workflow-canvas-handle" />
      <Group justify="space-between" gap={6} wrap="nowrap" mb={6}>
        <Text size="10px" fw={800} c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {data.number}
        </Text>
        <PhaseStatusChip status={data.status} />
      </Group>
      <Text size="md" fw={700} lh={1.3} lineClamp={2}>
        {data.label}
      </Text>
      <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
        {data.meta}
      </Text>
      <Box className="monosuite-workflow-canvas-phase-evidence" aria-hidden>
        <Text size="10px" c="dimmed" fw={700} tt="uppercase" lts="0.04em">
          Evidence
        </Text>
        <Text size="xs" fw={700}>
          {data.evidenceCount}
        </Text>
      </Box>
      <Handle type="source" position={Position.Right} id="right" className="monosuite-workflow-canvas-handle" />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="monosuite-workflow-canvas-handle"
      />
    </Paper>
  );
}

function WorkFlowCard({ data }: NodeProps<WorkFlowNode>) {
  const Icon = ROLE_ICON[data.role];

  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--work"
      data-role={data.role}
      data-status={data.status}
      data-selected={data.selected ? 'true' : undefined}
      withBorder
      radius="md"
      p="sm"
    >
      <Handle type="target" position={Position.Top} id="top" className="monosuite-workflow-canvas-handle" />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="monosuite-workflow-canvas-handle"
      />
      <Box className="monosuite-workflow-canvas-node-kind">
        <Badge
          size="xs"
          variant="filled"
          color={roleColor(data.role)}
          className="monosuite-badge-with-icon"
          leftSection={<Icon size={11} />}
        >
          {data.roleLabel}
        </Badge>
        <WorkStatusChip status={data.status} />
      </Box>
      <Text size="md" fw={data.selected || data.status === 'open' || data.status === 'ready' ? 800 : 700} lh={1.3} lineClamp={2}>
        {data.title}
      </Text>
      <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
        {data.meta}
      </Text>
      {(data.status === 'open' || data.status === 'ready') && data.selected ? (
        <Badge size="xs" variant="filled" color="teal" mt={8}>
          Your turn · {data.roleLabel}
        </Badge>
      ) : (
        <Text size="xs" c="dimmed" mt={6} lineClamp={1}>
          Answer by · {data.roleLabel}
        </Text>
      )}
      <Handle type="source" position={Position.Bottom} id="bottom" className="monosuite-workflow-canvas-handle" />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="monosuite-workflow-canvas-handle"
      />
    </Paper>
  );
}

function CollabFlowCard({ data }: NodeProps<CollabFlowNode>) {
  const Icon =
    data.kind === 'decision' ? IconScale : data.kind === 'finding' ? IconShieldCheck : IconMessageQuestion;
  // Q=teal · F=accent · D=brand (indigo) — distinct, calmer than warning amber in dark mode.
  const color =
    data.kind === 'decision' ? 'brand' : data.kind === 'finding' ? 'accent' : 'teal';
  const kindLabel =
    data.kind === 'decision' ? 'Decision' : data.kind === 'finding' ? 'Finding' : 'Question';
  const statusColor = data.blocked
    ? 'warning'
    : data.focus
      ? 'teal'
      : data.statusLabel === 'Answered' || data.statusLabel === 'Done'
        ? 'success'
        : data.statusLabel === 'Decision'
          ? 'brand'
          : 'neutral';

  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--collab"
      data-kind={data.kind}
      data-focus={data.focus ? 'true' : undefined}
      data-trail={data.trail ? 'true' : undefined}
      data-blocked={data.blocked ? 'true' : undefined}
      data-selected={data.selected ? 'true' : undefined}
      withBorder
      radius="md"
      p="sm"
    >
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="monosuite-workflow-canvas-handle"
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="monosuite-workflow-canvas-handle"
      />
      <Text size="10px" c="dimmed" fw={700} mb={4} lineClamp={1}>
        {data.threadLabel}
      </Text>
      <Box className="monosuite-workflow-canvas-node-kind">
        <Badge size="xs" variant="filled" color={color} className="monosuite-badge-with-icon" leftSection={<Icon size={11} />}>
          {data.code}
        </Badge>
        <Badge
          size="xs"
          variant={data.focus ? 'filled' : 'light'}
          color={statusColor}
          className="monosuite-badge-with-icon"
          leftSection={data.blocked ? <IconLock size={10} /> : undefined}
        >
          {data.blocked ? 'Blocked' : data.focus ? 'Your turn' : data.statusLabel}
        </Badge>
      </Box>
      <Text
        size="10px"
        fw={800}
        tt="uppercase"
        c={color}
        mb={4}
        style={{ letterSpacing: '0.06em' }}
      >
        {kindLabel}
      </Text>
      <Text
        size={data.trail || data.blocked ? 'sm' : 'md'}
        fw={data.focus || data.selected ? 800 : 700}
        lh={1.3}
        lineClamp={2}
      >
        {data.title}
      </Text>
      {data.focus && data.actionHint ? (
        <Text size="xs" c="teal" fw={700} mt={6} lineClamp={1}>
          {data.actionHint}
        </Text>
      ) : null}
      {data.blocked && data.blockedReason ? (
        <Text size="xs" c="warning" mt={6} lineClamp={2}>
          {data.blockedReason}
        </Text>
      ) : data.answerPreview ? (
        <Box className="monosuite-workflow-canvas-node-answer">
          <Text size="10px" c="dimmed" lineClamp={2}>
            {data.answerPreview}
          </Text>
        </Box>
      ) : (
        <Text size="xs" c="dimmed" mt={4} lineClamp={1}>
          Answer by · {data.assigneeLabel}
        </Text>
      )}
      {!data.blocked && (data.focus || data.selected) ? (
        <Badge size="xs" variant="light" color="teal" mt={8}>
          Answer by · {data.assigneeLabel}
        </Badge>
      ) : null}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="monosuite-workflow-canvas-handle"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="monosuite-workflow-canvas-handle"
      />
    </Paper>
  );
}

function ThreadFlowCard({ data }: NodeProps<ThreadFlowNode>) {
  return (
    <Paper
      className="monosuite-workflow-canvas-node monosuite-workflow-canvas-node--thread"
      withBorder
      radius="sm"
      px="sm"
      py={8}
    >
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="monosuite-workflow-canvas-handle"
      />
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="monosuite-workflow-canvas-handle"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="monosuite-workflow-canvas-handle"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="monosuite-workflow-canvas-handle"
      />
      <Text size="10px" fw={800} tt="uppercase" c="teal" style={{ letterSpacing: '0.06em' }}>
        Thread
      </Text>
      <Text size="md" fw={700} lh={1.3} lineClamp={1}>
        {data.label}
      </Text>
      <Text size="xs" c="dimmed" lineClamp={1}>
        {data.meta}
      </Text>
    </Paper>
  );
}

const nodeTypes = {
  phaseNode: PhaseFlowCard,
  workNode: WorkFlowCard,
  collabNode: CollabFlowCard,
  threadNode: ThreadFlowCard,
  evidenceNode: EvidenceFlowCard,
  triageSeverityNode: TriageSeverityFlowCard,
  commanderQuestionNode: CommanderQuestionFlowCard,
};

function EvidenceFlowCard({ data }: NodeProps<EvidenceFlowNode>) {
  return (
    <Box>
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="monosuite-workflow-canvas-handle"
      />
      <EvidenceSummaryCard count={data.count} selected={data.selected} />
    </Box>
  );
}

function TriageSeverityFlowCard({ data }: NodeProps<TriageSeverityFlowNode>) {
  return (
    <Box>
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="monosuite-workflow-canvas-handle"
      />
      <TriageSeverityCard severity={data.severity} selected={data.selected} />
    </Box>
  );
}

function CommanderQuestionFlowCard({ data }: NodeProps<CommanderQuestionFlowNode>) {
  return (
    <Box>
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="monosuite-workflow-canvas-handle"
      />
      <CommanderQuestionCard question={data.question} selected={data.selected} />
    </Box>
  );
}

function roleColor(role: WorkflowWorkRole): string {
  return TASK_ROLE_COLOR[role];
}

function PhaseStatusChip({ status }: { status: CanvasPhaseStatus }) {
  if (status === 'done') {
    return (
      <Badge size="xs" variant="light" color="success" className="monosuite-badge-with-icon" leftSection={<IconCheck size={10} />}>
        Done
      </Badge>
    );
  }
  if (status === 'active') {
    return (
      <Badge size="xs" variant="filled" color="teal" className="monosuite-badge-with-icon" leftSection={<IconRadio size={10} />}>
        Active
      </Badge>
    );
  }
  if (status === 'locked') {
    return (
      <Badge size="xs" variant="light" color="neutral" className="monosuite-badge-with-icon" leftSection={<IconLock size={10} />}>
        Locked
      </Badge>
    );
  }
  return (
    <Badge size="xs" variant="light" color="neutral">
      Queued
    </Badge>
  );
}

function WorkStatusChip({ status }: { status: WorkRuntimeStatus }) {
  if (status === 'answered') {
    return (
      <Badge size="xs" variant="light" color="success">
        Answered
      </Badge>
    );
  }
  if (status === 'blocked') {
    return (
      <Badge size="xs" variant="light" color="warning" className="monosuite-badge-with-icon" leftSection={<IconLock size={10} />}>
        Blocked
      </Badge>
    );
  }
  if (status === 'ready') {
    return (
      <Badge size="xs" variant="light" color="teal">
        Ready
      </Badge>
    );
  }
  return (
    <Badge size="xs" variant="light" color="accent">
      Open
    </Badge>
  );
}

function workRuntimeStatus(
  item: WorkflowWorkItem,
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
  investigationComplete: boolean,
  workCatalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
): WorkRuntimeStatus {
  if (item.answerType === 'generated') {
    return investigationComplete ? 'ready' : 'blocked';
  }
  if (
    !workDependsSatisfiedWithCatalog(
      item,
      workCatalog,
      answers,
      participants,
      commanderParticipantId,
    )
  ) {
    return 'blocked';
  }
  const { quorum } = workItemQuorum(item, answers, participants, commanderParticipantId);
  if (quorum.isComplete) return 'answered';
  return 'open';
}

function questionPeople(
  question: Question,
  participants: Participant[],
  commanderParticipantId: string,
) {
  if (!question.assigneeRole) return [];
  return peopleForTaskRole(question.assigneeRole, participants, commanderParticipantId);
}

function isQuestionQuorumComplete(
  question: Question,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  const people = questionPeople(question, participants, commanderParticipantId);
  if (people.length === 0) {
    if (question.status === 'decision') return Boolean(question.decision);
    if (question.status === 'answered') return true;
    return (question.answers?.length ?? 0) > 0;
  }
  return taskQuorumStatus(question.roleAnswers, people).isComplete;
}

function commanderPeople(
  question: CommanderQuestion,
  participants: Participant[],
  commanderParticipantId: string,
) {
  if (question.assignee.type === 'role') {
    return peopleForTaskRole(question.assignee.role, participants, commanderParticipantId);
  }
  return peopleForPersonAssignee(
    question.assignee.id,
    question.assignee.name,
    participants,
    commanderParticipantId,
  );
}

function isCommanderQuorumComplete(
  question: CommanderQuestion,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  return taskQuorumStatus(
    question.roleAnswers,
    commanderPeople(question, participants, commanderParticipantId),
  ).isComplete;
}

function phaseCanvasStatus(
  step: WorkflowStep,
  index: number,
  steps: WorkflowStep[],
  investigationComplete: boolean,
  completedPhaseIds: string[],
  isCommander = false,
): CanvasPhaseStatus {
  if (completedPhaseIds.includes(step.id) || step.status === 'completed') return 'done';
  if (step.status === 'current') return 'active';

  if (step.id === 'containment' && investigationComplete && step.status === 'pending') {
    return 'active';
  }

  if (isCommander) return 'queued';

  if (step.status === 'pending') {
    const currentIdx = steps.findIndex(
      (s) => s.status === 'current' && !completedPhaseIds.includes(s.id),
    );
    if (currentIdx >= 0 && index > currentIdx) return 'locked';

    const earlierIncomplete = steps
      .slice(0, index)
      .some((s) => !completedPhaseIds.includes(s.id) && s.status !== 'completed');
    if (earlierIncomplete) return 'locked';

    // Generated containment (and later phases) stay gated until investigation is complete.
    if (!investigationComplete) {
      const invIdx = steps.findIndex((s) => s.id === 'investigation');
      if (invIdx >= 0 && index > invIdx) return 'locked';
    }
  }

  return 'queued';
}

function phaseMeta(
  step: WorkflowStep,
  status: CanvasPhaseStatus,
  answers: WorkAnswersState,
  participants: Participant[],
  commanderParticipantId: string,
  investigationComplete: boolean,
  workCatalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
  completedPhaseIds: string[] = [],
): string {
  if (completedPhaseIds.includes(step.id) || step.status === 'completed') {
    return 'Complete';
  }

  const required = workItemsForPhase(step.id, workCatalog).filter((w) => w.required);
  if (required.length > 0) {
    const done = required.filter((w) =>
      isWorkItemAnswered(w, answers, participants, commanderParticipantId, investigationComplete),
    ).length;
    return `${done} / ${required.length} required complete`;
  }

  if (step.id === 'containment') {
    if (status === 'locked') return 'Generated from prior answers';
    if (investigationComplete) return '1 generated action ready';
  }
  if (step.id === 'recovery' && status === 'locked') return 'Waiting for containment';
  return step.phase.label;
}

function collabKind(question: Question): CollabKind {
  if (question.status === 'decision' || question.decision) return 'decision';
  if (question.status === 'answered') return 'finding';
  return 'question';
}

function collabCode(question: Question): string {
  const kind = collabKind(question);
  if (kind === 'decision') return `D-${question.id}`;
  if (kind === 'finding') return `F-${question.id}`;
  return `Q-${question.id}`;
}

function collabStatusLabel(question: Question): string {
  if (question.decision) return 'Done';
  if (question.status === 'answered') return 'Done';
  if ((question.answers?.length ?? 0) > 0) return 'Answered';
  return 'Open';
}

function collabAccent(kind: CollabKind): 'teal' | 'accent' | 'brand' {
  if (kind === 'decision') return 'brand';
  if (kind === 'finding') return 'accent';
  return 'teal';
}

/** Prototype assignee for IR canvas guidance (who should respond). */
function collabAssigneeLabel(question: Question): string {
  if (question.roleLabel) return question.roleLabel;
  if (question.assigneeRole) return TASK_ROLE_LABEL[question.assigneeRole];
  const kind = collabKind(question);
  if (kind === 'decision') return 'Commander';
  if (kind === 'finding') return 'Threat Intel';
  return 'Investigator';
}

function collabActionHint(question: Question): string {
  const kind = collabKind(question);
  if (kind === 'decision') return 'Record the decision in the panel';
  if (kind === 'finding') return 'Confirm or challenge this finding';
  return 'Add your answer in the panel';
}

/** Gate complete — unlocks the next item in the same thread. */
function isThreadItemDone(
  question: Question,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  return isQuestionQuorumComplete(question, participants, commanderParticipantId);
}

function needsThreadAction(
  question: Question,
  participants: Participant[],
  commanderParticipantId: string,
): boolean {
  return !isThreadItemDone(question, participants, commanderParticipantId);
}

function collabAnswerPreview(question: Question): string | null {
  if (question.decision) {
    return `Decision · ${question.decision.choice} · ${question.decision.by}`;
  }
  const latest = question.answers?.[question.answers.length - 1];
  if (latest) {
    return `${latest.author}: ${latest.text}`;
  }
  return null;
}

function findWorkItem(
  id: string | null,
  catalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
): WorkflowWorkItem | undefined {
  if (!id) return undefined;
  return catalog.find((item) => item.id === id);
}

function isPhaseCompletable(
  step: WorkflowStep,
  steps: WorkflowStep[],
  completedPhaseIds: string[],
): boolean {
  if (completedPhaseIds.includes(step.id) || step.status === 'completed') return false;
  if (step.status === 'current') return true;
  const index = steps.findIndex((s) => s.id === step.id);
  if (index < 0) return false;
  return steps
    .slice(0, index)
    .every((s) => completedPhaseIds.includes(s.id) || s.status === 'completed');
}

type ThreadItemRole = 'done' | 'now' | 'blocked';

interface ResolvedThreadItem {
  question: Question;
  role: ThreadItemRole;
  blockedReason: string | null;
}

function resolveThreadItems(
  thread: CollabThreadDef,
  questionsById: Map<number, Question>,
  showAll: boolean,
  participants: Participant[],
  commanderParticipantId: string,
): ResolvedThreadItem[] {
  const resolved: ResolvedThreadItem[] = [];
  let sawNow = false;
  let sawBlocked = false;

  thread.itemIds.forEach((id, index) => {
    const question = questionsById.get(id);
    if (!question) return;

    if (showAll) {
      resolved.push({
        question,
        role: needsThreadAction(question, participants, commanderParticipantId) ? 'now' : 'done',
        blockedReason: null,
      });
      return;
    }

    const previousIds = thread.itemIds.slice(0, index);
    const previousDone = previousIds.every((prevId) => {
      const prev = questionsById.get(prevId);
      return prev ? isThreadItemDone(prev, participants, commanderParticipantId) : true;
    });

    if (isThreadItemDone(question, participants, commanderParticipantId)) {
      resolved.push({ question, role: 'done', blockedReason: null });
      return;
    }

    if (!previousDone) {
      if (sawBlocked) return;
      sawBlocked = true;
      const blocker = previousIds
        .map((prevId) => questionsById.get(prevId))
        .reverse()
        .find((prev) => prev && !isThreadItemDone(prev, participants, commanderParticipantId));
      resolved.push({
        question,
        role: 'blocked',
        blockedReason: blocker
          ? `Waiting for ${collabCode(blocker)} in this thread`
          : `Waiting for prior step in ${thread.label}`,
      });
      return;
    }

    if (!sawNow) {
      sawNow = true;
      resolved.push({ question, role: 'now', blockedReason: null });
    }
  });

  return resolved;
}

function buildThreadPlan(
  questions: Question[],
  investigationComplete: boolean,
  participants: Participant[],
  commanderParticipantId: string,
  threadCatalog: CollabThreadDef[] = COLLAB_THREADS,
): {
  threads: Array<{ thread: CollabThreadDef; items: ResolvedThreadItem[] }>;
  focusIds: number[];
  remainingCount: number;
} {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const phaseThreads = threadsForPhase('investigation', threadCatalog);
  const threads = (phaseThreads.length > 0 ? phaseThreads : threadCatalog).map((thread) => ({
    thread,
    items: resolveThreadItems(
      thread,
      questionsById,
      investigationComplete,
      participants,
      commanderParticipantId,
    ),
  }));

  const focusIds = threads.flatMap(({ items }) =>
    items.filter((item) => item.role === 'now').map((item) => item.question.id),
  );

  const remainingCount = threads.reduce((count, { thread, items }) => {
    const visibleIds = new Set(items.map((item) => item.question.id));
    const hiddenActions = thread.itemIds.filter((id) => {
      const question = questionsById.get(id);
      return (
        question &&
        needsThreadAction(question, participants, commanderParticipantId) &&
        !visibleIds.has(id)
      );
    }).length;
    return count + hiddenActions;
  }, 0);

  return { threads, focusIds, remainingCount };
}

/** Phases whose child nodes should appear on the canvas. */
function visibleChildPhases(expandedPhaseId: string | null): Set<string> {
  const visible = new Set<string>();
  if (expandedPhaseId) visible.add(expandedPhaseId);
  return visible;
}

function workLayout(
  phaseId: string,
  phaseX: number,
  work: WorkflowWorkItem[],
): Record<string, { x: number; y: number }> {
  if (phaseId === 'investigation') {
    const byRole = {
      owner: work.find((item) => item.role === 'owner'),
      admin: work.find((item) => item.role === 'admin'),
      investigator: work.find((item) => item.role === 'investigator'),
      responder: work.find((item) => item.role === 'responder'),
    };
    const layout: Record<string, { x: number; y: number }> = {};
    if (byRole.owner) layout[byRole.owner.id] = { x: phaseX, y: SYSTEM_Y };
    if (byRole.admin) layout[byRole.admin.id] = { x: phaseX + ITEM_GAP_X, y: SYSTEM_Y };
    if (byRole.investigator) {
      layout[byRole.investigator.id] = { x: phaseX, y: SYSTEM_Y + LANE_GAP_Y };
    }
    if (byRole.responder) {
      layout[byRole.responder.id] = { x: phaseX + ITEM_GAP_X, y: SYSTEM_Y + LANE_GAP_Y };
    }
    return layout;
  }

  // Stack under the phase; triage keeps severity at WORK_Y and work below.
  const startY = phaseId === 'triage' ? WORK_Y + LANE_GAP_Y : SYSTEM_Y;
  const layout: Record<string, { x: number; y: number }> = {};
  work.forEach((item, index) => {
    layout[item.id] = { x: phaseX, y: startY + index * LANE_GAP_Y };
  });
  return layout;
}

function investigationThreadStartY(): number {
  return SYSTEM_Y + INVESTIGATION_WORK_ROWS * LANE_GAP_Y + THREAD_OFFSET_Y;
}

/** First Y for custom questions — always below work / triage / collab for that phase. */
function customQuestionsStartY(
  phaseId: string,
  visibleThreadCount: number,
  workCatalog: WorkflowWorkItem[] = WORKFLOW_CANVAS_WORK,
): number {
  const work = workItemsForPhase(phaseId, workCatalog);
  const layout = workLayout(phaseId, 0, work);
  const workBottom = Object.values(layout).reduce(
    (max, pos) => Math.max(max, pos.y),
    Number.NEGATIVE_INFINITY,
  );

  let bottom = workBottom;

  if (phaseId === 'triage') {
    bottom = Math.max(bottom, WORK_Y);
  }

  if (phaseId === 'investigation' && visibleThreadCount > 0) {
    const threadStartY = investigationThreadStartY();
    const threadBottom = threadStartY + (visibleThreadCount - 1) * LANE_GAP_Y;
    bottom = Math.max(bottom, threadBottom);
  }

  if (!Number.isFinite(bottom)) {
    return WORK_Y;
  }

  return bottom + LANE_GAP_Y;
}

function appendCommanderQuestions(
  phaseId: string,
  options: {
    phaseX: number;
    questions: CommanderQuestion[];
    selectedId: string | null;
    visibleThreadCount: number;
    workCatalog: WorkflowWorkItem[];
    nextNodes: CanvasNode[];
    nextEdges: Edge[];
  },
) {
  const {
    phaseX,
    questions,
    selectedId,
    visibleThreadCount,
    workCatalog,
    nextNodes,
    nextEdges,
  } = options;
  if (questions.length === 0) return;

  const startY = customQuestionsStartY(phaseId, visibleThreadCount, workCatalog);

  questions.forEach((question, index) => {
    const nodeId = commanderNodeId(question.id);
    // Keep custom cards in the phase column so they never collide with the next phase.
    nextNodes.push({
      id: nodeId,
      type: 'commanderQuestionNode',
      position: {
        x: phaseX,
        y: startY + index * LANE_GAP_Y,
      },
      style: { transition: NODE_MOVE_TRANSITION, zIndex: 6 },
      data: {
        question,
        selected: selectedId === nodeId,
      },
      selectable: true,
      draggable: true,
    });

    nextEdges.push({
      id: `phase-commander-${phaseId}-${question.id}`,
      source: phaseId,
      sourceHandle: 'bottom',
      target: nodeId,
      targetHandle: 'top',
      type: 'smoothstep',
      style: {
        stroke: 'var(--mantine-color-brand-filled)',
        strokeWidth: 1.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--mantine-color-brand-filled)',
      },
    });
  });
}

function appendPhaseWork(
  phaseId: string,
  options: {
    phaseX: number;
    answers: WorkAnswersState;
    selectedId: string | null;
    investigationComplete: boolean;
    participants: Participant[];
    commanderParticipantId: string;
    workCatalog: WorkflowWorkItem[];
    nextNodes: CanvasNode[];
    nextEdges: Edge[];
  },
) {
  const {
    phaseX,
    answers,
    selectedId,
    investigationComplete,
    participants,
    commanderParticipantId,
    workCatalog,
    nextNodes,
    nextEdges,
  } = options;
  const work = workItemsForPhase(phaseId, workCatalog);
  if (work.length === 0) return;

  const layout = workLayout(phaseId, phaseX, work);
  const ownerItem = work.find((item) => item.role === 'owner');
  const adminItem = work.find((item) => item.role === 'admin');
  const investigatorItem = work.find((item) => item.role === 'investigator');
  const responderItem = work.find((item) => item.role === 'responder');
  const adminAnswersId =
    workCatalog.find((item) => item.role === 'admin' && item.phaseId === 'investigation')?.id ??
    adminItem?.id;

  work.forEach((item) => {
    const status = workRuntimeStatus(
      item,
      answers,
      participants,
      commanderParticipantId,
      investigationComplete,
      workCatalog,
    );
    const { quorum } = workItemQuorum(item, answers, participants, commanderParticipantId);
    const quorumMeta =
      item.answerType !== 'generated' && quorum.total > 1
        ? `${quorum.answered}/${quorum.total}`
        : null;
    const generatedTitle =
      item.answerType === 'generated'
        ? summarizeWorkAnswers(adminAnswersId ? answers[adminAnswersId] : undefined) || item.title
        : item.title;
    nextNodes.push({
      id: item.id,
      type: 'workNode',
      position: layout[item.id] ?? { x: phaseX, y: WORK_Y },
      style: { transition: NODE_MOVE_TRANSITION, zIndex: 5 },
      data: {
        title: generatedTitle,
        roleLabel: item.roleLabel,
        role: item.role,
        meta: quorumMeta ? `${item.meta} · ${quorumMeta}` : item.meta,
        status,
        selected: selectedId === item.id,
      },
      selectable: true,
      draggable: true,
    });

    if (item.dependsOn?.length) return;

    // Investigation board is a 2×2 grid — only the owner root links to the phase.
    if (phaseId === 'investigation') {
      if (!ownerItem || item.id !== ownerItem.id) return;
    }

    nextEdges.push({
      id: `phase-work-${phaseId}-${item.id}`,
      source: phaseId,
      sourceHandle: 'bottom',
      target: item.id,
      targetHandle: 'top',
      type: 'smoothstep',
      style: {
        stroke: 'var(--mantine-color-teal-filled)',
        strokeWidth: 1.75,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--mantine-color-teal-filled)',
      },
    });
  });

  if (phaseId === 'investigation') {
    const columnLinks: { id: string; source?: string; target?: string }[] = [
      {
        id: 'work-owner-investigator',
        source: ownerItem?.id,
        target: investigatorItem?.id,
      },
      {
        id: 'work-admin-responder',
        source: adminItem?.id,
        target: responderItem?.id,
      },
    ];
    columnLinks.forEach((link) => {
      if (!link.source || !link.target) return;
      nextEdges.push({
        id: link.id,
        source: link.source,
        sourceHandle: 'bottom',
        target: link.target,
        targetHandle: 'top',
        type: 'smoothstep',
        style: {
          stroke: 'var(--mantine-color-teal-filled)',
          strokeWidth: 1.5,
          opacity: 0.85,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 11,
          height: 11,
          color: 'var(--mantine-color-teal-filled)',
        },
      });
    });

    if (ownerItem && adminItem) {
      const depActive = isWorkItemAnswered(
        ownerItem,
        answers,
        participants,
        commanderParticipantId,
      );
      nextEdges.push({
        id: 'work-owner-admin',
        source: ownerItem.id,
        sourceHandle: 'right',
        target: adminItem.id,
        targetHandle: 'left',
        type: 'smoothstep',
        style: {
          stroke: depActive
            ? 'var(--mantine-color-teal-filled)'
            : 'var(--mantine-color-warning-filled)',
          strokeWidth: 1.5,
          strokeDasharray: depActive ? undefined : '6 5',
          opacity: depActive ? 1 : 0.7,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: depActive
            ? 'var(--mantine-color-teal-filled)'
            : 'var(--mantine-color-warning-filled)',
        },
      });
    }
  }
}

function appendCollabThreads(
  investigationId: string,
  options: {
    phaseX: number;
    threadPlan: ReturnType<typeof buildThreadPlan>;
    selectedId: string | null;
    workCatalog: WorkflowWorkItem[];
    nextNodes: CanvasNode[];
    nextEdges: Edge[];
  },
) {
  const { phaseX, threadPlan, selectedId, workCatalog, nextNodes, nextEdges } = options;
  if (threadPlan.threads.length === 0) return;

  // Board-style: each thread is a horizontal lane under Investigation work grid.
  const threadStartY = investigationThreadStartY();
  let linkedFromPhase = false;
  const investigatorItem = workItemsForPhase('investigation', workCatalog).find(
    (item) => item.role === 'investigator',
  );

  threadPlan.threads.forEach(({ thread, items }, threadIndex) => {
    if (items.length === 0) return;

    const rowY = threadStartY + threadIndex * LANE_GAP_Y;
    const headerId = `thread-${thread.id}`;
    const doneCount = items.filter((item) => item.role === 'done').length;
    const nowCount = items.filter((item) => item.role === 'now').length;

    nextNodes.push({
      id: headerId,
      type: 'threadNode',
      position: { x: phaseX, y: rowY },
      style: { transition: NODE_MOVE_TRANSITION, zIndex: 5 },
      data: {
        label: thread.label,
        meta:
          nowCount > 0
            ? `${doneCount} done · ${nowCount} active`
            : `${doneCount} done · thread clear`,
      },
      selectable: false,
      draggable: true,
    });

    if (!linkedFromPhase) {
      // Link from the bottom-left work card so the rail does not cut through the top row.
      const threadSourceId = investigatorItem?.id ?? investigationId;
      nextEdges.push({
        id: `phase-thread-rail-${investigationId}`,
        source: threadSourceId,
        sourceHandle: 'bottom',
        target: headerId,
        targetHandle: 'top',
        type: 'smoothstep',
        style: {
          stroke: 'var(--mantine-color-teal-filled)',
          strokeWidth: 1.75,
          opacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: 'var(--mantine-color-teal-filled)',
        },
      });
      linkedFromPhase = true;
    }

    let previousId = headerId;
    items.forEach((item, itemIndex) => {
      const { question, role, blockedReason } = item;
      const kind = collabKind(question);
      const nodeId = `collab-${question.id}`;
      const focus = role === 'now';
      const trail = role === 'done';
      const blocked = role === 'blocked';

      nextNodes.push({
        id: nodeId,
        type: 'collabNode',
        position: {
          x: phaseX + ITEM_GAP_X * (itemIndex + 1),
          y: rowY,
        },
        style: { transition: NODE_MOVE_TRANSITION, zIndex: 5 },
        data: {
          kind,
          code: collabCode(question),
          title: question.text,
          meta: `${question.answerCount} answer${question.answerCount === 1 ? '' : 's'} · ${question.participantCount} participants`,
          statusLabel: collabStatusLabel(question),
          selected: selectedId === nodeId,
          focus,
          trail,
          blocked,
          blockedReason,
          threadLabel: thread.label,
          answerPreview: collabAnswerPreview(question),
          assigneeLabel: collabAssigneeLabel(question),
          actionHint: focus ? collabActionHint(question) : null,
        },
        selectable: !blocked,
        draggable: true,
      });

      nextEdges.push({
        id: `thread-link-${previousId}-${nodeId}`,
        source: previousId,
        sourceHandle: 'right',
        target: nodeId,
        targetHandle: 'left',
        type: 'smoothstep',
        style: {
          stroke: blocked
            ? 'var(--mantine-color-warning-filled)'
            : kind === 'decision'
              ? 'var(--mantine-color-brand-filled)'
              : kind === 'finding'
                ? 'var(--mantine-color-accent-filled)'
                : 'var(--mantine-color-teal-filled)',
          strokeWidth: focus ? 2 : 1.5,
          opacity: blocked ? 0.55 : trail ? 0.75 : 1,
          strokeDasharray: blocked ? '6 5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: blocked
            ? 'var(--mantine-color-warning-filled)'
            : kind === 'decision'
              ? 'var(--mantine-color-brand-filled)'
              : kind === 'finding'
                ? 'var(--mantine-color-accent-filled)'
                : 'var(--mantine-color-teal-filled)',
        },
      });

      previousId = nodeId;
    });
  });
}

function buildGraph(options: {
  steps: WorkflowStep[];
  questions: Question[];
  answers: WorkAnswersState;
  expandedPhaseId: string | null;
  selectedId: string | null;
  investigationComplete: boolean;
  completedPhaseIds: string[];
  isCommander: boolean;
  evidence: EvidenceItem[];
  commanderQuestions: CommanderQuestion[];
  incidentSeverity: RoomSeverity;
  participants: Participant[];
  commanderParticipantId: string;
  workCatalog: WorkflowWorkItem[];
  threadCatalog: CollabThreadDef[];
}): {
  nodes: CanvasNode[];
  edges: Edge[];
  remainingCollabCount: number;
  focusIds: number[];
  threadPlan: ReturnType<typeof buildThreadPlan>;
} {
  const {
    steps,
    questions,
    answers,
    expandedPhaseId,
    selectedId,
    investigationComplete,
    completedPhaseIds,
    isCommander,
    evidence,
    commanderQuestions,
    incidentSeverity,
    participants,
    commanderParticipantId,
    workCatalog,
    threadCatalog,
  } = options;
  const nextNodes: CanvasNode[] = [];
  const nextEdges: Edge[] = [];
  const childPhases = visibleChildPhases(expandedPhaseId);
  const columns = phaseColumns(steps, expandedPhaseId);
  const threadPlan = buildThreadPlan(
    questions,
    investigationComplete,
    participants,
    commanderParticipantId,
    threadCatalog,
  );
  let remainingCollabCount = 0;
  let focusIds: number[] = [];

  steps.forEach((step, index) => {
    const status = phaseCanvasStatus(
      step,
      index,
      steps,
      investigationComplete,
      completedPhaseIds,
      isCommander,
    );
    const column = columns.get(step.id) ?? {
      x: PHASE_ORIGIN_X + index * phaseSlotWidth(steps.length),
      width: phaseSlotWidth(steps.length),
      expanded: false,
    };

    nextNodes.push({
      id: step.id,
      type: 'phaseNode',
      position: { x: column.x, y: PHASE_Y },
      style: { transition: NODE_MOVE_TRANSITION, zIndex: column.expanded ? 8 : 1 },
      data: {
        label: step.label,
        number: String(index + 1).padStart(2, '0'),
        meta: phaseMeta(
          step,
          status,
          answers,
          participants,
          commanderParticipantId,
          investigationComplete,
          workCatalog,
          completedPhaseIds,
        ),
        status,
        selected: selectedId === step.id,
        expanded: column.expanded,
        evidenceCount: evidence.filter((item) => item.phaseId === step.id).length,
        phaseId: step.id,
      },
      selectable: true,
      draggable: true,
    });

    if (index < steps.length - 1) {
      const filled = status === 'done';
      const stroke = filled
        ? 'var(--mantine-color-teal-filled)'
        : 'color-mix(in srgb, var(--monosuite-color-text) 42%, var(--monosuite-color-border))';
      nextEdges.push({
        id: `phase-${step.id}-${steps[index + 1].id}`,
        source: step.id,
        sourceHandle: 'right',
        target: steps[index + 1].id,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: status === 'active',
        style: {
          stroke,
          strokeWidth: filled ? 2.25 : 1.85,
          strokeDasharray: filled ? undefined : '6 5',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: stroke,
        },
      });
    }
  });

  childPhases.forEach((phaseId) => {
    const phaseX = columns.get(phaseId)?.x ?? 0;

    if (phaseId === 'triage') {
      nextNodes.push({
        id: TRIAGE_SEVERITY_NODE_ID,
        type: 'triageSeverityNode',
        position: { x: phaseX, y: WORK_Y },
        style: { transition: NODE_MOVE_TRANSITION, zIndex: 6 },
        data: {
          severity: incidentSeverity,
          selected: selectedId === TRIAGE_SEVERITY_NODE_ID,
        },
        selectable: true,
        draggable: true,
      });

      nextEdges.push({
        id: `phase-triage-severity-${phaseId}`,
        source: phaseId,
        sourceHandle: 'bottom',
        target: TRIAGE_SEVERITY_NODE_ID,
        targetHandle: 'top',
        type: 'smoothstep',
        style: {
          stroke: 'var(--monosuite-color-border)',
          strokeWidth: 1.5,
        },
      });
    }

    appendPhaseWork(phaseId, {
      phaseX,
      answers,
      selectedId,
      investigationComplete,
      participants,
      commanderParticipantId,
      workCatalog,
      nextNodes,
      nextEdges,
    });
  });

  const investigationId = steps.find((step) => step.id === 'investigation')?.id;
  if (investigationId && childPhases.has(investigationId)) {
    remainingCollabCount = threadPlan.remainingCount;
    focusIds = threadPlan.focusIds;
    appendCollabThreads(investigationId, {
      phaseX: columns.get(investigationId)?.x ?? 0,
      threadPlan,
      selectedId,
      workCatalog,
      nextNodes,
      nextEdges,
    });
  }

  const visibleThreadCount = threadPlan.threads.filter(({ items }) => items.length > 0).length;

  // Custom questions last so their lane sits below work + collaboration without overlap.
  childPhases.forEach((phaseId) => {
    const phaseCommanderQuestions = commanderQuestions.filter((q) => q.phaseId === phaseId);
    appendCommanderQuestions(phaseId, {
      phaseX: columns.get(phaseId)?.x ?? 0,
      questions: phaseCommanderQuestions,
      selectedId,
      visibleThreadCount: phaseId === 'investigation' ? visibleThreadCount : 0,
      workCatalog,
      nextNodes,
      nextEdges,
    });
  });

  return {
    nodes: nextNodes,
    edges: nextEdges,
    remainingCollabCount,
    focusIds,
    threadPlan,
  };
}


export function WorkflowCanvasView({
  steps,
  workflowName: _workflowName,
  questions = [],
  onSubmitCollabAnswer,
  onRecordDecision,
  fillHeight = false,
  isCommander = false,
  participants,
  commanderParticipantId,
  evidence = [],
  commanderQuestions = [],
  incidentTitle = 'Incident',
  incidentDescription = '',
  incidentSeverity = 'Critical',
  triageNotes = '',
  onTriageNotesChange,
  onOpenIncidentContext,
  incidentContextOpen = false,
  onAddEvidence,
  onRemoveEvidence,
  onAddCommanderQuestion,
  onUpdateCommanderQuestion,
  onRemoveCommanderQuestion,
  onAnswerCommanderQuestion,
  onSetPhaseSkippable,
  onSkipPhase,
  skippedPhases = [],
  assigneeOptions = [],
  workItems,
  collabThreads,
  completedPhaseIds: completedPhaseIdsProp,
  onCompletePhase,
}: WorkflowCanvasViewProps) {
  const workCatalog = workItems ?? WORKFLOW_CANVAS_WORK;
  const threadCatalog = collabThreads ?? COLLAB_THREADS;
  const [answers, setAnswers] = useState<WorkAnswersState>({});
  const [draft, setDraft] = useState('');
  const [choiceValues, setChoiceValues] = useState<string[]>([]);
  const [choiceOther, setChoiceOther] = useState('');
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);
  const completedPhaseIds = completedPhaseIdsProp ?? localCompleted;
  const investigationComplete = completedPhaseIds.includes('investigation');
  const allPhasesDone = useMemo(
    () =>
      steps.length > 0 &&
      steps.every(
        (step) =>
          completedPhaseIds.includes(step.id) ||
          step.status === 'completed' ||
          skippedPhases.includes(step.id),
      ),
    [completedPhaseIds, skippedPhases, steps],
  );
  /** When false and all phases done, show the response journey instead of the live canvas. */
  const [preferCanvasAfterComplete, setPreferCanvasAfterComplete] = useState(false);
  const wasAllPhasesDoneRef = useRef(false);
  const showResponseJourney = allPhasesDone && !preferCanvasAfterComplete;

  useEffect(() => {
    if (allPhasesDone && !wasAllPhasesDoneRef.current) {
      setPreferCanvasAfterComplete(false);
      setExpandedPhaseId(null);
      setSelectedId(null);
    }
    wasAllPhasesDoneRef.current = allPhasesDone;
  }, [allPhasesDone]);

  const [toast, setToast] = useState<string | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<CanvasNode, Edge> | null>(null);
  const forceDefaultLayoutRef = useRef(false);
  const flowContainerRef = useRef<HTMLDivElement | null>(null);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const [focusCursor, setFocusCursor] = useState(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const resetDraftState = useCallback(() => {
    setDraft('');
    setChoiceValues([]);
    setChoiceOther('');
  }, []);

  const phaseGaps = useCallback(
    (phaseId: string) => {
      const gaps: string[] = [];
      workItemsForPhase(phaseId, workCatalog)
        .filter((item) => item.required)
        .forEach((item) => {
          if (
            !isWorkItemAnswered(
              item,
              answers,
              participants,
              commanderParticipantId,
              investigationComplete,
            )
          ) {
            gaps.push(`${item.roleLabel}: ${item.title}`);
          }
        });

      const threadItemIds = new Set(
        threadsForPhase(phaseId, threadCatalog).flatMap((thread) => thread.itemIds),
      );
      questions
        .filter(
          (question) =>
            question.requiredForPhase &&
            (threadItemIds.has(question.id) ||
              (phaseId === 'investigation' && threadItemIds.size === 0)),
        )
        .forEach((question) => {
          if (!isQuestionQuorumComplete(question, participants, commanderParticipantId)) {
            gaps.push(`Decision: ${question.text}`);
          }
        });

      commanderQuestions
        .filter((question) => question.phaseId === phaseId && question.required)
        .forEach((question) => {
          if (!isCommanderQuorumComplete(question, participants, commanderParticipantId)) {
            gaps.push(`Custom: ${question.title}`);
          }
        });
      return gaps;
    },
    [
      answers,
      commanderParticipantId,
      commanderQuestions,
      investigationComplete,
      participants,
      questions,
      threadCatalog,
      workCatalog,
    ],
  );

  const graph = useMemo(
    () =>
      buildGraph({
        steps,
        questions,
        answers,
        expandedPhaseId,
        selectedId,
        investigationComplete,
        completedPhaseIds,
        isCommander,
        evidence,
        commanderQuestions,
        incidentSeverity,
        participants,
        commanderParticipantId,
        workCatalog,
        threadCatalog,
      }),
    [
      answers,
      commanderParticipantId,
      commanderQuestions,
      completedPhaseIds,
      evidence,
      expandedPhaseId,
      incidentSeverity,
      investigationComplete,
      isCommander,
      participants,
      questions,
      selectedId,
      steps,
      threadCatalog,
      workCatalog,
    ],
  );

  const focusIds = graph.focusIds;

  useEffect(() => {
    forceDefaultLayoutRef.current = true;
    setLayoutEpoch((value) => value + 1);
  }, [expandedPhaseId]);

  // After the playbook spine loads, fit the full phase overview (not a single phase).
  const stepIdsKey = steps.map((step) => step.id).join('|');
  useEffect(() => {
    if (!stepIdsKey) return;
    forceDefaultLayoutRef.current = true;
    setLayoutEpoch((value) => value + 1);
  }, [stepIdsKey]);

  // Refit when custom questions are added or removed under the focused phase.
  useEffect(() => {
    setLayoutEpoch((value) => value + 1);
  }, [commanderQuestions.length]);

  useEffect(() => {
    setNodes((previous) => {
      if (forceDefaultLayoutRef.current) {
        forceDefaultLayoutRef.current = false;
        return graph.nodes;
      }
      // Preserve drag only for phase cards. Work / thread / collab always
      // follow layout so lanes never overlap after interaction.
      const positions = new Map(previous.map((node) => [node.id, node.position]));
      return graph.nodes.map((node) => ({
        ...node,
        position:
          node.type === 'phaseNode'
            ? (positions.get(node.id) ?? node.position)
            : node.position,
      }));
    });
    setEdges(graph.edges);
  }, [graph]);

  useEffect(() => {
    if (layoutEpoch === 0 || !flowInstance) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      fitCanvasToView(flowInstance, expandedPhaseId, 360, workCatalog);
    }, 48);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [expandedPhaseId, flowInstance, layoutEpoch, workCatalog]);

  // Refit when the canvas viewport resizes (side panels open/close).
  useEffect(() => {
    if (!flowInstance) return;
    const container = flowContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fitCanvasToView(flowInstance, expandedPhaseId, 280, workCatalog);
      }, 120);
    });

    observer.observe(container);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [expandedPhaseId, flowInstance, workCatalog]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current) as CanvasNode[]);
  }, []);

  const resetLayout = useCallback(() => {
    forceDefaultLayoutRef.current = true;
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setLayoutEpoch((value) => value + 1);
    showToast('Layout reset to default');
  }, [graph.edges, graph.nodes, showToast]);

  const selectedPhase = steps.find((s) => s.id === selectedId) ?? null;
  const selectedWork = findWorkItem(selectedId, workCatalog);
  const selectedCollabId =
    selectedId?.startsWith('collab-') && selectedId
      ? Number(selectedId.replace('collab-', ''))
      : null;
  const selectedCollab =
    selectedCollabId != null ? questions.find((q) => q.id === selectedCollabId) ?? null : null;
  const selectedEvidencePhaseId =
    selectedId?.startsWith('evidence-') ? selectedId.replace('evidence-', '') : null;
  const selectedCommanderQuestion =
    selectedId?.startsWith('commander-')
      ? commanderQuestions.find((q) => commanderNodeId(q.id) === selectedId) ?? null
      : null;
  const selectedTriageSeverity = selectedId === TRIAGE_SEVERITY_NODE_ID;
  const overviewPhase =
    selectedPhase ??
    (!selectedWork &&
    !selectedCollab &&
    !selectedEvidencePhaseId &&
    !selectedCommanderQuestion &&
    !selectedTriageSeverity &&
    expandedPhaseId
      ? (steps.find((s) => s.id === expandedPhaseId) ?? null)
      : null);

  const revealNextCollab = useCallback(() => {
    if (focusIds.length === 0) {
      showToast('No open questions left');
      return;
    }
    const nextIndex = focusCursor % focusIds.length;
    const nextId = focusIds[nextIndex];
    setFocusCursor((value) => (value + 1) % Math.max(focusIds.length, 1));
    setSelectedId(`collab-${nextId}`);
    setExpandedPhaseId('investigation');
    resetDraftState();
    showToast('Opened the next question to answer');
  }, [focusCursor, focusIds, resetDraftState, showToast]);

  const selectCanvasItem = useCallback(
    (id: string) => {
      setSelectedId(id);
      const work = findWorkItem(id, workCatalog);
      if (work) {
        setExpandedPhaseId(work.phaseId);
        const existing = answers[work.id]?.find(
          (answer) => answer.participantId === CURRENT_USER.id,
        );
        if (work.answerType === 'select') {
          setChoiceValues(existing?.values ?? []);
          setChoiceOther(existing?.otherText ?? '');
          setDraft('');
        } else {
          setDraft(existing?.values[0] ?? '');
          setChoiceValues([]);
          setChoiceOther('');
        }
        return;
      }
      if (id.startsWith('collab-')) {
        setExpandedPhaseId('investigation');
        resetDraftState();
        return;
      }
      if (id.startsWith('evidence-')) {
        setExpandedPhaseId(id.replace('evidence-', ''));
        resetDraftState();
        return;
      }
      if (id.startsWith('commander-')) {
        const question = commanderQuestions.find((item) => commanderNodeId(item.id) === id);
        if (question) setExpandedPhaseId(question.phaseId);
        const existing = question?.roleAnswers?.find(
          (answer) => answer.participantId === CURRENT_USER.id,
        );
        if (question?.answerType === 'select') {
          setChoiceValues(existing?.values ?? []);
          setChoiceOther(existing?.otherText ?? '');
          setDraft('');
        } else {
          setDraft(existing?.values[0] ?? question?.answer ?? '');
          setChoiceValues([]);
          setChoiceOther('');
        }
        return;
      }
      if (id === TRIAGE_SEVERITY_NODE_ID) {
        setExpandedPhaseId('triage');
        resetDraftState();
        return;
      }
      setExpandedPhaseId(id);
      resetDraftState();
    },
    [answers, commanderQuestions, resetDraftState, workCatalog],
  );

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      const canvasNode = node as CanvasNode;

      if (canvasNode.type === 'phaseNode') {
        const status = (canvasNode.data as PhaseNodeData).status;
        if (status === 'locked' && !isCommander) {
          showToast('Complete the active phase first');
          return;
        }
        setSelectedId(canvasNode.id);
        setExpandedPhaseId(canvasNode.id);
        resetDraftState();
        return;
      }

      selectCanvasItem(canvasNode.id);
    },
    [isCommander, resetDraftState, selectCanvasItem, showToast],
  );

  const closeInspector = () => {
    setSelectedId(null);
    resetDraftState();
  };

  const saveAnswer = () => {
    if (!selectedWork) return;
    if (selectedWork.answerType === 'generated') return;
    const status = workRuntimeStatus(
      selectedWork,
      answers,
      participants,
      commanderParticipantId,
      investigationComplete,
      workCatalog,
    );
    if (status === 'blocked') {
      showToast('Waiting for a prior response');
      return;
    }
    const { people } = workItemQuorum(
      selectedWork,
      answers,
      participants,
      commanderParticipantId,
    );
    if (!isPersonInAssigneePool(CURRENT_USER.id, people)) {
      showToast('Only assigned role members can answer');
      return;
    }

    let values: string[] = [];
    let otherText: string | undefined;
    if (selectedWork.answerType === 'select') {
      if (!isChoiceAnswerValid(choiceValues, choiceOther, selectedWork.selectionMode)) {
        showToast('Select or enter an answer first');
        return;
      }
      values = choiceValues;
      otherText = choiceOther;
    } else {
      const value = draft.trim();
      if (!value) {
        showToast('Select or enter an answer first');
        return;
      }
      values = [value];
    }

    const personAnswer = makePersonAnswer({
      participantId: CURRENT_USER.id,
      participantName: CURRENT_USER.name,
      values,
      otherText,
    });
    setAnswers((prev) => ({
      ...prev,
      [selectedWork.id]: upsertPersonAnswer(prev[selectedWork.id], personAnswer),
    }));
    showToast(
      selectedWork.role === 'owner'
        ? 'Answer saved · Asset Admin unlocked'
        : 'Answer saved',
    );
  };

  const saveCollabAnswer = () => {
    if (!selectedCollab || !onSubmitCollabAnswer) return;
    const value = draft.trim();
    if (!value) {
      showToast('Enter an answer first');
      return;
    }
    onSubmitCollabAnswer(selectedCollab.id, value);
    resetDraftState();
    showToast('Answer recorded · thread updated');
  };

  const saveCollabDecision = () => {
    if (!selectedCollab || !onRecordDecision) return;
    if (!isChoiceAnswerValid(choiceValues, choiceOther, selectedCollab.selectionMode)) {
      showToast('Select a decision first');
      return;
    }
    onRecordDecision(selectedCollab.id, choiceValues, choiceOther);
    resetDraftState();
    showToast('Decision recorded · thread updated');
  };

  const completePhase = (phaseId: string) => {
    if (!isCommander) return;
    const gaps = phaseGaps(phaseId);
    if (gaps.length > 0) return;

    onCompletePhase?.(phaseId);
    const nextCompleted = completedPhaseIds.includes(phaseId)
      ? completedPhaseIds
      : [...completedPhaseIds, phaseId];
    setLocalCompleted((current) =>
      current.includes(phaseId) ? current : [...current, phaseId],
    );

    const index = steps.findIndex((step) => step.id === phaseId);
    const nextStep = index >= 0 ? steps[index + 1] : undefined;
    const workflowDone =
      steps.length > 0 &&
      steps.every((step) => {
        if (step.id === phaseId) return true;
        return (
          nextCompleted.includes(step.id) ||
          step.status === 'completed' ||
          skippedPhases.includes(step.id)
        );
      });

    if (workflowDone) {
      setPreferCanvasAfterComplete(false);
      setExpandedPhaseId(null);
      setSelectedId(null);
      showToast('Response complete · Journey ready');
      return;
    }

    const focusId = nextStep?.id ?? phaseId;
    setExpandedPhaseId(focusId);
    setSelectedId(focusId);
    forceDefaultLayoutRef.current = true;
    setLayoutEpoch((value) => value + 1);
    showToast(
      nextStep
        ? `${nextStep.label} unlocked · Phase complete`
        : 'Phase complete',
    );
  };

  const adminInvestigationId = workCatalog.find(
    (item) => item.role === 'admin' && item.phaseId === 'investigation',
  )?.id;

  if (showResponseJourney) {
    return (
      <Box
        className={`monosuite-workflow-canvas-shell${fillHeight ? ' monosuite-workflow-canvas-shell--fill' : ''}`}
        aria-label="Completed response journey"
      >
        <ResponseJourneyView
          steps={steps}
          answers={answers}
          questions={questions}
          workCatalog={workCatalog}
          threadCatalog={threadCatalog}
          commanderQuestions={commanderQuestions}
          triageNotes={triageNotes}
          incidentTitle={incidentTitle}
          incidentDescription={incidentDescription}
          incidentSeverity={incidentSeverity}
          evidence={evidence}
          onEdit={() => setPreferCanvasAfterComplete(true)}
        />
      </Box>
    );
  }

  return (
    <Box
      className={`monosuite-workflow-canvas-shell${fillHeight ? ' monosuite-workflow-canvas-shell--fill' : ''}`}
      data-focus-phase={expandedPhaseId ?? undefined}
      aria-label="Response workflow canvas"
    >
      {allPhasesDone ? (
        <Group className="monosuite-workflow-canvas-toolbar" justify="flex-end" gap="xs" mb={6}>
          <Button
            size="compact-xs"
            variant="light"
            color="teal"
            leftSection={<IconRoute2 size={14} />}
            onClick={() => setPreferCanvasAfterComplete(false)}
          >
            View response flow
          </Button>
        </Group>
      ) : null}
      <Box className="monosuite-workflow-canvas-stage">
        <Box ref={flowContainerRef} className="monosuite-workflow-canvas-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            onInit={(instance) => {
              setFlowInstance(instance);
              window.requestAnimationFrame(() => {
                fitCanvasToView(instance, expandedPhaseId, 0, workCatalog);
              });
            }}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.35 }}
            minZoom={0.35}
            maxZoom={1.4}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnScroll
            proOptions={{ hideAttribution: true }}
          >
            <CanvasEdgeSync nodeIds={nodes.map((node) => node.id)} />
            <Background
              id="workflow-dots"
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1.5}
              color="var(--monosuite-color-border)"
            />
            <Panel position="bottom-left" className="monosuite-workflow-canvas-control-stack">
              <Tooltip label="Reset layout to default positions" withArrow position="right">
                <Box className="react-flow__controls monosuite-workflow-canvas-reset-wrap">
                  <button
                    type="button"
                    className="react-flow__controls-button monosuite-workflow-canvas-reset"
                    aria-label="Reset layout to default positions"
                    onClick={resetLayout}
                  >
                    <IconArrowBackUp size={16} stroke={1.5} aria-hidden />
                  </button>
                </Box>
              </Tooltip>
              <Controls
                showInteractive={false}
                className="monosuite-workflow-canvas-controls-inline"
              />
            </Panel>
            {focusIds.length > 0 && expandedPhaseId === 'investigation' ? (
              <Panel position="top-right">
                <Button
                  className="monosuite-workflow-canvas-continue"
                  size="compact-sm"
                  variant="light"
                  color="teal"
                  rightSection={<IconChevronRight size={14} />}
                  onClick={revealNextCollab}
                >
                  Next question · {focusIds.length}
                </Button>
              </Panel>
            ) : null}
          </ReactFlow>

          {toast ? (
            <Box className="monosuite-workflow-canvas-toast" role="status">
              {toast}
            </Box>
          ) : null}
        </Box>

        <Paper
          withBorder
          radius="md"
          className="monosuite-workflow-canvas-inspector"
          aria-label="Selected workflow item details"
        >
          <Group
            justify="space-between"
            wrap="nowrap"
            align="flex-start"
            gap="sm"
            className="monosuite-workflow-canvas-inspector-head"
          >
            {overviewPhase &&
            !selectedCollab &&
            !selectedWork &&
            !selectedCommanderQuestion &&
            !selectedEvidencePhaseId &&
            !selectedTriageSeverity ? (
              <>
                <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
                  <Group gap={6} wrap="wrap">
                    <PhaseStatusChip
                      status={
                        completedPhaseIds.includes(overviewPhase.id) ||
                        overviewPhase.status === 'completed'
                          ? 'done'
                          : overviewPhase.status === 'current'
                            ? 'active'
                            : 'queued'
                      }
                    />
                    <Badge
                      size="xs"
                      variant="light"
                      color={overviewPhase.skippable ? 'neutral' : 'teal'}
                    >
                      {overviewPhase.skippable ? 'Skippable' : 'Required'}
                    </Badge>
                  </Group>
                  <Text fw={700} size="sm" lh={1.35} lineClamp={2}>
                    {overviewPhase.label}
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <PhasePolicyControl
                    step={overviewPhase}
                    isCommander={isCommander}
                    skipped={skippedPhases.includes(overviewPhase.id)}
                    onSetSkippable={onSetPhaseSkippable}
                    onSkip={onSkipPhase}
                  />
                  {isCommander && onAddCommanderQuestion ? (
                    <AddCommanderQuestionForm
                      phaseId={overviewPhase.id}
                      assigneeOptions={assigneeOptions}
                      onSubmit={onAddCommanderQuestion}
                      iconOnly
                    />
                  ) : null}
                </Group>
              </>
            ) : (
              <>
                <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
                  <Text
                    size="xs"
                    fw={700}
                    tt="uppercase"
                    c={
                      selectedCollab
                        ? collabAccent(collabKind(selectedCollab))
                        : selectedCommanderQuestion
                          ? 'brand'
                          : 'teal'
                    }
                    lts="0.06em"
                  >
                    {selectedCollab
                      ? `${collabCode(selectedCollab)} · ${collabKind(selectedCollab)}`
                      : selectedCommanderQuestion
                        ? 'Custom question'
                        : selectedEvidencePhaseId
                          ? 'Phase evidence'
                          : selectedTriageSeverity
                            ? 'Triage'
                            : selectedWork
                              ? `${selectedWork.roleLabel}${selectedWork.required ? ' · Required' : ' · Optional'}`
                              : 'Inspector'}
                  </Text>
                  <Text fw={700} size="sm" lh={1.35} lineClamp={3}>
                    {selectedCollab
                      ? selectedCollab.text
                      : selectedCommanderQuestion
                        ? selectedCommanderQuestion.title
                        : selectedEvidencePhaseId
                          ? `Evidence · ${steps.find((s) => s.id === selectedEvidencePhaseId)?.label ?? selectedEvidencePhaseId}`
                          : selectedTriageSeverity
                            ? 'Incident severity'
                            : selectedWork
                              ? selectedWork.answerType === 'generated'
                                ? summarizeWorkAnswers(
                                    adminInvestigationId
                                      ? answers[adminInvestigationId]
                                      : undefined,
                                  ) || selectedWork.title
                                : selectedWork.title
                              : 'Select a node'}
                  </Text>
                </Stack>
                {selectedCollab ||
                selectedWork ||
                selectedCommanderQuestion ||
                selectedEvidencePhaseId ||
                selectedTriageSeverity ? (
                  <ActionIcon
                    variant="subtle"
                    color="neutral"
                    size="sm"
                    radius="sm"
                    aria-label="Back to phase overview"
                    onClick={closeInspector}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                ) : null}
              </>
            )}
          </Group>

          <ScrollArea
            className="monosuite-workflow-canvas-inspector-body"
            type="auto"
            offsetScrollbars
            scrollbarSize={6}
          >
            <Box className="monosuite-workflow-canvas-inspector-content">
              {selectedCollab ? (
                <CollabInspector
                  question={selectedCollab}
                  draft={draft}
                  onDraftChange={setDraft}
                  choiceValues={choiceValues}
                  onChoiceValuesChange={setChoiceValues}
                  choiceOther={choiceOther}
                  onChoiceOtherChange={setChoiceOther}
                  onSaveAnswer={saveCollabAnswer}
                  onSaveDecision={saveCollabDecision}
                  canAnswer={Boolean(onSubmitCollabAnswer)}
                  canDecide={Boolean(onRecordDecision)}
                  remainingCount={focusIds.length}
                  onContinue={revealNextCollab}
                  participants={participants}
                  commanderParticipantId={commanderParticipantId}
                />
              ) : selectedCommanderQuestion ? (
                <CommanderQuestionInspector
                  question={selectedCommanderQuestion}
                  canAnswer={Boolean(onAnswerCommanderQuestion)}
                  canManage={isCommander}
                  draft={draft}
                  onDraftChange={setDraft}
                  choiceValues={choiceValues}
                  onChoiceValuesChange={setChoiceValues}
                  choiceOther={choiceOther}
                  onChoiceOtherChange={setChoiceOther}
                  onSave={() => {
                    if (selectedCommanderQuestion.answerType === 'select') {
                      onAnswerCommanderQuestion?.(selectedCommanderQuestion.id, {
                        values: choiceValues,
                        otherText: choiceOther,
                      });
                    } else {
                      onAnswerCommanderQuestion?.(selectedCommanderQuestion.id, {
                        values: [draft.trim()],
                      });
                    }
                    resetDraftState();
                  }}
                  onUpdate={(input) =>
                    onUpdateCommanderQuestion?.(selectedCommanderQuestion.id, input)
                  }
                  onRemove={() => {
                    onRemoveCommanderQuestion?.(selectedCommanderQuestion.id);
                    setSelectedId(expandedPhaseId);
                  }}
                  assigneeOptions={assigneeOptions}
                  participants={participants}
                  commanderParticipantId={commanderParticipantId}
                />
              ) : selectedEvidencePhaseId ? (
                <PhaseEvidenceInspector
                  items={evidence.filter((item) => item.phaseId === selectedEvidencePhaseId)}
                  onAdd={(kind) => onAddEvidence?.(kind ?? 'file', selectedEvidencePhaseId)}
                  onRemove={onRemoveEvidence}
                />
              ) : selectedTriageSeverity ? (
                <TriagePhaseInspector
                  severity={incidentSeverity}
                  notes={triageNotes}
                  onNotesChange={onTriageNotesChange}
                  evidenceItems={evidence.filter((item) => item.phaseId === 'triage')}
                  onAddEvidence={(kind) => onAddEvidence?.(kind ?? 'file', 'triage')}
                  onRemoveEvidence={onRemoveEvidence}
                />
              ) : selectedWork ? (
                <WorkInspector
                  item={selectedWork}
                  draft={draft}
                  onDraftChange={setDraft}
                  choiceValues={choiceValues}
                  onChoiceValuesChange={setChoiceValues}
                  choiceOther={choiceOther}
                  onChoiceOtherChange={setChoiceOther}
                  answers={answers}
                  status={workRuntimeStatus(
                    selectedWork,
                    answers,
                    participants,
                    commanderParticipantId,
                    investigationComplete,
                    workCatalog,
                  )}
                  onSave={saveAnswer}
                  participants={participants}
                  commanderParticipantId={commanderParticipantId}
                  workCatalog={workCatalog}
                />
              ) : overviewPhase?.id === 'detected' ? (
                <Stack gap="md">
                  <DetectedPhaseInspector
                    title={incidentTitle}
                    description={incidentDescription}
                    severity={incidentSeverity}
                    onOpenIncidentContext={onOpenIncidentContext}
                    incidentContextOpen={incidentContextOpen}
                    evidenceItems={evidence.filter((item) => item.phaseId === 'detected')}
                    onAddEvidence={(kind) => onAddEvidence?.(kind ?? 'file', 'detected')}
                    onRemoveEvidence={onRemoveEvidence}
                  />
                  <PhaseInspector
                    step={overviewPhase}
                    steps={steps}
                    answers={answers}
                    questions={questions}
                    investigationComplete={investigationComplete}
                    phaseGaps={phaseGaps(overviewPhase.id)}
                    isCommander={isCommander}
                    completedPhaseIds={completedPhaseIds}
                    onComplete={() => completePhase(overviewPhase.id)}
                    onSelectItem={selectCanvasItem}
                    evidenceItems={[]}
                    commanderQuestions={commanderQuestions.filter(
                      (q) => q.phaseId === overviewPhase.id,
                    )}
                    participants={participants}
                    commanderParticipantId={commanderParticipantId}
                    workCatalog={workCatalog}
                    threadCatalog={threadCatalog}
                    hideGuidance
                    hideEvidence
                  />
                </Stack>
              ) : overviewPhase?.id === 'triage' ? (
                <Stack gap="md">
                  <TriagePhaseInspector
                    severity={incidentSeverity}
                    notes={triageNotes}
                    onNotesChange={onTriageNotesChange}
                    evidenceItems={evidence.filter((item) => item.phaseId === 'triage')}
                    onAddEvidence={(kind) => onAddEvidence?.(kind ?? 'file', 'triage')}
                    onRemoveEvidence={onRemoveEvidence}
                  />
                  <PhaseInspector
                    step={overviewPhase}
                    steps={steps}
                    answers={answers}
                    questions={questions}
                    investigationComplete={investigationComplete}
                    phaseGaps={phaseGaps(overviewPhase.id)}
                    isCommander={isCommander}
                    completedPhaseIds={completedPhaseIds}
                    onComplete={() => completePhase(overviewPhase.id)}
                    onSelectItem={selectCanvasItem}
                    evidenceItems={[]}
                    commanderQuestions={commanderQuestions.filter(
                      (q) => q.phaseId === overviewPhase.id,
                    )}
                    participants={participants}
                    commanderParticipantId={commanderParticipantId}
                    workCatalog={workCatalog}
                    threadCatalog={threadCatalog}
                    hideGuidance
                    hideEvidence
                  />
                </Stack>
              ) : overviewPhase ? (
                <PhaseInspector
                  step={overviewPhase}
                  steps={steps}
                  answers={answers}
                  questions={questions}
                  investigationComplete={investigationComplete}
                  phaseGaps={phaseGaps(overviewPhase.id)}
                  isCommander={isCommander}
                  completedPhaseIds={completedPhaseIds}
                  onComplete={() => completePhase(overviewPhase.id)}
                  onSelectItem={selectCanvasItem}
                  evidenceItems={evidence.filter((item) => item.phaseId === overviewPhase.id)}
                  commanderQuestions={commanderQuestions.filter(
                    (q) => q.phaseId === overviewPhase.id,
                  )}
                  onAddEvidence={(kind) =>
                    onAddEvidence?.(kind ?? 'file', overviewPhase.id)
                  }
                  onRemoveEvidence={onRemoveEvidence}
                  participants={participants}
                  commanderParticipantId={commanderParticipantId}
                  workCatalog={workCatalog}
                  threadCatalog={threadCatalog}
                />
              ) : (
                <Box className="monosuite-workflow-canvas-inspector-empty">
                  <Text size="sm" fw={600}>
                    Start with a phase
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.5}>
                    Click a phase on the canvas to see guidance and the remaining work needed to
                    finish that phase.
                  </Text>
                </Box>
              )}
            </Box>
          </ScrollArea>
        </Paper>
      </Box>
    </Box>
  );
}

function PhaseInspector({
  step,
  steps,
  answers,
  questions,
  investigationComplete,
  phaseGaps,
  isCommander,
  completedPhaseIds,
  onComplete,
  onSelectItem,
  evidenceItems = [],
  commanderQuestions = [],
  onAddEvidence,
  onRemoveEvidence,
  participants,
  commanderParticipantId,
  workCatalog = WORKFLOW_CANVAS_WORK,
  threadCatalog = COLLAB_THREADS,
  hideGuidance = false,
  hideEvidence = false,
}: {
  step: WorkflowStep;
  steps: WorkflowStep[];
  answers: WorkAnswersState;
  questions: Question[];
  investigationComplete: boolean;
  phaseGaps: string[];
  isCommander: boolean;
  completedPhaseIds: string[];
  onComplete: () => void;
  onSelectItem: (id: string) => void;
  evidenceItems?: EvidenceItem[];
  commanderQuestions?: CommanderQuestion[];
  onAddEvidence?: (kind?: EvidenceKind) => void;
  onRemoveEvidence?: (id: string) => void;
  participants: Participant[];
  commanderParticipantId: string;
  workCatalog?: WorkflowWorkItem[];
  threadCatalog?: CollabThreadDef[];
  hideGuidance?: boolean;
  hideEvidence?: boolean;
}) {
  const guidance = PHASE_GUIDANCE[step.id] ?? step.phase.label;
  const phaseWork = workItemsForPhase(step.id, workCatalog);
  const required = phaseWork.filter((w) => w.required);
  const requiredDone = phaseGaps.length === 0;
  const doneCount = required.filter((w) =>
    isWorkItemAnswered(w, answers, participants, commanderParticipantId, investigationComplete),
  ).length;
  const canOfferComplete =
    isCommander && isPhaseCompletable(step, steps, completedPhaseIds);

  const remainingWork = phaseWork
    .map((item) => ({
      item,
      status: workRuntimeStatus(
        item,
        answers,
        participants,
        commanderParticipantId,
        investigationComplete,
        workCatalog,
      ),
    }))
    .filter(({ item, status }) => {
      if (item.answerType === 'generated') return true;
      return status !== 'answered';
    });

  const threadPlan =
    step.id === 'investigation'
      ? buildThreadPlan(
          questions,
          investigationComplete,
          participants,
          commanderParticipantId,
          threadCatalog,
        )
      : null;
  const remainingCollab =
    threadPlan?.threads.flatMap(({ thread, items }) =>
      items
        .filter((entry) => entry.role === 'now' || entry.role === 'blocked')
        .map((entry) => ({
          threadLabel: thread.label,
          entry,
        })),
    ) ?? [];

  const remainingCommander = commanderQuestions.filter(
    (question) => !isCommanderQuorumComplete(question, participants, commanderParticipantId),
  );
  const remainingTotal =
    remainingWork.length + remainingCollab.length + remainingCommander.length;

  const completeButton = (
    <Button color="teal" fullWidth onClick={onComplete} disabled={!requiredDone}>
      Complete Phase
    </Button>
  );

  return (
    <Stack gap="md">
      {hideGuidance ? null : (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Guidance
          </Text>
          <Box
            p="sm"
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--monosuite-color-border)',
              background: 'var(--monosuite-color-surface-sunken)',
            }}
          >
            <Text size="sm" lh={1.5}>
              {guidance}
            </Text>
          </Box>
        </Stack>
      )}

      {hideEvidence ? null : (
        <PhaseEvidenceInspector
          items={evidenceItems}
          onAdd={onAddEvidence}
          onRemove={onRemoveEvidence}
        />
      )}

      {required.length > 0 ? (
        <Stack gap="xs">
          <Group justify="space-between" gap="xs">
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
              Required progress
            </Text>
            <Text size="xs" c="dimmed">
              {doneCount} of {required.length} complete
            </Text>
          </Group>
          <Progress
            value={(doneCount / Math.max(required.length, 1)) * 100}
            color="teal"
            size="sm"
          />
        </Stack>
      ) : null}

      <Stack gap="xs">
        <Group justify="space-between" gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Remaining to finish
          </Text>
          <Text size="xs" c="dimmed">
            {remainingTotal === 0 ? 'None' : `${remainingTotal} open`}
          </Text>
        </Group>

        {remainingTotal === 0 ? (
          <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
            <Text size="sm" c="dimmed">
              {canOfferComplete && requiredDone
                ? 'Required work is complete. Mark the phase done when ready.'
                : 'No open items in this phase.'}
            </Text>
          </Paper>
        ) : (
          <Stack gap={6}>
            {remainingWork.map(({ item, status }) => (
              <UnstyledButton
                key={item.id}
                className="monosuite-workflow-canvas-inspector-link"
                onClick={() => onSelectItem(item.id)}
                aria-label={`Open work item ${item.title}`}
              >
                <Group gap="xs" wrap="nowrap" justify="space-between">
                  <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={6} wrap="nowrap">
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          status === 'blocked'
                            ? 'warning'
                            : status === 'ready'
                              ? 'success'
                              : item.required
                                ? 'teal'
                                : 'neutral'
                        }
                      >
                        {status === 'blocked'
                          ? 'Blocked'
                          : status === 'ready'
                            ? 'Ready'
                            : item.required
                              ? 'Required'
                              : 'Optional'}
                      </Badge>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {item.roleLabel}
                      </Text>
                    </Group>
                    <Text size="sm" fw={600} lineClamp={2}>
                      {item.title}
                    </Text>
                  </Stack>
                  <IconChevronRight size={16} color="var(--mantine-color-dimmed)" aria-hidden />
                </Group>
              </UnstyledButton>
            ))}

            {remainingCollab.map(({ threadLabel, entry }) => {
              const kind = collabKind(entry.question);
              const accent = collabAccent(kind);
              const ready = entry.role === 'now';
              return (
                <UnstyledButton
                  key={`collab-${entry.question.id}`}
                  className="monosuite-workflow-canvas-inspector-link"
                  data-ready={ready ? 'true' : undefined}
                  onClick={() => onSelectItem(`collab-${entry.question.id}`)}
                  aria-label={`Open ${collabCode(entry.question)}`}
                >
                  <Group gap="xs" wrap="nowrap" justify="space-between">
                    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                      <Group gap={6} wrap="nowrap">
                        <Badge size="xs" variant="light" color={ready ? accent : 'neutral'}>
                          {collabCode(entry.question)}
                        </Badge>
                        <Badge size="xs" variant={ready ? 'filled' : 'outline'} color={ready ? accent : 'neutral'}>
                          {ready ? 'Your turn' : 'Waiting'}
                        </Badge>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {threadLabel}
                        </Text>
                      </Group>
                      <Text size="sm" fw={600} lineClamp={2}>
                        {entry.question.text}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {ready
                          ? `Answer by · ${collabAssigneeLabel(entry.question)}`
                          : entry.blockedReason ?? 'Waiting on prior thread step'}
                      </Text>
                    </Stack>
                    <IconChevronRight size={16} color="var(--mantine-color-dimmed)" aria-hidden />
                  </Group>
                </UnstyledButton>
              );
            })}

            {remainingCommander.map((question) => (
              <UnstyledButton
                key={question.id}
                className="monosuite-workflow-canvas-inspector-link"
                onClick={() => onSelectItem(commanderNodeId(question.id))}
                aria-label={`Open custom question ${question.title}`}
              >
                <Group gap="xs" wrap="nowrap" justify="space-between">
                  <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={6}>
                      <Badge size="xs" variant="filled" color="brand">
                        Commander
                      </Badge>
                      <Badge size="xs" variant="light" color={question.required ? 'warning' : 'neutral'}>
                        {question.required ? 'Required' : 'Optional'}
                      </Badge>
                    </Group>
                    <Text size="sm" fw={600} lineClamp={2}>
                      {question.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Answer by · {question.assigneeName}
                    </Text>
                  </Stack>
                  <IconChevronRight size={16} color="var(--mantine-color-dimmed)" aria-hidden />
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        )}
      </Stack>

      {canOfferComplete ? (
        requiredDone ? (
          completeButton
        ) : (
          <Tooltip
            label={
              phaseGaps.length > 0
                ? `Still needed:\n${phaseGaps.map((gap) => `• ${gap}`).join('\n')}`
                : 'Complete required work first'
            }
            multiline
            w={280}
            withArrow
          >
            <Box>{completeButton}</Box>
          </Tooltip>
        )
      ) : null}
    </Stack>
  );
}

function WorkInspector({
  item,
  draft,
  onDraftChange,
  choiceValues,
  onChoiceValuesChange,
  choiceOther,
  onChoiceOtherChange,
  answers,
  status,
  onSave,
  participants,
  commanderParticipantId,
  workCatalog = WORKFLOW_CANVAS_WORK,
}: {
  item: WorkflowWorkItem;
  draft: string;
  onDraftChange: (value: string) => void;
  choiceValues: string[];
  onChoiceValuesChange: (values: string[]) => void;
  choiceOther: string;
  onChoiceOtherChange: (value: string) => void;
  answers: WorkAnswersState;
  status: WorkRuntimeStatus;
  onSave: () => void;
  participants: Participant[];
  commanderParticipantId: string;
  workCatalog?: WorkflowWorkItem[];
}) {
  const { people, quorum } = workItemQuorum(item, answers, participants, commanderParticipantId);
  const inPool = isPersonInAssigneePool(CURRENT_USER.id, people);
  const choiceValid =
    item.answerType === 'select'
      ? isChoiceAnswerValid(choiceValues, choiceOther, item.selectionMode)
      : draft.trim().length > 0;
  const canSave = status !== 'blocked' && inPool && choiceValid;
  const ownerAnswersId = workCatalog.find(
    (entry) => entry.role === 'owner' && entry.phaseId === 'investigation',
  )?.id;
  const adminAnswersId = workCatalog.find(
    (entry) => entry.role === 'admin' && entry.phaseId === 'investigation',
  )?.id;

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          Guidance
        </Text>
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="sm" lh={1.5}>
            Investigation guidance: confirm facts and authority before generating containment work.
          </Text>
        </Paper>
      </Stack>

      <Text size="sm" fw={600} lh={1.45}>
        {item.question}
      </Text>

      {item.answerType !== 'generated' ? (
        <TaskQuorumProgress roleLabel={item.roleLabel} role={item.role} quorum={quorum} />
      ) : null}

      {status === 'blocked' && item.dependsOn?.length ? (
        <Paper withBorder radius="sm" p="sm" className="monosuite-workflow-canvas-dependency">
          <Group gap={8} wrap="nowrap" align="flex-start">
            <IconLock size={15} color="var(--mantine-color-warning-filled)" aria-hidden />
            <Text size="xs" lh={1.45}>
              Waiting for a prior role response before this work unlocks.
            </Text>
          </Group>
        </Paper>
      ) : null}

      {(answers[item.id] ?? []).length > 0 ? (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Submitted answers
          </Text>
          {(answers[item.id] ?? []).map((answer) => (
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
      ) : null}

      {item.answerType === 'select' && inPool && status !== 'blocked' ? (
        <TaskChoiceControl
          options={item.options ?? []}
          selectionMode={item.selectionMode}
          allowOther={item.allowOther}
          values={choiceValues}
          otherText={choiceOther}
          onValuesChange={onChoiceValuesChange}
          onOtherTextChange={onChoiceOtherChange}
          label={item.answerLabel}
        />
      ) : null}

      {item.answerType === 'textarea' && inPool && status !== 'blocked' ? (
        <Textarea
          label={item.answerLabel}
          placeholder="Record the current observation…"
          minRows={3}
          autosize
          maxRows={8}
          value={draft}
          onChange={(event) => onDraftChange(event.currentTarget.value)}
        />
      ) : null}

      {item.answerType === 'generated' ? (
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="sm">
            Selected method:{' '}
            <Text span fw={700}>
              {summarizeWorkAnswers(
                adminAnswersId ? answers[adminAnswersId] : undefined,
              ) || 'No method selected'}
            </Text>
          </Text>
          <Text size="sm" mt={6}>
            Business window:{' '}
            <Text span fw={700}>
              {summarizeWorkAnswers(
                ownerAnswersId ? answers[ownerAnswersId] : undefined,
              ) || 'Not confirmed'}
            </Text>
          </Text>
        </Paper>
      ) : inPool ? (
        <Group justify="flex-end">
          <Button color="teal" disabled={!canSave} onClick={onSave}>
            Save answer
          </Button>
        </Group>
      ) : (
        <Text size="xs" c="dimmed">
          Read-only · you are not in the {item.roleLabel} assignee pool.
        </Text>
      )}
    </Stack>
  );
}

function CollabInspector({
  question,
  draft,
  onDraftChange,
  choiceValues,
  onChoiceValuesChange,
  choiceOther,
  onChoiceOtherChange,
  onSaveAnswer,
  onSaveDecision,
  canAnswer,
  canDecide,
  remainingCount,
  onContinue,
  participants,
  commanderParticipantId,
}: {
  question: Question;
  draft: string;
  onDraftChange: (value: string) => void;
  choiceValues: string[];
  onChoiceValuesChange: (values: string[]) => void;
  choiceOther: string;
  onChoiceOtherChange: (value: string) => void;
  onSaveAnswer: () => void;
  onSaveDecision: () => void;
  canAnswer: boolean;
  canDecide: boolean;
  remainingCount: number;
  onContinue: () => void;
  participants: Participant[];
  commanderParticipantId: string;
}) {
  const kind = collabKind(question);
  const accent = collabAccent(kind);
  const latest = question.answers?.[question.answers.length - 1];
  const assignee = collabAssigneeLabel(question);
  const actionHint = collabActionHint(question);
  const people = questionPeople(question, participants, commanderParticipantId);
  const quorum = taskQuorumStatus(question.roleAnswers, people);
  const inPool = people.length === 0 || isPersonInAssigneePool(CURRENT_USER.id, people);
  const decisionValid = isChoiceAnswerValid(choiceValues, choiceOther, question.selectionMode);

  return (
    <Stack gap="md">
      <Paper withBorder radius="sm" p="sm" bg={`var(--mantine-color-${accent}-light)`}>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color={accent} size="sm" radius="sm" aria-hidden>
            <IconClipboardList size={14} />
          </ThemeIcon>
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" fw={700} c={accent} tt="uppercase" lts="0.05em">
              What to do
            </Text>
            <Text size="sm" fw={700} lh={1.4}>
              {actionHint}
            </Text>
            <Text size="xs" c="dimmed">
              Answer by · {assignee}
            </Text>
          </Stack>
        </Group>
      </Paper>

      {people.length > 0 ? (
        <TaskQuorumProgress
          roleLabel={assignee}
          role={question.assigneeRole}
          quorum={quorum}
        />
      ) : null}

      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          Status
        </Text>
        <Group gap={6}>
          <Badge size="sm" variant="light" color={accent}>
            {collabCode(question)}
          </Badge>
          <Badge size="sm" variant="light" color={quorum.isComplete || question.decision ? 'success' : 'neutral'}>
            {collabStatusLabel(question)}
          </Badge>
          <Badge size="sm" variant="filled" color={accent}>
            {assignee}
          </Badge>
        </Group>
        {!latest && !question.decision && (question.roleAnswers?.length ?? 0) === 0 ? (
          <Text size="xs" c="dimmed" lh={1.45}>
            No answers yet — {assignee} should respond first.
          </Text>
        ) : null}
      </Stack>

      {(question.roleAnswers ?? []).length > 0 ? (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Role answers
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
      ) : null}

      {latest ? (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
            Latest answer
          </Text>
          <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
            <Text size="sm" lh={1.5}>
              <Text span fw={700}>
                {latest.author}:
              </Text>{' '}
              {latest.text}
            </Text>
          </Paper>
        </Stack>
      ) : null}

      {question.decision && quorum.isComplete ? (
        <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-success-light)">
          <Text size="sm" fw={700}>
            Decision · {question.decision.choice}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {question.decision.by} · {question.decision.at}
          </Text>
        </Paper>
      ) : null}

      {kind === 'question' && canAnswer && inPool ? (
        <Stack gap="sm">
          <Textarea
            label={`Answer as ${assignee}`}
            placeholder="Write the response for this question…"
            minRows={3}
            autosize
            maxRows={8}
            value={draft}
            onChange={(event) => onDraftChange(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button color="teal" disabled={!draft.trim()} onClick={onSaveAnswer}>
              Submit answer
            </Button>
          </Group>
        </Stack>
      ) : null}

      {kind === 'decision' && !quorum.isComplete && canDecide && question.options?.length ? (
        inPool ? (
          <Stack gap="sm">
            <TaskChoiceControl
              options={question.options}
              selectionMode={question.selectionMode}
              allowOther={question.allowOther}
              values={choiceValues}
              otherText={choiceOther}
              onValuesChange={onChoiceValuesChange}
              onOtherTextChange={onChoiceOtherChange}
              label={`Decision for ${assignee}`}
            />
            <Group justify="flex-end">
              <Button color="brand" disabled={!decisionValid} onClick={onSaveDecision}>
                Record decision
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text size="xs" c="dimmed">
            Read-only · waiting for {assignee} assignees.
          </Text>
        )
      ) : null}

      {remainingCount > 1 ? (
        <Button
          variant="light"
          color={accent}
          fullWidth
          rightSection={<IconChevronRight size={14} />}
          onClick={onContinue}
        >
          Next question · {remainingCount} open
        </Button>
      ) : null}
    </Stack>
  );
}
