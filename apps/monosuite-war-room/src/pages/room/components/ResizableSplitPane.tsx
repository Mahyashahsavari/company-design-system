import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@mantine/core';

const HANDLE_WIDTH = 8;

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  rightWidth: number;
  onRightWidthChange: (width: number) => void;
  minLeft?: number;
  minRight?: number;
}

/** Full-height horizontal split with a draggable resize handle. */
export function ResizableSplitPane({
  left,
  right,
  rightWidth,
  onRightWidthChange,
  minLeft = 520,
  minRight = 320,
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const clampWidth = useCallback(
    (nextRight: number) => {
      const container = containerRef.current;
      if (!container) return;
      const maxRight = container.clientWidth - minLeft - HANDLE_WIDTH;
      onRightWidthChange(Math.max(minRight, Math.min(maxRight, nextRight)));
    },
    [minLeft, minRight, onRightWidthChange],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      clampWidth(rect.right - event.clientX);
    },
    [clampWidth, dragging],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      clampWidth(rect.right - event.clientX);
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
  }, [clampWidth, dragging]);

  return (
    <Box
      ref={containerRef}
      data-testid="resizable-split-pane"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          flex: 1,
          minWidth: minLeft,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch',
        }}
      >
        {left}
      </Box>

      <Box
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize live collaboration panel"
        aria-valuenow={rightWidth}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: HANDLE_WIDTH,
          flexShrink: 0,
          cursor: 'col-resize',
          touchAction: 'none',
          background: dragging
            ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 28%, transparent)'
            : 'var(--monosuite-color-border)',
          transition: dragging ? 'none' : 'background 120ms ease',
        }}
        onMouseEnter={(event) => {
          if (dragging) return;
          event.currentTarget.style.background =
            'color-mix(in srgb, var(--mantine-color-teal-filled) 18%, transparent)';
        }}
        onMouseLeave={(event) => {
          if (dragging) return;
          event.currentTarget.style.background = 'var(--monosuite-color-border)';
        }}
      />

      <Box
        style={{
          width: rightWidth,
          minWidth: minRight,
          flexShrink: 0,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'stretch',
        }}
      >
        {right}
      </Box>
    </Box>
  );
}
