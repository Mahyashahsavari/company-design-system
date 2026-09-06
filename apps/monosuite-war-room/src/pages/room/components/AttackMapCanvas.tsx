import { Box, Button, Group, TextInput } from '@mantine/core';
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAdapterFetchRound,
  buildAttackMapGraph,
  collapseAttackMapToCore,
  expandAllAttackMap,
  nodeMatchesQuery,
  toggleAttackMapBranch,
  visibleAttackMapNodeIds,
  type AttackMapEdgeModel,
  type AttackMapNodeModel,
} from './attackMapGraph';
import { attackMapNodeTypes, type AttackMapFlowNodeData } from './AttackMapNodes';
import type { ThreatEntity } from '../data';
import type { ScenarioIncident } from '../scenarios';
import { INCIDENT } from '../data';

type IncidentLike = ScenarioIncident | typeof INCIDENT;

type SimNode = AttackMapNodeModel & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
};

interface AttackMapCanvasProps {
  incident: IncidentLike;
  attackers: ThreatEntity[];
  victims: ThreatEntity[];
}

function toFlowNodes(
  models: AttackMapNodeModel[],
  positions: Map<string, { x: number; y: number }>,
  visible: Set<string>,
  query: string,
  onToggle: (id: string) => void,
): Node[] {
  const q = query.trim();
  return models
    .filter((model) => visible.has(model.id))
    .map((model) => {
      const pos = positions.get(model.id) ?? { x: 0, y: 0 };
      const matched = q.length > 0 && nodeMatchesQuery(model, q);
      const dimmed = q.length > 0 && !matched;
      const data: AttackMapFlowNodeData = {
        model,
        dimmed,
        matched,
        childCount: model.childIds.length,
        onToggle,
      };
      return {
        id: model.id,
        type: 'attackMap',
        position: { x: pos.x, y: pos.y },
        data,
        draggable: !LAYOUT_ANCHORS.has(model.id),
        zIndex: model.kind === 'incident' ? 4 : model.kind === 'group' ? 3 : model.kind === 'entity' ? 2 : 1,
      } satisfies Node;
    });
}

function toFlowEdges(edgeModels: AttackMapEdgeModel[], visible: Set<string>): Edge[] {
  return edgeModels
    .filter((edge) => visible.has(edge.source) && visible.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: false,
      markerEnd: undefined,
      markerStart: undefined,
      style: {
        stroke: edge.adapter
          ? 'color-mix(in srgb, var(--monosuite-color-border) 70%, var(--mantine-color-neutral-6))'
          : 'var(--monosuite-color-border)',
        strokeWidth: 1,
        strokeDasharray: edge.adapter ? '3 3' : undefined,
      },
    }));
}

function restLength(a: AttackMapNodeModel, b: AttackMapNodeModel) {
  if (a.kind === 'incident' && b.kind === 'group') return 200;
  if (b.kind === 'incident' && a.kind === 'group') return 200;
  if (a.kind === 'incident' || b.kind === 'incident') return 88;
  if (a.kind === 'group' || b.kind === 'group') return 88;
  return 48;
}

const LAYOUT_ANCHORS = new Set(['incident', 'group-attackers', 'group-victims']);

function sideGapForWidth(width: number) {
  return Math.max(160, Math.min(240, width * 0.28));
}

function layoutAnchors(cx: number, cy: number, sideGap: number) {
  return {
    incident: { x: cx, y: cy },
    'group-attackers': { x: cx - sideGap, y: cy },
    'group-victims': { x: cx + sideGap, y: cy },
  } as const;
}

