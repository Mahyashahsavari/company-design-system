import type {
  CommanderAssignee,
  CommanderQuestion,
  EvidenceItem,
  EvidenceKind,
  Participant,
  Question,
  RoomSeverity,
  WorkflowStep,
} from '../../data';
import type { RoomWorkflowFetchStatus } from '../../hooks/useRoomWorkflow';
import type { WorkAnswersState } from '../../workAnswers';
import type { CollabThreadDef, WorkflowWorkItem } from './workflowCanvasData';

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
  /** @deprecated Canvas is always shown; kept for call-site compatibility. */
  viewMode?: WorkflowViewMode;
  /** @deprecated Canvas is always shown; kept for call-site compatibility. */
  onViewModeChange?: (mode: WorkflowViewMode) => void;
  /** Collaboration items rendered as canvas nodes in Canvas mode. */
  questions?: Question[];
  onSubmitCollabAnswer?: (questionId: number, text: string) => void;
  onRecordDecision?: (questionId: number, values: string[], otherText?: string) => void;
  isCommander?: boolean;
  participants: Participant[];
  commanderParticipantId: string;
  evidence?: EvidenceItem[];
  commanderQuestions?: CommanderQuestion[];
  incidentTitle?: string;
  incidentDescription?: string;
  incidentSeverity?: RoomSeverity;
  triageNotes?: string;
  onTriageNotesChange?: (value: string) => void;
  onOpenIncidentContext?: () => void;
  /** When true, the Detected inspector shows Hide instead of View. */
  incidentContextOpen?: boolean;
  onAddEvidence?: (kind?: EvidenceKind, phaseId?: string | null) => void;
  onRemoveEvidence?: (id: string) => void;
  onAddCommanderQuestion?: (input: {
    phaseId: string;
    title: string;
    assignee: CommanderAssignee;
    required: boolean;
  }) => void;
  onUpdateCommanderQuestion?: (
    id: string,
    input: {
      title: string;
      assignee: CommanderAssignee;
      required: boolean;
    },
  ) => void;
  onRemoveCommanderQuestion?: (id: string) => void;
  onAnswerCommanderQuestion?: (
    id: string,
    payload: { values: string[]; otherText?: string },
  ) => void;
  onSetPhaseSkippable?: (phaseId: string, skippable: boolean) => void;
  onSkipPhase?: (phaseId: string) => void;
  skippedPhases?: string[];
  assigneeOptions?: { value: string; label: string }[];
  /** Scenario (or default) work cards for the canvas. */
  workItems?: WorkflowWorkItem[];
  /** Scenario (or default) collaboration threads for Investigation. */
  collabThreads?: CollabThreadDef[];
  /** Phases the commander has marked complete. */
  completedPhaseIds?: string[];
  /** Persist phase completion in room state when provided. */
  onCompletePhase?: (phaseId: string) => void;
  /** Lifted work-card answers (for minutes export / remount). */
  workAnswers?: WorkAnswersState;
  onWorkAnswersChange?: (answers: WorkAnswersState) => void;
  /** Optional minutes export from the journey view. */
  onExportMinutes?: () => void;
}
