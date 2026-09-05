import type { Question, WorkflowStep } from '../../data';
import type { RoomWorkflowFetchStatus } from '../../hooks/useRoomWorkflow';

export type WorkflowViewMode = 'current' | 'canvas';

export interface ResponseWorkflowProps {
  steps: WorkflowStep[];
  fetchStatus: RoomWorkflowFetchStatus;
  workflowName?: string;
  workflowDescription?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  density?: 'cards' | 'strip' | 'focus';
  /** Controlled view mode — when set, parent owns Current/Canvas switching. */
  viewMode?: WorkflowViewMode;
  onViewModeChange?: (mode: WorkflowViewMode) => void;
  /** Collaboration items rendered as canvas nodes in Canvas mode. */
  questions?: Question[];
  onSubmitCollabAnswer?: (questionId: number, text: string) => void;
  onRecordDecision?: (questionId: number, choice: string) => void;
}
