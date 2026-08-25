import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { WorkflowStep } from '../../data';
import type { WorkflowNodeData } from './types';

const NODE_WIDTH = 200;
const NODE_GAP = 48;
const ROW_Y = 24;

export function buildWorkflowFlow(steps: WorkflowStep[]): {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<WorkflowNodeData>[] = steps.map((step, index) => ({
    id: step.id,
    type: 'workflowStep',
    position: { x: index * (NODE_WIDTH + NODE_GAP), y: ROW_Y },
    data: {
      label: step.label,
      status: step.status,
      owner: step.owner,
      time: step.time,
      icon: step.icon,
      stepNumber: index + 1,
    },
    draggable: false,
    selectable: true,
  }));

  const edges: Edge[] = steps.slice(0, -1).map((step, index) => {
    const next = steps[index + 1]!;
    const fromDone = step.status === 'completed';
    const intoCurrent = next.status === 'current';
    const active = fromDone || intoCurrent;

    return {
      id: `e-${step.id}-${next.id}`,
      source: step.id,
      target: next.id,
      type: 'smoothstep',
      animated: intoCurrent,
      style: {
        stroke: active ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-default-border)',
        strokeWidth: intoCurrent ? 2.5 : 1.5,
        strokeDasharray: active ? undefined : '5 5',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: active ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-default-border)',
      },
    };
  });

  return { nodes, edges };
}
