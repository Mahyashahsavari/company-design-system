import { useCallback, useEffect, useState } from 'react';
import {
  getWorkflowDefinition,
  getWorkflowOptionLabel,
  type RoomWorkflowDefinition,
  type WorkflowStep,
} from '../data';
import { applyWorkflowStepStatuses, getRoomScenario } from '../scenarios';

export type RoomWorkflowFetchStatus = 'loading' | 'ready' | 'empty' | 'error';

const WORKFLOW_FETCH_DELAY_MS = 420;

interface RoomWorkflowState {
  status: RoomWorkflowFetchStatus;
  steps: WorkflowStep[];
  workflowName: string;
  workflowDescription: string;
  errorMessage: string | null;
  retry: () => void;
  setStepStatuses: (updater: (steps: WorkflowStep[]) => WorkflowStep[]) => void;
}

async function mockFetchRoomWorkflow(workflowId: string): Promise<RoomWorkflowDefinition | null> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, WORKFLOW_FETCH_DELAY_MS);
  });

  if (!workflowId.trim()) {
    return null;
  }

  const definition = getWorkflowDefinition(workflowId);
  if (!definition || definition.steps.length === 0) {
    return null;
  }

  return definition;
}

/** Loads workflow phases for the room's selected playbook (mock API). */
export function useRoomWorkflow(workflowId: string, scenarioId?: string): RoomWorkflowState {
  const [status, setStatus] = useState<RoomWorkflowFetchStatus>('loading');
  const [definition, setDefinition] = useState<RoomWorkflowDefinition | null>(null);
  const [stepsOverride, setStepsOverride] = useState<WorkflowStep[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchToken, setFetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setDefinition(null);
    setStepsOverride(null);
    setErrorMessage(null);

    void (async () => {
      try {
        const result = await mockFetchRoomWorkflow(workflowId);
        if (cancelled) return;

        if (!result) {
          setStatus('empty');
          return;
        }

        const overrides = scenarioId
          ? getRoomScenario(scenarioId)?.workflowStepStatuses
          : undefined;
        const withStatuses = overrides
          ? { ...result, steps: applyWorkflowStepStatuses(result.steps, overrides) }
          : result;

        setDefinition(withStatuses);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load response workflow.',
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workflowId, fetchToken, scenarioId]);

  const retry = useCallback(() => {
    setFetchToken((token) => token + 1);
  }, []);

  const setStepStatuses = useCallback(
    (updater: (steps: WorkflowStep[]) => WorkflowStep[]) => {
      setStepsOverride((current) => {
        const base = current ?? definition?.steps ?? [];
        return updater(base);
      });
    },
    [definition?.steps],
  );

  return {
    status,
    steps: stepsOverride ?? definition?.steps ?? [],
    workflowName: definition?.label ?? getWorkflowOptionLabel(workflowId),
    workflowDescription: definition?.description ?? '',
    errorMessage,
    retry,
    setStepStatuses,
  };
}