/** Incident center · Attackers left · Victims right. */
function seedPositions(
  models: AttackMapNodeModel[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const sideGap = sideGapForWidth(width);
  const byId = new Map(models.map((model) => [model.id, model]));
  const anchors = layoutAnchors(cx, cy, sideGap);

  Object.entries(anchors).forEach(([id, pos]) => map.set(id, { ...pos }));

  const incident = byId.get('incident');
  const attrChildren = (incident?.childIds ?? []).filter((id) => byId.get(id)?.kind === 'attr');
  attrChildren.forEach((id, index, arr) => {
    // Arc above/below center so sides stay clear for attacker/victim columns
    const t = arr.length <= 1 ? 0 : index / (arr.length - 1);
    const angle = -Math.PI * 0.75 + t * Math.PI * 1.5;
    const ring = 78;
    map.set(id, {
      x: cx + Math.cos(angle) * ring,
      y: cy + Math.sin(angle) * ring,
    });
  });

  const placeUnderGroup = (groupId: string, outward: number) => {
    const group = byId.get(groupId);
    const groupPos = map.get(groupId);
    if (!group || !groupPos) return;
    group.childIds.forEach((entityId, entityIndex, entityArr) => {
      const spread = (entityIndex - (entityArr.length - 1) / 2) * 52;
      const entityPos = {
        x: groupPos.x + outward * 70,
        y: groupPos.y + spread,
      };
      map.set(entityId, entityPos);
      const entity = byId.get(entityId);
      entity?.childIds.forEach((attrId, attrIndex, attrArr) => {
        const attrSpread = (attrIndex - (attrArr.length - 1) / 2) * 28;
        map.set(attrId, {
          x: entityPos.x + outward * 56,
          y: entityPos.y + attrSpread,
        });
      });
    });
  };

  placeUnderGroup('group-attackers', -1);
  placeUnderGroup('group-victims', 1);

  models.forEach((model) => {
    if (map.has(model.id)) return;
    const parentPos = model.parentId ? map.get(model.parentId) : null;
    map.set(model.id, {
      x: (parentPos?.x ?? cx) + (Math.random() - 0.5) * 40,
      y: (parentPos?.y ?? cy) + (Math.random() - 0.5) * 40,
    });
  });

  return map;
}

function AttackMapCanvasInner({ incident, attackers, victims }: AttackMapCanvasProps) {
  const { getViewport, setViewport } = useReactFlow();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [fetchRound, setFetchRound] = useState(0);
  const initialGraph = useMemo(
    () => {
      const graph = buildAttackMapGraph(incident, attackers, victims);
      return {
        nodes: collapseAttackMapToCore(graph.nodes),
        edges: graph.edges,
      };
    },
    // Rebuild only when the modal remounts with new room entities (key from parent via opened gate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [models, setModels] = useState<AttackMapNodeModel[]>(() => initialGraph.nodes);
  const [edgeModels, setEdgeModels] = useState<AttackMapEdgeModel[]>(() => initialGraph.edges);

  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const simRef = useRef<Map<string, SimNode>>(new Map());
  const alphaRef = useRef(1);
  const pinnedRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const visible = useMemo(() => visibleAttackMapNodeIds(models), [models]);

  const onToggle = useCallback((id: string) => {
    setModels((current) => toggleAttackMapBranch(current, id));
    alphaRef.current = 1;
  }, []);

  const rebuildFlow = useCallback(() => {
    const nextNodes = toFlowNodes(models, positionsRef.current, visible, query, onToggle);
    const nextEdges = toFlowEdges(edgeModels, visible);
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [models, edgeModels, visible, query, onToggle, setNodes, setEdges]);

  // Seed / sync simulation bodies when model set changes
  useEffect(() => {
    const width = wrapRef.current?.clientWidth ?? 900;
    const height = wrapRef.current?.clientHeight ?? 560;
    if (positionsRef.current.size === 0) {
      positionsRef.current = seedPositions(models, width, height);
    }

    const sim = simRef.current;
    const liveIds = new Set(models.map((model) => model.id));

    models.forEach((model) => {
      const existing = sim.get(model.id);
      const pos = positionsRef.current.get(model.id);
      if (existing) {
        Object.assign(existing, model);
        if (LAYOUT_ANCHORS.has(model.id)) existing.fixed = true;
        return;
      }
      const parentPos = model.parentId ? positionsRef.current.get(model.parentId) : null;
      const seeded = pos ??
        (parentPos
          ? {
              x: parentPos.x + (Math.random() - 0.5) * 48,
              y: parentPos.y + (Math.random() - 0.5) * 48,
            }
          : {
              x: width / 2 + (Math.random() - 0.5) * 80,
              y: height / 2 + (Math.random() - 0.5) * 80,
            });
      positionsRef.current.set(model.id, seeded);
      sim.set(model.id, {
        ...model,
        x: seeded.x,
        y: seeded.y,
        vx: 0,
        vy: 0,
        fixed: LAYOUT_ANCHORS.has(model.id) || pinnedRef.current.has(model.id),
      });
    });

    [...sim.keys()].forEach((id) => {
      if (!liveIds.has(id)) sim.delete(id);
    });

    alphaRef.current = Math.max(alphaRef.current, 0.85);
    rebuildFlow();
  }, [models, rebuildFlow]);

  // Force tick — mirrors the prototype (strong charge, soft springs, never fully cools)
  useEffect(() => {
    const tick = () => {
      const sim = simRef.current;
      const bodies = [...sim.values()].filter((node) => visible.has(node.id));
      const alpha = alphaRef.current;
      const width = wrapRef.current?.clientWidth ?? 900;
      const height = wrapRef.current?.clientHeight ?? 560;
      const originX = width / 2;
      const originY = height / 2;

      if (bodies.length > 0) {
        const byId = sim;
        const sideGap = sideGapForWidth(width);
        const anchors = layoutAnchors(originX, originY, sideGap);
        (Object.keys(anchors) as Array<keyof typeof anchors>).forEach((id) => {
          const body = byId.get(id);
          if (!body) return;
          const pos = anchors[id];
          body.fixed = true;
          body.x = pos.x;
          body.y = pos.y;
          body.vx = 0;
          body.vy = 0;
          positionsRef.current.set(id, { x: pos.x, y: pos.y });
        });

        for (let i = 0; i < bodies.length; i += 1) {
          for (let j = i + 1; j < bodies.length; j += 1) {
            const a = bodies[i];
            const b = bodies[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist2 = dx * dx + dy * dy;
            if (dist2 < 1) {
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
              dist2 = 1;
            }
            const dist = Math.sqrt(dist2);
            const strength = a.kind === 'attr' && b.kind === 'attr' ? 900 : 4200;
            const force = (strength / dist2) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (!a.fixed) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (!b.fixed) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }

        edgeModels.forEach((edge) => {
          if (!visible.has(edge.source) || !visible.has(edge.target)) return;
          const a = byId.get(edge.source);
          const b = byId.get(edge.target);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
          const ideal = restLength(a, b);
          const force = (dist - ideal) * 0.035 * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!a.fixed) {
            a.vx += fx;
            a.vy += fy;
          }
          if (!b.fixed) {
            b.vx -= fx;
            b.vy -= fy;
          }
        });

        bodies.forEach((node) => {
          if (LAYOUT_ANCHORS.has(node.id) || node.fixed) {
            node.vx = 0;
            node.vy = 0;
            if (LAYOUT_ANCHORS.has(node.id)) {
              const pos = anchors[node.id as keyof typeof anchors];
              if (pos) {
                node.x = pos.x;
                node.y = pos.y;
                positionsRef.current.set(node.id, { x: pos.x, y: pos.y });
              }
            }
            return;
          }

          // Keep attacker/victim columns on their sides
          if (node.role === 'attacker') {
            node.vx -= (node.x - (originX - sideGap)) * 0.004 * alpha;
          } else if (node.role === 'victim') {
            node.vx -= (node.x - (originX + sideGap)) * 0.004 * alpha;
          } else {
            node.vx -= (node.x - originX) * 0.0016 * alpha;
          }
          node.vy -= (node.y - originY) * 0.0012 * alpha;
          node.vx *= 0.82;
          node.vy *= 0.82;
          node.x += Math.max(-14, Math.min(14, node.vx));
          node.y += Math.max(-14, Math.min(14, node.vy));
          positionsRef.current.set(node.id, { x: node.x, y: node.y });
        });

        alphaRef.current = Math.max(alpha * 0.995, 0.22);
        setNodes((current) =>
          current.map((node) => {
            const pos = positionsRef.current.get(node.id);
            if (!pos) return node;
            if (Math.abs(node.position.x - pos.x) < 0.15 && Math.abs(node.position.y - pos.y) < 0.15) {
              return node;
            }
            return { ...node, position: { x: pos.x, y: pos.y } };
          }),
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [edgeModels, visible, setNodes]);

  // Keep dim/match flags in sync with search without resetting sim
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        const model = models.find((item) => item.id === node.id);
        if (!model) return node;
        const matched = query.trim().length > 0 && nodeMatchesQuery(model, query);
        const dimmed = query.trim().length > 0 && !matched;
        const data = node.data as AttackMapFlowNodeData;
        return {
          ...node,
          data: {
            ...data,
            model,
            matched,
            dimmed,
            childCount: model.childIds.length,
            onToggle,
          },
        };
      }),
    );
  }, [query, models, onToggle, setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const sim = simRef.current.get(change.id);
          positionsRef.current.set(change.id, change.position);
          if (sim) {
            sim.x = change.position.x;
            sim.y = change.position.y;
            sim.vx = 0;
            sim.vy = 0;
            if (change.dragging) {
              if (LAYOUT_ANCHORS.has(change.id)) return;
              sim.fixed = true;
              pinnedRef.current.add(change.id);
            } else if (change.dragging === false) {
              if (LAYOUT_ANCHORS.has(change.id)) {
                sim.fixed = true;
                return;
              }
              sim.fixed = false;
              pinnedRef.current.delete(change.id);
              alphaRef.current = 0.7;
            }
          }
        }
      });
    },
    [onNodesChangeBase],
  );

  const handleExpandAll = () => {
    setModels((current) => expandAllAttackMap(current));
    alphaRef.current = 1;
  };

  const handleCollapse = () => {
    setModels((current) => collapseAttackMapToCore(current));
    alphaRef.current = 1;
  };

  const handleAdapterFetch = () => {
    const result = applyAdapterFetchRound(models, edgeModels, fetchRound);
    setFetchRound((value) => value + 1);
    setModels(result.nodes);
    setEdgeModels(result.edges);
    alphaRef.current = 1;
  };

  // Focus first search match
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const match = models.find((model) => visible.has(model.id) && nodeMatchesQuery(model, q));
    if (!match) return;
    const pos = positionsRef.current.get(match.id);
    if (!pos) return;
    const viewport = getViewport();
    void setViewport(
      {
        x: -pos.x * viewport.zoom + (wrapRef.current?.clientWidth ?? 0) / 2,
        y: -pos.y * viewport.zoom + (wrapRef.current?.clientHeight ?? 0) / 2,
        zoom: Math.max(viewport.zoom, 0.9),
      },
      { duration: 220 },
    );
  }, [query, models, visible, getViewport, setViewport]);

  return (
    <Box ref={wrapRef} className="monosuite-attack-map-canvas" data-testid="attack-map-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={attackMapNodeTypes}
        nodeOrigin={[0.5, 0.5]}
        fitView
        fitViewOptions={{ padding: 0.24 }}
        minZoom={0.35}
        maxZoom={2.2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        defaultEdgeOptions={{ type: 'default' }}
        elevateNodesOnSelect={false}
      >
        <Background
          id="attack-map-bg"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.1}
          color="color-mix(in srgb, var(--monosuite-color-border) 55%, transparent)"
        />
        <Controls position="top-right" showInteractive={false} className="monosuite-attack-map-controls" />
        <Panel position="top-left" className="monosuite-attack-map-toolbar">
          <Group gap={6} wrap="wrap">
            <TextInput
              size="xs"
              placeholder="Find a node"
              aria-label="Find a node"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              w={140}
              styles={{ input: { fontSize: 11, minHeight: 26, height: 26 } }}
            />
            <Button size="compact-xs" color="teal" variant="light" onClick={handleAdapterFetch}>
              Run adapter fetch
            </Button>
            <Button size="compact-xs" variant="default" onClick={handleExpandAll}>
              Expand all
            </Button>
            <Button size="compact-xs" variant="default" onClick={handleCollapse}>
              Collapse to core
            </Button>
          </Group>
        </Panel>
        <Panel position="bottom-left" className="monosuite-attack-map-legend">
          <Group gap="sm" wrap="wrap">
            <Group gap={5}>
              <Box className="monosuite-attack-map-legend-dot" data-tone="accent" />
              <span>Incident</span>
            </Group>
            <Group gap={5}>
              <Box className="monosuite-attack-map-legend-dot" data-tone="danger" />
              <span>Attacker</span>
            </Group>
            <Group gap={5}>
              <Box className="monosuite-attack-map-legend-dot" data-tone="teal" />
              <span>Victim</span>
            </Group>
            <Group gap={5}>
              <Box className="monosuite-attack-map-legend-line" data-style="solid" />
              <span>Responder</span>
            </Group>
            <Group gap={5}>
              <Box className="monosuite-attack-map-legend-line" data-style="dashed" />
              <span>Adapter</span>
            </Group>
          </Group>
        </Panel>
      </ReactFlow>
    </Box>
  );
}

export function AttackMapCanvas(props: AttackMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <AttackMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
