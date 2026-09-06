import {
  Badge,
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import {
  IconAlertCircle,
  IconRefresh,
  IconTopologyStar,
} from '@tabler/icons-react';
import { WorkflowCanvasView } from './WorkflowCanvasView';
import { WorkflowInfoLabel } from './WorkflowInfoLabel';
import type { ResponseWorkflowProps } from './types';

export type { ResponseWorkflowProps, WorkflowViewMode } from './types';

function CanvasHeaderMeta({ workflowName }: { workflowName?: string }) {
  return (
    <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
        <IconTopologyStar size={14} color="var(--mantine-color-teal-filled)" aria-hidden />
        <Text size="xs" fw={700} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {workflowName?.trim() || 'NIST SP 800-61'}
        </Text>
      </Group>
      <Box
        aria-hidden
        style={{
          width: 1,
          alignSelf: 'stretch',
          minHeight: 14,
          background: 'var(--monosuite-color-border)',
          flexShrink: 0,
        }}
      />
      <Group gap={6} wrap="nowrap" aria-label="Collaboration card guide">
        <Badge variant="light" color="teal" size="xs">
          Question
        </Badge>
        <Badge variant="light" color="accent" size="xs">
          Finding
        </Badge>
        <Badge variant="light" color="brand" size="xs">
          Decision
        </Badge>
      </Group>
    </Group>
  );
}

/** Response workflow surface — canvas is the primary (and only) ready view. */
export function ResponseWorkflow({
  steps,
  fetchStatus,
  workflowName,
  workflowDescription,
  errorMessage,
  onRetry,
  onOpenSettings,
  density = 'cards',
  questions = [],
  onSubmitCollabAnswer,
  onRecordDecision,
  isCommander = false,
  participants,
  commanderParticipantId,
  evidence = [],
  commanderQuestions = [],
  incidentTitle,
  incidentDescription,
  incidentSeverity,
  triageNotes = '',
  onTriageNotesChange,
  onOpenIncidentContext,
  incidentContextOpen = false,
  onAddEvidence,
  onRemoveEvidence,
  onAddCommanderQuestion,
  onUpdateCommanderQuestion,
  onRemoveCommanderQuestion,
  onAnswerCommanderQuestion,
  onSetPhaseSkippable,
  onSkipPhase,
  skippedPhases = [],
  assigneeOptions = [],
  workItems,
  collabThreads,
  completedPhaseIds,
  onCompletePhase,
  workAnswers,
  onWorkAnswersChange,
  onExportMinutes,
}: ResponseWorkflowProps) {
  const strip = density === 'strip';
  const focus = density === 'focus';

  if (fetchStatus === 'loading') {
    return (
      <WorkflowShell density={density} ariaLabel="Response workflow loading">
        <WorkflowHeader
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          trailing={strip ? null : undefined}
        />
        <WorkflowLoadingState strip={strip} focus={focus} />
      </WorkflowShell>
    );
  }

  if (fetchStatus === 'empty') {
    return (
      <WorkflowShell density={density} ariaLabel="Response workflow unavailable">
        <WorkflowHeader
          workflowName={workflowName}
          workflowDescription={workflowDescription}
        />
        <WorkflowEmptyState onOpenSettings={onOpenSettings} />
      </WorkflowShell>
    );
  }

  if (fetchStatus === 'error') {
    return (
      <WorkflowShell density={density} ariaLabel="Response workflow failed to load">
        <WorkflowHeader
          workflowName={workflowName}
          workflowDescription={workflowDescription}
        />
        <WorkflowErrorState message={errorMessage} onRetry={onRetry} />
      </WorkflowShell>
    );
  }

  return (
    <WorkflowShell density="cards" ariaLabel="Response workflow canvas" fill>
      <WorkflowHeader
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        trailing={<CanvasHeaderMeta workflowName={workflowName} />}
      />
      <WorkflowCanvasView
        steps={steps}
        workflowName={workflowName}
        questions={questions}
        onSubmitCollabAnswer={onSubmitCollabAnswer}
        onRecordDecision={onRecordDecision}
        isCommander={isCommander}
        participants={participants}
        commanderParticipantId={commanderParticipantId}
        evidence={evidence}
        commanderQuestions={commanderQuestions}
        incidentTitle={incidentTitle}
        incidentDescription={incidentDescription}
        incidentSeverity={incidentSeverity}
        triageNotes={triageNotes}
        onTriageNotesChange={onTriageNotesChange}
        onOpenIncidentContext={onOpenIncidentContext}
        incidentContextOpen={incidentContextOpen}
        onAddEvidence={onAddEvidence}
        onRemoveEvidence={onRemoveEvidence}
        onAddCommanderQuestion={onAddCommanderQuestion}
        onUpdateCommanderQuestion={onUpdateCommanderQuestion}
        onRemoveCommanderQuestion={onRemoveCommanderQuestion}
        onAnswerCommanderQuestion={onAnswerCommanderQuestion}
        onSetPhaseSkippable={onSetPhaseSkippable}
        onSkipPhase={onSkipPhase}
        skippedPhases={skippedPhases}
        assigneeOptions={assigneeOptions}
        workItems={workItems}
        collabThreads={collabThreads}
        completedPhaseIds={completedPhaseIds}
        onCompletePhase={onCompletePhase}
        workAnswers={workAnswers}
        onWorkAnswersChange={onWorkAnswersChange}
        onExportMinutes={onExportMinutes}
        fillHeight
      />
    </WorkflowShell>
  );
}

function WorkflowShell({
  children,
  density,
  ariaLabel,
  fill = false,
}: {
  children: ReactNode;
  density: 'cards' | 'strip' | 'focus';
  ariaLabel: string;
  fill?: boolean;
}) {
  return (
    <Box
      className={`monosuite-workflow${fill ? ' monosuite-workflow--fill' : ''}`}
      data-density={density}
      role="region"
      aria-label={ariaLabel}
      h={fill ? '100%' : undefined}
      style={fill ? { display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}
    >
      {children}
    </Box>
  );
}

function WorkflowHeader({
  workflowName,
  workflowDescription,
  trailing,
}: {
  workflowName?: string;
  workflowDescription?: string;
  trailing?: ReactNode | null;
}) {
  return (
    <Group
      className="monosuite-workflow-header"
      justify="space-between"
      mb={6}
      wrap="nowrap"
      gap="xs"
    >
      <Box style={{ minWidth: 0, flex: 1 }}>
        <WorkflowInfoLabel workflowName={workflowName} workflowDescription={workflowDescription} />
      </Box>
      {trailing === undefined ? null : trailing}
    </Group>
  );
}

function WorkflowLoadingState({ strip, focus }: { strip: boolean; focus: boolean }) {
  const cardCount = focus ? 3 : strip ? 5 : 5;

  return (
    <Box className="monosuite-workflow-state" aria-busy="true" aria-live="polite">
      <Group gap={strip || focus ? 6 : 0} wrap="nowrap" grow={!strip && !focus}>
        {Array.from({ length: cardCount }, (_, index) => (
          <Skeleton
            key={index}
            height={focus ? 56 : strip ? 28 : 52}
            radius="sm"
            style={{ flex: strip || focus ? '1 1 0' : undefined, minWidth: 0 }}
          />
        ))}
      </Group>
      <Text size="xs" c="dimmed" mt={8}>
        Loading workflow phases…
      </Text>
    </Box>
  );
}

function WorkflowEmptyState({ onOpenSettings }: { onOpenSettings?: () => void }) {
  return (
    <Box className="monosuite-workflow-state monosuite-workflow-state--empty" aria-live="polite">
      <Stack gap={6} align="flex-start">
        <Text size="sm" fw={600}>
          No response workflow configured
        </Text>
        <Text size="xs" c="dimmed" maw={480}>
          Select a response workflow in Room settings to show phase tracking for this room.
        </Text>
        {onOpenSettings ? (
          <Button variant="light" color="brand" size="xs" onClick={onOpenSettings}>
            Open Room settings
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

function WorkflowErrorState({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <Box className="monosuite-workflow-state monosuite-workflow-state--error" aria-live="assertive">
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <IconAlertCircle
          size={18}
          color="var(--mantine-color-danger-filled)"
          aria-hidden
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <Stack gap={6} style={{ minWidth: 0 }}>
          <Text size="sm" fw={600}>
            Unable to load workflow
          </Text>
          <Text size="xs" c="dimmed">
            {message ?? 'The response workflow could not be retrieved. Retry or check Room settings.'}
          </Text>
          {onRetry ? (
            <Button
              variant="light"
              color="brand"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Retry
            </Button>
          ) : null}
        </Stack>
      </Group>
    </Box>
  );
}
