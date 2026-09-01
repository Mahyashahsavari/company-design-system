import { useMemo } from 'react';

const ROW_HEIGHT = 27;
const MORE_BUTTON_HEIGHT = 28;
const CONNECTOR_HEIGHT = 28;
const CHAIN_PADDING = 20;
const DEFAULT_PREVIEW = 2;
const MIN_PREVIEW = 1;

/** Fixed chrome per card (header, switcher/summary, padding) — excludes field rows. */
const SECTION_CHROME = {
  entity: 88,
  incident: 228,
} as const;

function moreButtonsHeight(counts: number[], totals: number[]) {
  return counts.reduce(
    (sum, count, index) => sum + (count < totals[index] ? MORE_BUTTON_HEIGHT : 0),
    0,
  );
}

function chainHeight(counts: number[], totals: number[]) {
  const fieldRows = counts.reduce((sum, count) => sum + count * ROW_HEIGHT, 0);
  return (
    SECTION_CHROME.entity +
    SECTION_CHROME.incident +
    SECTION_CHROME.entity +
    CONNECTOR_HEIGHT * 2 +
    CHAIN_PADDING +
    moreButtonsHeight(counts, totals) +
    fieldRows
  );
}

/**
 * Distribute visible field rows across the three threat-rail cards for a viewport height.
 * Extra rows show when space allows; leftover height stretches cards when every field is visible.
 */
export function useThreatRailFieldBudget(
  viewportHeight: number,
  fieldTotals: [number, number, number],
): [number, number, number] {
  return useMemo(() => {
    const totals = fieldTotals;
    const counts: [number, number, number] = [
      Math.min(DEFAULT_PREVIEW, totals[0]),
      Math.min(DEFAULT_PREVIEW, totals[1]),
      Math.min(DEFAULT_PREVIEW, totals[2]),
    ];

    if (viewportHeight <= 0) return counts;

    let heightUsed = chainHeight(counts, totals);

    while (heightUsed + ROW_HEIGHT <= viewportHeight) {
      let pick = -1;
      let mostHidden = 0;
      for (let index = 0; index < 3; index += 1) {
        const hidden = totals[index] - counts[index];
        if (hidden > mostHidden) {
          mostHidden = hidden;
          pick = index;
        }
      }
      if (pick < 0) break;
      counts[pick] += 1;
      heightUsed = chainHeight(counts, totals);
    }

    while (heightUsed > viewportHeight) {
      let reduced = false;
      for (let index = 2; index >= 0; index -= 1) {
        if (counts[index] > MIN_PREVIEW) {
          counts[index] -= 1;
          reduced = true;
          heightUsed = chainHeight(counts, totals);
          break;
        }
      }
      if (!reduced) break;
    }

    return counts;
  }, [viewportHeight, fieldTotals[0], fieldTotals[1], fieldTotals[2]]);
}
