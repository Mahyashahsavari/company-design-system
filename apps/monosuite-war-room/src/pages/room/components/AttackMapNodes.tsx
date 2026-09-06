import {
  Badge,
  Box,
  Group,
  HoverCard,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { BaseEdge, Handle, Position } from '@xyflow/react';
import type { EdgeProps, NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { attackMapNodeRadius, attackMapTone } from './attackMapGraph';
import type { AttackMapNodeModel } from './attackMapGraph';

export type AttackMapFlowNodeData = {
  model: AttackMapNodeModel;
  dimmed: boolean;
  matched: boolean;
  childCount: number;
  onToggle: (id: string) => void;
};

function toneVar(tone: ReturnType<typeof attackMapTone>) {
  if (tone === 'neutral') return 'var(--mantine-color-neutral-6)';
  return `var(--mantine-color-${tone}-filled)`;
}

function shorten(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function kindLabel(model: AttackMapNodeModel) {
  if (model.kind === 'incident') return 'Incident';
  if (model.kind === 'group') return 'Group';
  if (model.kind === 'entity') return model.role === 'attacker' ? 'Attacker' : 'Victim';
  if (model.role === 'attacker') return 'Attacker detail';
  if (model.role === 'victim') return 'Victim detail';
  return 'Incident detail';
}

function NodeDetails({ model }: { model: AttackMapNodeModel }) {
  return (
    <Stack gap={4} maw={220} className="monosuite-attack-map-details">
      <Box>
        <Text size="9px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
          {kindLabel(model)}
        </Text>
        <Text size="xs" fw={700} style={{ wordBreak: 'break-word', lineHeight: 1.25 }}>
          {model.label}
        </Text>
        {model.value ? (
          <Text size="10px" ff="monospace" c="dimmed" style={{ wordBreak: 'break-word' }}>
            {model.value}
          </Text>
        ) : null}
      </Box>
      <Stack gap={2}>
        {model.fields.map((field) => (
          <Group key={`${field.label}-${field.value}`} gap={6} wrap="nowrap" align="flex-start">
            <Text size="10px" c="dimmed" style={{ flex: '0 0 72px' }}>
              {field.label}
            </Text>
            <Text
              size="10px"
              ff="monospace"
              style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {field.value}
            </Text>
          </Group>
        ))}
      </Stack>
      <Badge size="xs" variant="outline" color={model.source === 'adapter' ? 'accent' : 'neutral'}>
        {model.source === 'adapter'
          ? `Adapter · ${model.adapter ?? 'source'}`
          : 'Entered by responder'}
      </Badge>
    </Stack>
  );
}

/** Center handle so edges meet at the orb, like the SVG prototype. */
const centerHandleStyle = {
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
} as const;

/**
 * Gentle center-to-center curve (prototype Q path) — avoids RF default bezier
 * “hook / turn-back” when handles sit in the middle of circular nodes.
 */
function AttackMapEdgeView({ id, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;
  const curve = 0.12;
  const cx = mx - (targetY - sourceY) * curve;
  const cy = my + (targetX - sourceX) * curve;
  const path = `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        ...style,
        strokeWidth: style?.strokeWidth ?? 0.7,
        fill: 'none',
      }}
    />
  );
}

function AttackMapNodeView({ data, selected }: NodeProps) {
  const payload = data as AttackMapFlowNodeData;
  const { model, dimmed, matched, childCount, onToggle } = payload;
  const tone = attackMapTone(model);
  const radius = attackMapNodeRadius(model.kind);
  const color = toneVar(tone);
  const hasChildren = model.childIds.length > 0;
  const collapsedWithKids = hasChildren && !model.open;
  const isAttr = model.kind === 'attr';
  const label = isAttr
    ? `${model.label}${model.value ? ` · ${shorten(model.value, 16)}` : ''}`
    : model.label;

  return (
    <HoverCard
      width={236}
      shadow="sm"
      openDelay={120}
      closeDelay={60}
      position="bottom"
      offset={10}
      withArrow
      withinPortal
      middlewares={{ flip: true, shift: true }}
      classNames={{ dropdown: 'monosuite-attack-map-hovercard' }}
    >
      <HoverCard.Target>
        <UnstyledButton
          type="button"
          className="monosuite-attack-map-graph-node"
          data-kind={model.kind}
          data-tone={tone}
          data-dimmed={dimmed ? 'true' : 'false'}
          data-matched={matched ? 'true' : 'false'}
          data-selected={selected ? 'true' : 'false'}
          data-adapter={model.source === 'adapter' ? 'true' : 'false'}
          aria-label={`${kindLabel(model)}: ${model.label}${model.value ? `, ${model.value}` : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) onToggle(model.id);
          }}
          style={{
            width: radius * 2,
            height: radius * 2,
            position: 'relative',
            opacity: dimmed ? 0.18 : 1,
            cursor: hasChildren ? 'pointer' : 'default',
            background: 'transparent',
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            className="monosuite-attack-map-handle"
            style={centerHandleStyle}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="monosuite-attack-map-handle"
            style={centerHandleStyle}
          />
          <Box
            className="monosuite-attack-map-orb"
            data-kind={model.kind}
            data-collapsed={collapsedWithKids ? 'true' : 'false'}
            style={{
              width: radius * 2,
              height: radius * 2,
              borderColor: color,
              borderStyle: model.source === 'adapter' ? 'dashed' : 'solid',
              borderWidth: isAttr ? 1 : 1.25,
              outline: matched
                ? '1.5px solid var(--mantine-color-teal-filled)'
                : selected
                  ? '1.5px solid color-mix(in srgb, var(--mantine-color-accent-filled) 80%, transparent)'
                  : undefined,
              outlineOffset: 1,
              ['--attack-map-tone' as string]: color,
            }}
          >
            {collapsedWithKids ? (
              <span className="monosuite-attack-map-count">{childCount}</span>
            ) : null}
          </Box>
          <Text className="monosuite-attack-map-node-label" data-kind={model.kind} lineClamp={2}>
            {label}
          </Text>
        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <NodeDetails model={model} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export const attackMapNodeTypes = {
  attackMap: memo(AttackMapNodeView),
};

export const attackMapEdgeTypes = {
  attackMap: memo(AttackMapEdgeView),
};
