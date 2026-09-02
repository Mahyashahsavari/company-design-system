import type { WorkflowStep } from '../../data';
import type { RoomWorkflowFetchStatus } from '../../hooks/useRoomWorkflow';

export interface ResponseWorkflowProps {
  steps: WorkflowStep[];
  fetchStatus: RoomWorkflowFetchStatus;
  workflowName?: string;
  workflowDescription?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  density?: 'cards' | 'strip' | 'focus';
}
