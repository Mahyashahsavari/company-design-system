import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useEffect, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import { buildWorkflowFlow } from './buildWorkflowFlow';
import type { ResponseWorkflowProps } from './types';
import { WorkflowStepNode } from './WorkflowStepNode';

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowStepNode,
};

function ResponseWorkflowCanvas({
  steps,
  protocol = 'NIC800',
  height = 168,
  title = 'Response Workflow',
}: ResponseWorkflowProps) {
  const { fitView } = useReactFlow();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildWorkflowFlow(steps),
    [steps],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const next = buildWorkflowFlow(steps);
    setNodes(next.nodes);
    setEdges(next.edges);
    const id = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 200, maxZoom: 1 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [steps, setNodes, setEdges, fitView]);

  const currentCount = steps.filter((s) => s.status === 'current').length;
  const doneCount = steps.filter((s) => s.status === 'completed').length;

  return (
    <Stack
      gap={0}
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 8,
        background: 'var(--mantine-color-body)',
        overflow: 'hidden',
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          background:
            'linear-gradient(90deg, var(--mantine-color-teal-light) 0%, var(--mantine-color-body) 42%)',
        }}
      >
        <Group gap="sm">
          <Text size="sm" fw={700}>
            {title}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">
            {doneCount}/{steps.length} cleared
            {currentCount > 0 ? ` · ${currentCount} active` : ''}
          </Text>
        </Group>
        <Badge variant="outline" color="teal" size="sm" radius="sm">
          {protocol}
        </Badge>
      </Group>

      <Box style={{ height, width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.6}
          maxZoom={1.25}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          style={{ background: 'var(--monosuite-color-surface-sunken)' }}
        >
          <Background
            id="wf-grid"
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.2}
            color="var(--mantine-color-default-border)"
          />
          <Controls
            showInteractive={false}
            position="bottom-right"
            style={{
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: 'none',
            }}
          />
          <MiniMap
            pannable
            zoomable
            position="bottom-left"
            nodeStrokeWidth={2}
            style={{
              width: 96,
              height: 56,
              borderRadius: 6,
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-body)',
            }}
            maskColor="color-mix(in srgb, var(--mantine-color-teal-filled) 8%, transparent)"
            nodeColor={(node) => {
              const status = (node.data as { status?: string } | undefined)?.status;
              if (status === 'current') return 'var(--mantine-color-teal-filled)';
              if (status === 'completed') return 'var(--mantine-color-teal-light-color)';
              return 'var(--mantine-color-default-border)';
            }}
          />
        </ReactFlow>
      </Box>
    </Stack>
  );
}

/** Dynamic response-workflow canvas. Steps are owned by the parent. */
export function ResponseWorkflow(props: ResponseWorkflowProps) {
  return (
    <ReactFlowProvider>
      <ResponseWorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}
