import { useCallback, useMemo, useState } from 'react';
import { computeRoomSidePanelLayout } from '../../../shared/constants';

/** 20% | 60% | 20% side panels with optional user overrides after resize. */
export function useRoomSidePanelWidths(rowWidth: number) {
  const [leftOverride, setLeftOverride] = useState<number | null>(null);
  const [rightOverride, setRightOverride] = useState<number | null>(null);

  const layout = useMemo(() => computeRoomSidePanelLayout(rowWidth), [rowWidth]);

  const leftWidth = leftOverride ?? layout.default;
  const rightWidth = rightOverride ?? layout.default;

  const setLeftWidth = useCallback(
    (width: number) => {
      setLeftOverride(Math.max(layout.min, Math.min(layout.max, Math.round(width))));
    },
    [layout.max, layout.min],
  );

  const setRightWidth = useCallback(
    (width: number) => {
      setRightOverride(Math.max(layout.min, Math.min(layout.max, Math.round(width))));
    },
    [layout.max, layout.min],
  );

  return {
    leftWidth,
    rightWidth,
    setLeftWidth,
    setRightWidth,
    minWidth: layout.min,
    maxWidth: layout.max,
  };
}
