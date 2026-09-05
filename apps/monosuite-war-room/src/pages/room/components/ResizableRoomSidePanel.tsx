import { Box, Tooltip } from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ROOM_NAV_RAIL_WIDTH, ROOM_SIDE_PANEL_MIN_WIDTH } from '../../../shared/constants';

interface ResizableRoomSidePanelProps {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
  /** Controlled width in px (use with onWidthChange). */
  width?: number;
  onWidthChange?: (width: number) => void;
  /** Uncontrolled fallback when width is omitted. */
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  resizeEdge?: 'leading' | 'trailing';
  /** Collapse / expand control centered on the panel edge facing the room. */
  onToggleCollapse?: () => void;
  collapseLabel?: string;
  expandLabel?: string;
  'data-testid'?: string;
}

function clampWidth(value: number, minWidth: number, maxWidth: number) {
  return Math.max(minWidth, Math.min(maxWidth, Math.round(value)));
}

/** Side rail with a draggable inner edge — supports controlled width from the room layout. */
export function ResizableRoomSidePanel({
  children,
  className,
  collapsed = false,
  width: controlledWidth,
  onWidthChange,
  defaultWidth,
  minWidth = ROOM_SIDE_PANEL_MIN_WIDTH,
  maxWidth = Number.POSITIVE_INFINITY,
  resizeEdge = 'trailing',
  onToggleCollapse,
  collapseLabel = 'Collapse panel',
  expandLabel = 'Expand panel',
  'data-testid': dataTestId,
}: ResizableRoomSidePanelProps) {
  const isControlled = controlledWidth !== undefined;
  const [internalWidth, setInternalWidth] = useState(() =>
    clampWidth(defaultWidth ?? minWidth, minWidth, maxWidth),
  );
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, width: minWidth });

  const resolvedWidth = isControlled
    ? clampWidth(controlledWidth, minWidth, maxWidth)
    : internalWidth;

  useEffect(() => {
    if (isControlled || defaultWidth === undefined) return;
    setInternalWidth(clampWidth(defaultWidth, minWidth, maxWidth));
  }, [defaultWidth, isControlled, maxWidth, minWidth]);

  const commitWidth = useCallback(
    (next: number) => {
      const clamped = clampWidth(next, minWidth, maxWidth);
      if (isControlled) {
        onWidthChange?.(clamped);
      } else {
        setInternalWidth(clamped);
      }
    },
    [isControlled, maxWidth, minWidth, onWidthChange],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragging(true);
      dragStart.current = { x: event.clientX, width: resolvedWidth };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [resolvedWidth],
  );

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - dragStart.current.x;
      const next =
        resizeEdge === 'trailing'
          ? dragStart.current.width + delta
          : dragStart.current.width - delta;
      commitWidth(next);
    };
    const onUp = () => setDragging(false);

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [commitWidth, dragging, resizeEdge]);

  const panelWidth = collapsed ? ROOM_NAV_RAIL_WIDTH : resolvedWidth;
  const toggleLabel = collapsed ? expandLabel : collapseLabel;
  const ToggleIcon =
    resizeEdge === 'trailing'
      ? collapsed
        ? IconChevronRight
        : IconChevronLeft
      : collapsed
        ? IconChevronLeft
        : IconChevronRight;

  const resizeSegments = !collapsed ? (
    <>
      <Box
        className={`monosuite-room-side-resize-seg monosuite-room-side-resize-seg--${resizeEdge} monosuite-room-side-resize-seg--top`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={resolvedWidth}
        aria-valuemin={minWidth}
        aria-valuemax={Number.isFinite(maxWidth) ? maxWidth : undefined}
        data-dragging={dragging ? 'true' : undefined}
        data-testid={dataTestId}
        onPointerDown={onPointerDown}
      />
      <Box
        className={`monosuite-room-side-resize-seg monosuite-room-side-resize-seg--${resizeEdge} monosuite-room-side-resize-seg--bottom`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        data-dragging={dragging ? 'true' : undefined}
        onPointerDown={onPointerDown}
      />
    </>
  ) : null;

  const toggleControl = onToggleCollapse ? (
    <Box
      className={`monosuite-room-side-toggle-wrap monosuite-room-side-toggle-wrap--${resizeEdge}`}
      data-collapsed={collapsed ? 'true' : undefined}
    >
      <Tooltip label={toggleLabel} position={resizeEdge === 'trailing' ? 'right' : 'left'} withArrow>
        <button
          type="button"
          className="monosuite-room-side-toggle-btn"
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          onClick={() => onToggleCollapse()}
        >
          <ToggleIcon size={14} stroke={2.25} aria-hidden />
        </button>
      </Tooltip>
    </Box>
  ) : null;

  return (
    <Box
      className={className}
      h="100%"
      style={{
        display: 'flex',
        flexShrink: 0,
        width: panelWidth,
        minWidth: 0,
        minHeight: 0,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
      {resizeSegments}
      {toggleControl}
    </Box>
  );
}
