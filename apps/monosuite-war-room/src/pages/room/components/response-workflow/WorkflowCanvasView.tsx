import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  ScrollArea,
  Select,
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
  IconScale,
  IconSearch,
  IconShieldCheck,
  IconTopologyStar,
  IconTool,
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
import type { Question, WorkflowStep } from '../../data';
import {
  PHASE_GUIDANCE,
  WORKFLOW_CANVAS_WORK,
  threadsForPhase,
  workItemsForPhase,
  type CollabThreadDef,
  type WorkflowWorkItem,
  type WorkflowWorkRole,
} from './workflowCanvasData';

interface WorkflowCanvasViewProps {
  steps: WorkflowStep[];
  workflowName?: string;
  questions?: Question[];
  onSubmitCollabAnswer?: (questionId: number, text: string) => void;
  onRecordDecision?: (questionId: number, choice: string) => void;
  fillHeight?: boolean;
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

type PhaseFlowNode = Node<PhaseNodeData, 'phaseNode'>;
type WorkFlowNode = Node<WorkNodeData, 'workNode'>;
type CollabFlowNode = Node<CollabNodeData, 'collabNode'>;
type ThreadFlowNode = Node<ThreadNodeData, 'threadNode'>;
type CanvasNode = PhaseFlowNode | WorkFlowNode | CollabFlowNode | ThreadFlowNode;

const ROLE_ICON: Record<WorkflowWorkRole, typeof IconBriefcase> = {
  owner: IconBriefcase,
  admin: IconTool,
  investigator: IconSearch,
  generated: IconShieldCheck,
};

const PHASE_Y = 28;
const WORK_Y = 168;
const ITEM_GAP_X = 280;
const LANE_GAP_Y = 180;
/** Fixed left-edge spacing between phase cards — never stretch for child content. */
const PHASE_SLOT = 220;
const PHASE_ORIGIN_X = 24;
const NODE_MOVE_TRANSITION = 'box-shadow 280ms ease, opacity 220ms ease';

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
  steps.forEach((step, index) => {
    columns.set(step.id, {
      x: PHASE_ORIGIN_X + index * PHASE_SLOT,
      width: PHASE_SLOT,
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
      <Text size="sm" fw={700} lineClamp={2}>
        {data.label}
      </Text>
      <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
        {data.meta}
      </Text>
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
          leftSection={<Icon size={11} />}
        >
          {data.roleLabel}
        </Badge>
        <WorkStatusChip status={data.status} />
      </Box>
      <Text size="sm" fw={data.selected || data.status === 'open' || data.status === 'ready' ? 800 : 700} lineClamp={2}>
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
        <Badge size="xs" variant="filled" color={color} leftSection={<Icon size={11} />}>
          {data.code}
        </Badge>
        <Badge
          size="xs"
          variant={data.focus ? 'filled' : 'light'}
          color={statusColor}
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
        size={data.trail || data.blocked ? 'xs' : 'sm'}
        fw={data.focus || data.selected ? 800 : 700}
        lineClamp={data.trail ? 2 : 3}
      >
        {data.title}
      </Text>
      {data.focus && data.actionHint ? (
        <Text size="xs" c="teal" fw={700} mt={6} lineClamp={2}>
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
      <Text size="sm" fw={700} lineClamp={1}>
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
};

function roleColor(role: WorkflowWorkRole): string {
  if (role === 'owner') return 'accent';
  if (role === 'admin') return 'warning';
  if (role === 'investigator') return 'teal';
  return 'success';
}

function PhaseStatusChip({ status }: { status: CanvasPhaseStatus }) {
  if (status === 'done') {
    return (
      <Badge size="xs" variant="light" color="success" leftSection={<IconCheck size={10} />}>
        Done
      </Badge>
    );
  }
  if (status === 'active') {
    return (
      <Badge size="xs" variant="filled" color="teal" leftSection={<IconRadio size={10} />}>
        Active
      </Badge>
    );
  }
  if (status === 'locked') {
    return (
      <Badge size="xs" variant="light" color="neutral" leftSection={<IconLock size={10} />}>
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
      <Badge size="xs" variant="light" color="warning" leftSection={<IconLock size={10} />}>
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

function workDependsSatisfied(item: WorkflowWorkItem, answers: Record<string, string>) {
  return (item.dependsOn ?? []).every((dep) => Boolean(answers[dep]?.trim()));
}

function workRuntimeStatus(
  item: WorkflowWorkItem,
  answers: Record<string, string>,
  investigationComplete: boolean,
): WorkRuntimeStatus {
  if (item.answerType === 'generated') {
    return investigationComplete ? 'ready' : 'blocked';
  }
  if (!workDependsSatisfied(item, answers)) return 'blocked';
  if (answers[item.id]?.trim()) return 'answered';
  return 'open';
}

function phaseCanvasStatus(
  step: WorkflowStep,
  index: number,
  steps: WorkflowStep[],
  investigationComplete: boolean,
): CanvasPhaseStatus {
  if (step.id === 'containment' && investigationComplete && step.status === 'pending') {
    return 'active';
  }
  if (step.id === 'investigation' && investigationComplete) return 'done';
  if (step.status === 'completed') return 'done';
  if (step.status === 'current') return 'active';

  const currentIdx = steps.findIndex((s) => s.status === 'current');
  if (currentIdx >= 0 && index > currentIdx && !investigationComplete) return 'locked';
  if (step.id === 'containment' && !investigationComplete) return 'locked';
  if (step.id === 'recovery' && !investigationComplete) return 'locked';
  return 'queued';
}

function phaseMeta(
  step: WorkflowStep,
  status: CanvasPhaseStatus,
  answers: Record<string, string>,
  investigationComplete: boolean,
): string {
  if (step.id === 'investigation') {
    if (investigationComplete) return 'Complete';
    const required = workItemsForPhase('investigation').filter((w) => w.required);
    const done = required.filter((w) => answers[w.id]?.trim()).length;
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
function isThreadItemDone(question: Question): boolean {
  if (question.status === 'decision') return Boolean(question.decision);
  if (question.status === 'answered') return true;
  return (question.answers?.length ?? 0) > 0;
}

function needsThreadAction(question: Question): boolean {
  return !isThreadItemDone(question);
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

function findWorkItem(id: string | null): WorkflowWorkItem | undefined {
  if (!id) return undefined;
  return WORKFLOW_CANVAS_WORK.find((item) => item.id === id);
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
        role: needsThreadAction(question) ? 'now' : 'done',
        blockedReason: null,
      });
      return;
    }

    const previousIds = thread.itemIds.slice(0, index);
    const previousDone = previousIds.every((prevId) => {
      const prev = questionsById.get(prevId);
      return prev ? isThreadItemDone(prev) : true;
    });

    if (isThreadItemDone(question)) {
      resolved.push({ question, role: 'done', blockedReason: null });
      return;
    }

    if (!previousDone) {
      if (sawBlocked) return;
      sawBlocked = true;
      const blocker = previousIds
        .map((prevId) => questionsById.get(prevId))
        .reverse()
        .find((prev) => prev && !isThreadItemDone(prev));
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
): {
  threads: Array<{ thread: CollabThreadDef; items: ResolvedThreadItem[] }>;
  focusIds: number[];
  remainingCount: number;
} {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const threads = threadsForPhase('investigation').map((thread) => ({
    thread,
    items: resolveThreadItems(thread, questionsById, investigationComplete),
  }));

  const focusIds = threads.flatMap(({ items }) =>
    items.filter((item) => item.role === 'now').map((item) => item.question.id),
  );

  const remainingCount = threads.reduce((count, { thread, items }) => {
    const visibleIds = new Set(items.map((item) => item.question.id));
    const hiddenActions = thread.itemIds.filter((id) => {
      const question = questionsById.get(id);
      return question && needsThreadAction(question) && !visibleIds.has(id);
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

function workLayout(phaseId: string, phaseX: number) {
  // Board-style under the phase: lanes run left → right.
  if (phaseId === 'investigation') {
    return {
      'owner-impact': { x: phaseX, y: WORK_Y },
      'admin-isolation': { x: phaseX + ITEM_GAP_X, y: WORK_Y },
      'investigator-c2': { x: phaseX, y: WORK_Y + LANE_GAP_Y },
    } as Record<string, { x: number; y: number }>;
  }

  if (phaseId === 'containment') {
    return {
      'generated-containment': { x: phaseX, y: WORK_Y },
    } as Record<string, { x: number; y: number }>;
  }

  return {} as Record<string, { x: number; y: number }>;
}

function appendPhaseWork(
  phaseId: string,
  options: {
    phaseX: number;
    answers: Record<string, string>;
    selectedId: string | null;
    investigationComplete: boolean;
    nextNodes: CanvasNode[];
    nextEdges: Edge[];
  },
) {
  const { phaseX, answers, selectedId, investigationComplete, nextNodes, nextEdges } = options;
  const work = workItemsForPhase(phaseId);
  const layout = workLayout(phaseId, phaseX);

  work.forEach((item) => {
    const status = workRuntimeStatus(item, answers, investigationComplete);
    nextNodes.push({
      id: item.id,
      type: 'workNode',
      position: layout[item.id] ?? { x: phaseX, y: WORK_Y },
      style: { transition: NODE_MOVE_TRANSITION, zIndex: 5 },
      data: {
        title:
          item.answerType === 'generated' && answers['admin-isolation']
            ? answers['admin-isolation']
            : item.title,
        roleLabel: item.roleLabel,
        role: item.role,
        meta: item.meta,
        status,
        selected: selectedId === item.id,
      },
      selectable: true,
      draggable: true,
    });

    if (item.dependsOn?.length) return;

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

  if (phaseId === 'investigation' && work.some((item) => item.id === 'admin-isolation')) {
    const depActive = Boolean(answers['owner-impact']?.trim());
    nextEdges.push({
      id: 'work-owner-admin',
      source: 'owner-impact',
      sourceHandle: 'right',
      target: 'admin-isolation',
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

function appendCollabThreads(
  investigationId: string,
  options: {
    phaseX: number;
    threadPlan: ReturnType<typeof buildThreadPlan>;
    selectedId: string | null;
    nextNodes: CanvasNode[];
    nextEdges: Edge[];
  },
) {
  const { phaseX, threadPlan, selectedId, nextNodes, nextEdges } = options;
  if (threadPlan.threads.length === 0) return;

  // Board-style: each thread is a horizontal lane under Investigation.
  const threadStartY = WORK_Y + LANE_GAP_Y * 2 + 20;
  let linkedFromPhase = false;

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
      nextEdges.push({
        id: `phase-thread-rail-${investigationId}`,
        source: investigationId,
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
  answers: Record<string, string>;
  expandedPhaseId: string | null;
  selectedId: string | null;
  investigationComplete: boolean;
}): {
  nodes: CanvasNode[];
  edges: Edge[];
  remainingCollabCount: number;
  focusIds: number[];
  threadPlan: ReturnType<typeof buildThreadPlan>;
} {
  const { steps, questions, answers, expandedPhaseId, selectedId, investigationComplete } = options;
  const nextNodes: CanvasNode[] = [];
  const nextEdges: Edge[] = [];
  const childPhases = visibleChildPhases(expandedPhaseId);
  const columns = phaseColumns(steps, expandedPhaseId);
  const threadPlan = buildThreadPlan(questions, investigationComplete);
  let remainingCollabCount = 0;
  let focusIds: number[] = [];

  steps.forEach((step, index) => {
    const status = phaseCanvasStatus(step, index, steps, investigationComplete);
    const column = columns.get(step.id) ?? {
      x: PHASE_ORIGIN_X + index * PHASE_SLOT,
      width: PHASE_SLOT,
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
        meta: phaseMeta(step, status, answers, investigationComplete),
        status,
        selected: selectedId === step.id,
        expanded: column.expanded,
      },
      selectable: true,
      draggable: true,
    });

    if (index < steps.length - 1) {
      const filled = status === 'done';
      nextEdges.push({
        id: `phase-${step.id}-${steps[index + 1].id}`,
        source: step.id,
        sourceHandle: 'right',
        target: steps[index + 1].id,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: status === 'active',
        style: {
          stroke: filled ? 'var(--mantine-color-teal-filled)' : 'var(--monosuite-color-border)',
          strokeWidth: filled ? 2 : 1.5,
          strokeDasharray: filled ? undefined : '6 5',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: filled ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-dimmed)',
        },
      });
    }
  });

  childPhases.forEach((phaseId) => {
    const phaseX = columns.get(phaseId)?.x ?? 0;
    appendPhaseWork(phaseId, {
      phaseX,
      answers,
      selectedId,
      investigationComplete,
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
      nextNodes,
      nextEdges,
    });
  }

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
  workflowName,
  questions = [],
  onSubmitCollabAnswer,
  onRecordDecision,
  fillHeight = false,
}: WorkflowCanvasViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [decisionChoice, setDecisionChoice] = useState<string | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(
    () => steps.find((s) => s.status === 'current')?.id ?? steps[0]?.id ?? null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(expandedPhaseId);
  const [investigationComplete, setInvestigationComplete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const forceDefaultLayoutRef = useRef(false);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const [focusCursor, setFocusCursor] = useState(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const requiredInvestigationDone = useMemo(() => {
    const required = workItemsForPhase('investigation').filter((w) => w.required);
    return required.every((w) => Boolean(answers[w.id]?.trim()));
  }, [answers]);

  const graph = useMemo(
    () =>
      buildGraph({
        steps,
        questions,
        answers,
        expandedPhaseId,
        selectedId,
        investigationComplete,
      }),
    [answers, expandedPhaseId, investigationComplete, questions, selectedId, steps],
  );

  const focusIds = graph.focusIds;

  useEffect(() => {
    forceDefaultLayoutRef.current = true;
    setLayoutEpoch((value) => value + 1);
  }, [expandedPhaseId]);

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
    if (layoutEpoch === 0 || !flowInstance || !expandedPhaseId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const all = flowInstance.getNodes();
      const related = all.filter((node) => {
        if (node.id === expandedPhaseId) return true;
        if (node.type === 'workNode') {
          return findWorkItem(node.id)?.phaseId === expandedPhaseId;
        }
        if (expandedPhaseId === 'investigation') {
          return node.type === 'collabNode' || node.type === 'threadNode';
        }
        return false;
      });

      if (related.length <= 1) {
        flowInstance.fitView({ padding: 0.22, duration: 320, maxZoom: 1.15 });
        return;
      }

      // Zoom into the selected phase cluster for readability.
      flowInstance.fitView({
        nodes: related,
        padding: 0.3,
        duration: 420,
        maxZoom: 1.45,
        minZoom: 0.55,
      });
    }, 48);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [expandedPhaseId, flowInstance, layoutEpoch]);

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
  const selectedWork = findWorkItem(selectedId);
  const selectedCollabId =
    selectedId?.startsWith('collab-') && selectedId
      ? Number(selectedId.replace('collab-', ''))
      : null;
  const selectedCollab =
    selectedCollabId != null ? questions.find((q) => q.id === selectedCollabId) ?? null : null;
  const overviewPhase =
    selectedPhase ??
    (!selectedWork && !selectedCollab && expandedPhaseId
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
    setDraft('');
    setDecisionChoice(null);
    showToast('Opened the next question to answer');
  }, [focusCursor, focusIds, showToast]);

  const selectCanvasItem = useCallback(
    (id: string) => {
      setSelectedId(id);
      const work = findWorkItem(id);
      if (work) {
        setExpandedPhaseId(work.phaseId);
        setDraft(answers[work.id] ?? '');
        setDecisionChoice(null);
        return;
      }
      if (id.startsWith('collab-')) {
        setExpandedPhaseId('investigation');
        setDraft('');
        setDecisionChoice(null);
        return;
      }
      setExpandedPhaseId(id);
      setDraft('');
      setDecisionChoice(null);
    },
    [answers],
  );

  const onNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      const canvasNode = node as CanvasNode;

      if (canvasNode.type === 'phaseNode') {
        const status = (canvasNode.data as PhaseNodeData).status;
        if (status === 'locked') {
          showToast('Complete the active phase first');
          return;
        }
        setSelectedId(canvasNode.id);
        setExpandedPhaseId(canvasNode.id);
        setDraft('');
        setDecisionChoice(null);
        return;
      }

      selectCanvasItem(canvasNode.id);
    },
    [selectCanvasItem, showToast],
  );

  const closeInspector = () => {
    setSelectedId(null);
    setDraft('');
    setDecisionChoice(null);
  };

  const saveAnswer = () => {
    if (!selectedWork) return;
    if (selectedWork.answerType === 'generated') return;
    const status = workRuntimeStatus(selectedWork, answers, investigationComplete);
    if (status === 'blocked') {
      showToast('Waiting for a prior response');
      return;
    }
    const value = draft.trim();
    if (!value) {
      showToast('Select or enter an answer first');
      return;
    }
    setAnswers((prev) => ({ ...prev, [selectedWork.id]: value }));
    showToast(
      selectedWork.id === 'owner-impact'
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
    setDraft('');
    showToast('Answer recorded · thread updated');
  };

  const saveCollabDecision = () => {
    if (!selectedCollab || !onRecordDecision || !decisionChoice) return;
    onRecordDecision(selectedCollab.id, decisionChoice);
    showToast('Decision recorded · thread updated');
  };

  const completeInvestigation = () => {
    if (!requiredInvestigationDone) return;
    setInvestigationComplete(true);
    setExpandedPhaseId('containment');
    setSelectedId('containment');
    forceDefaultLayoutRef.current = true;
    setLayoutEpoch((value) => value + 1);
    showToast('Containment unlocked · Completed trail visible');
  };

  return (
    <Box
      className={`monosuite-workflow-canvas-shell${fillHeight ? ' monosuite-workflow-canvas-shell--fill' : ''}`}
      data-focus-phase={expandedPhaseId ?? undefined}
      aria-label="Response workflow canvas"
    >
      <Box className="monosuite-workflow-canvas-toolbar">
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <IconTopologyStar size={16} color="var(--mantine-color-teal-filled)" aria-hidden />
          <Text size="xs" c="dimmed" lineClamp={2}>
            {workflowName ? `${workflowName} · ` : ''}
            Phases stay evenly spaced. Open a phase, then answer the bold “Your turn” card —
            assignee is shown on each item.
          </Text>
        </Group>
        <Group gap={6} wrap="nowrap">
          <Badge variant="light" color="teal" size="xs">
            Question
          </Badge>
          <Badge variant="light" color="accent" size="xs">
            Finding
          </Badge>
          <Badge variant="light" color="brand" size="xs">
            Decision
          </Badge>
        </Group>
      </Box>

      <Box className="monosuite-workflow-canvas-stage">
        <Box className="monosuite-workflow-canvas-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            onInit={setFlowInstance}
            fitView
            fitViewOptions={{ padding: 0.18 }}
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
            <Controls showInteractive={false} position="bottom-left" />
            <Panel position="top-left">
              <Tooltip label="Reset layout to default positions" withArrow position="right">
                <ActionIcon
                  className="monosuite-workflow-canvas-reset"
                  variant="default"
                  size="md"
                  aria-label="Reset layout to default positions"
                  onClick={resetLayout}
                >
                  <IconArrowBackUp size={16} />
                </ActionIcon>
              </Tooltip>
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
            <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                c={selectedCollab ? collabAccent(collabKind(selectedCollab)) : 'teal'}
                lts="0.06em"
              >
                {selectedCollab
                  ? `${collabCode(selectedCollab)} · ${collabKind(selectedCollab)}`
                  : selectedWork
                    ? `${selectedWork.roleLabel}${selectedWork.required ? ' · Required' : ' · Optional'}`
                    : overviewPhase
                      ? overviewPhase.status === 'current' ||
                        (overviewPhase.id === 'containment' && investigationComplete)
                        ? 'Active phase'
                        : 'Phase overview'
                      : 'Inspector'}
              </Text>
              <Text fw={700} size="sm" lh={1.35} lineClamp={3}>
                {selectedCollab
                  ? selectedCollab.text
                  : selectedWork
                    ? selectedWork.answerType === 'generated' && answers['admin-isolation']
                      ? answers['admin-isolation']
                      : selectedWork.title
                    : overviewPhase?.label ?? 'Select a node'}
              </Text>
            </Stack>
            {selectedCollab || selectedWork || selectedPhase ? (
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
                  decisionChoice={decisionChoice}
                  onDecisionChoiceChange={setDecisionChoice}
                  onSaveAnswer={saveCollabAnswer}
                  onSaveDecision={saveCollabDecision}
                  canAnswer={Boolean(onSubmitCollabAnswer)}
                  canDecide={Boolean(onRecordDecision)}
                  remainingCount={focusIds.length}
                  onContinue={revealNextCollab}
                />
              ) : selectedWork ? (
                <WorkInspector
                  item={selectedWork}
                  draft={draft}
                  onDraftChange={setDraft}
                  answers={answers}
                  status={workRuntimeStatus(selectedWork, answers, investigationComplete)}
                  onSave={saveAnswer}
                />
              ) : overviewPhase ? (
                <PhaseInspector
                  step={overviewPhase}
                  answers={answers}
                  questions={questions}
                  investigationComplete={investigationComplete}
                  requiredDone={requiredInvestigationDone}
                  onComplete={completeInvestigation}
                  onSelectItem={selectCanvasItem}
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
  answers,
  questions,
  investigationComplete,
  requiredDone,
  onComplete,
  onSelectItem,
}: {
  step: WorkflowStep;
  answers: Record<string, string>;
  questions: Question[];
  investigationComplete: boolean;
  requiredDone: boolean;
  onComplete: () => void;
  onSelectItem: (id: string) => void;
}) {
  const guidance = PHASE_GUIDANCE[step.id] ?? step.phase.label;
  const phaseWork = workItemsForPhase(step.id);
  const required = phaseWork.filter((w) => w.required);
  const doneCount = required.filter((w) => {
    if (w.answerType === 'generated') return investigationComplete;
    return Boolean(answers[w.id]?.trim());
  }).length;

  const remainingWork = phaseWork
    .map((item) => ({
      item,
      status: workRuntimeStatus(item, answers, investigationComplete),
    }))
    .filter(({ item, status }) => {
      if (item.answerType === 'generated') return true;
      return status !== 'answered';
    });

  const threadPlan =
    step.id === 'investigation' ? buildThreadPlan(questions, investigationComplete) : null;
  const remainingCollab =
    threadPlan?.threads.flatMap(({ thread, items }) =>
      items
        .filter((entry) => entry.role === 'now' || entry.role === 'blocked')
        .map((entry) => ({
          threadLabel: thread.label,
          entry,
        })),
    ) ?? [];

  const remainingTotal = remainingWork.length + remainingCollab.length;

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          Guidance
        </Text>
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="sm" lh={1.5}>
            {guidance}
          </Text>
        </Paper>
      </Stack>

      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          Phase state
        </Text>
        <Group gap={6}>
          <PhaseStatusChip
            status={
              step.id === 'investigation' && investigationComplete
                ? 'done'
                : step.id === 'containment' && investigationComplete
                  ? 'active'
                  : step.status === 'completed'
                    ? 'done'
                    : step.status === 'current'
                      ? 'active'
                      : 'queued'
            }
          />
          {step.owner !== '—' ? (
            <Text size="xs" c="dimmed">
              Owner · {step.owner}
            </Text>
          ) : null}
        </Group>
      </Stack>

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
              {step.id === 'investigation' && !investigationComplete
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
          </Stack>
        )}
      </Stack>

      {step.id === 'investigation' && !investigationComplete ? (
        <Button color="teal" fullWidth onClick={onComplete} disabled={!requiredDone}>
          Complete Investigation
        </Button>
      ) : null}
    </Stack>
  );
}

function WorkInspector({
  item,
  draft,
  onDraftChange,
  answers,
  status,
  onSave,
}: {
  item: WorkflowWorkItem;
  draft: string;
  onDraftChange: (value: string) => void;
  answers: Record<string, string>;
  status: WorkRuntimeStatus;
  onSave: () => void;
}) {
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

      {status === 'blocked' && item.dependsOn?.length ? (
        <Paper withBorder radius="sm" p="sm" className="monosuite-workflow-canvas-dependency">
          <Group gap={8} wrap="nowrap" align="flex-start">
            <IconLock size={15} color="var(--mantine-color-warning-filled)" aria-hidden />
            <Text size="xs" lh={1.45}>
              Waiting for the Asset Owner to confirm the permitted interruption window.
            </Text>
          </Group>
        </Paper>
      ) : null}

      {item.answerType === 'select' ? (
        <Select
          label={item.answerLabel}
          placeholder="Select an answer"
          data={item.options ?? []}
          value={draft || null}
          onChange={(value) => onDraftChange(value ?? '')}
          disabled={status === 'blocked'}
          allowDeselect={false}
        />
      ) : null}

      {item.answerType === 'textarea' ? (
        <Textarea
          label={item.answerLabel}
          placeholder="Record the current observation…"
          minRows={3}
          autosize
          maxRows={8}
          value={draft}
          onChange={(event) => onDraftChange(event.currentTarget.value)}
          disabled={status === 'blocked'}
        />
      ) : null}

      {item.answerType === 'generated' ? (
        <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
          <Text size="sm">
            Selected method:{' '}
            <Text span fw={700}>
              {answers['admin-isolation'] || 'No method selected'}
            </Text>
          </Text>
          <Text size="sm" mt={6}>
            Business window:{' '}
            <Text span fw={700}>
              {answers['owner-impact'] || 'Not confirmed'}
            </Text>
          </Text>
        </Paper>
      ) : (
        <Group justify="flex-end">
          <Button color="teal" disabled={status === 'blocked'} onClick={onSave}>
            Save answer
          </Button>
        </Group>
      )}
    </Stack>
  );
}

function CollabInspector({
  question,
  draft,
  onDraftChange,
  decisionChoice,
  onDecisionChoiceChange,
  onSaveAnswer,
  onSaveDecision,
  canAnswer,
  canDecide,
  remainingCount,
  onContinue,
}: {
  question: Question;
  draft: string;
  onDraftChange: (value: string) => void;
  decisionChoice: string | null;
  onDecisionChoiceChange: (value: string | null) => void;
  onSaveAnswer: () => void;
  onSaveDecision: () => void;
  canAnswer: boolean;
  canDecide: boolean;
  remainingCount: number;
  onContinue: () => void;
}) {
  const kind = collabKind(question);
  const accent = collabAccent(kind);
  const latest = question.answers?.[question.answers.length - 1];
  const assignee = collabAssigneeLabel(question);
  const actionHint = collabActionHint(question);

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

      <Stack gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          Status
        </Text>
        <Group gap={6}>
          <Badge size="sm" variant="light" color={accent}>
            {collabCode(question)}
          </Badge>
          <Badge size="sm" variant="light" color={question.decision ? 'success' : 'neutral'}>
            {collabStatusLabel(question)}
          </Badge>
          <Badge size="sm" variant="filled" color={accent}>
            {assignee}
          </Badge>
        </Group>
        {!latest && !question.decision ? (
          <Text size="xs" c="dimmed" lh={1.45}>
            No answers yet — {assignee} should respond first.
          </Text>
        ) : null}
      </Stack>

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

      {question.decision ? (
        <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-success-light)">
          <Text size="sm" fw={700}>
            Decision · {question.decision.choice}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {question.decision.by} · {question.decision.at}
          </Text>
        </Paper>
      ) : null}

      {kind === 'question' && canAnswer ? (
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
            <Button color="teal" onClick={onSaveAnswer}>
              Submit answer
            </Button>
          </Group>
        </Stack>
      ) : null}

      {kind === 'decision' && !question.decision && canDecide && question.options?.length ? (
        <Stack gap="sm">
          <Select
            label={`Decision for ${assignee}`}
            placeholder="Select an option"
            data={question.options}
            value={decisionChoice}
            onChange={onDecisionChoiceChange}
            allowDeselect={false}
          />
          <Group justify="flex-end">
            <Button color="brand" disabled={!decisionChoice} onClick={onSaveDecision}>
              Record decision
            </Button>
          </Group>
        </Stack>
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
