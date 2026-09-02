import {
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { IconAlertCircle, IconCheck, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import { TruncatedTooltipText } from '../../../../shared/components/TruncatedTooltipText';
import type { RoomWorkflowFetchStatus } from '../../hooks/useRoomWorkflow';
import type { WorkflowPhaseColor, WorkflowStep } from '../../data';
import { WorkflowInfoLabel } from './WorkflowInfoLabel';

export interface ResponseWorkflowProps {
  steps: WorkflowStep[];
  fetchStatus: RoomWorkflowFetchStatus;
  workflowName?: string;
  workflowDescription?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  /** Strip is a single-row stepper for short desktops. Focus peeks prev/current/next on phones. */
  density?: 'cards' | 'strip' | 'focus';
}

const STATUS_LABEL: Record<WorkflowStep['status'], string> = {
  completed: 'Done',
  current: 'Active',
  pending: 'Queued',
};

function phaseFill(color: WorkflowPhaseColor) {
  return `var(--mantine-color-${color}-filled)`;
}

/** Full-width compact workflow cards — phase color is independent of progress status. */
export function ResponseWorkflow({
  steps,
  fetchStatus,
  workflowName,
  workflowDescription,
  errorMessage,
  onRetry,
  onOpenSettings,
  density = 'cards',
}: ResponseWorkflowProps) {
  const strip = density === 'strip';
  const focus = density === 'focus';

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === 'current'),
  );
  const [focusedIndex, setFocusedIndex] = useState(currentIndex);

  useEffect(() => {
    setFocusedIndex(currentIndex);
  }, [currentIndex, steps]);

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

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress =
    steps.length > 0
      ? ((completedCount + (steps.some((s) => s.status === 'current') ? 0.5 : 0)) / steps.length) *
        100
      : 0;
  const current = steps[currentIndex] ?? steps[0];

  const safeFocus = Math.min(Math.max(focusedIndex, 0), Math.max(steps.length - 1, 0));
  const prevStep = safeFocus > 0 ? steps[safeFocus - 1] : null;
  const nextStep = safeFocus < steps.length - 1 ? steps[safeFocus + 1] : null;
  const focused = steps[safeFocus] ?? current;

  if (focus) {
    return (
      <WorkflowShell density="focus" ariaLabel="Response workflow">
        <WorkflowHeader
          workflowName={workflowName}
          workflowDescription={workflowDescription}
        />
        <Box className="monosuite-workflow-focus-track" aria-label="Previous, current, and next workflow steps">
          {prevStep ? (
            <FocusStepCard
              step={prevStep}
              index={safeFocus - 1}
              dataRole="prev"
              onSelect={() => setFocusedIndex(safeFocus - 1)}
            />
          ) : (
            <Box className="monosuite-workflow-focus-slot" aria-hidden />
          )}
          <FocusStepCard step={focused} index={safeFocus} dataRole="current" />
          {nextStep ? (
            <FocusStepCard
              step={nextStep}
              index={safeFocus + 1}
              dataRole="next"
              onSelect={() => setFocusedIndex(safeFocus + 1)}
            />
          ) : (
            <Box className="monosuite-workflow-focus-slot" aria-hidden />
          )}
        </Box>
        <Group gap={6} justify="center" wrap="nowrap" mt={10} aria-label="Workflow progress">
          {steps.map((step, index) => (
            <Tooltip
              key={step.id}
              label={`${step.label} · ${STATUS_LABEL[step.status]}`}
              withArrow
              events={{ hover: true, focus: true, touch: true }}
            >
              <UnstyledButton
                type="button"
                aria-label={`${step.label}, ${STATUS_LABEL[step.status]}`}
                aria-current={index === currentIndex ? 'step' : undefined}
                className="monosuite-workflow-focus-pip"
                data-status={step.status}
                data-focused={index === safeFocus ? 'true' : 'false'}
                onClick={() => setFocusedIndex(index)}
                style={{ ['--workflow-phase-color' as string]: phaseFill(step.phase.color) }}
              />
            </Tooltip>
          ))}
        </Group>
      </WorkflowShell>
    );
  }

  return (
    <WorkflowShell density={strip ? 'strip' : 'cards'} ariaLabel="Response workflow">
      <WorkflowHeader
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        trailing={strip ? null : <PhaseKey steps={steps} />}
      />

      <Box className="monosuite-workflow-shell" style={{ position: 'relative', width: '100%' }}>
        <Box className="monosuite-workflow-progress" aria-hidden>
          <Box className="monosuite-workflow-progress-fill" style={{ width: `${progress}%` }} />
        </Box>

        <Box className="monosuite-workflow-track">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <WorkflowStepCard step={step} index={index} strip={strip} />
              {index < steps.length - 1 && (
                <WorkflowConnector filled={step.status === 'completed'} />
              )}
            </Fragment>
          ))}
        </Box>
      </Box>
    </WorkflowShell>
  );
}

function WorkflowShell({
  density,
  ariaLabel,
  children,
}: {
  density: 'cards' | 'strip' | 'focus';
  ariaLabel: string;
  children: ReactNode;
}) {
  const strip = density === 'strip';
  const focus = density === 'focus';

  return (
    <Box
      className={`monosuite-workflow${strip ? ' monosuite-workflow--strip' : ''}${focus ? ' monosuite-workflow--focus' : ''}`}
      aria-label={ariaLabel}
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
    <Group justify="space-between" mb={6} wrap="nowrap" gap="xs">
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

function FocusStepCard({
  step,
  index,
  dataRole,
  onSelect,
}: {
  step: WorkflowStep;
  index: number;
  dataRole: 'prev' | 'current' | 'next';
  onSelect?: () => void;
}) {
  const stepNo = String(index + 1).padStart(2, '0');
  const phaseColor = phaseFill(step.phase.color);
  const isCurrent = dataRole === 'current';
  const pending = step.status === 'pending';
  const done = step.status === 'completed';

  const body = (
    <>
      <Group gap={4} wrap="nowrap" justify="space-between" mb={isCurrent ? 4 : 2}>
        <Text size="10px" c="dimmed" fw={700} lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {stepNo}
        </Text>
        {isCurrent ? (
          <StatusChip status={step.status} index={index} />
        ) : done ? (
          <IconCheck size={12} color="var(--mantine-color-teal-filled)" aria-hidden />
        ) : null}
      </Group>
      <TruncatedTooltipText
        size={isCurrent ? 'sm' : 'xs'}
        fw={isCurrent ? 700 : 600}
        c={pending ? 'dimmed' : undefined}
        lh={1.2}
        lineClamp={1}
        tooltip={`${step.label} · ${step.phase.label} · ${STATUS_LABEL[step.status]}`}
        style={{ minWidth: 0 }}
      >
        {step.label}
      </TruncatedTooltipText>
    </>
  );

  const cardStyle = {
    ['--workflow-phase-color' as string]: phaseColor,
  };

  if (onSelect) {
    return (
      <UnstyledButton
        type="button"
        className="monosuite-workflow-focus-card"
        data-role={dataRole}
        data-status={step.status}
        aria-label={`${dataRole === 'prev' ? 'Previous step' : 'Next step'}: ${step.label}, ${STATUS_LABEL[step.status]}`}
        onClick={onSelect}
        style={cardStyle}
      >
        {body}
      </UnstyledButton>
    );
  }

  return (
    <Box
      className="monosuite-workflow-focus-card"
      data-role={dataRole}
      data-status={step.status}
      aria-label={`${step.label}, ${STATUS_LABEL[step.status]}, ${step.phase.label}`}
      style={cardStyle}
    >
      {body}
    </Box>
  );
}

function PhaseKey({ steps }: { steps: WorkflowStep[] }) {
  return (
    <Group gap={4} wrap="nowrap" aria-label="Workflow phase colors">
      {steps.map((step) => (
        <Tooltip
          key={step.id}
          label={`${step.phase.stage} · ${step.phase.label}`}
          withArrow
          openDelay={200}
        >
          <Box
            aria-hidden
            className="monosuite-workflow-phase-pip"
            style={{ background: phaseFill(step.phase.color) }}
          />
        </Tooltip>
      ))}
    </Group>
  );
}

function WorkflowStepCard({
  step,
  index,
  strip,
}: {
  step: WorkflowStep;
  index: number;
  strip: boolean;
}) {
  const active = step.status === 'current';
  const done = step.status === 'completed';
  const pending = step.status === 'pending';
  const stepNo = String(index + 1).padStart(2, '0');
  const phaseColor = phaseFill(step.phase.color);

  return (
    <Box
      className={`monosuite-workflow-card workflow-card workflow-card--${step.status}${strip ? ' monosuite-workflow-card--strip' : ''}`}
      data-status={step.status}
      aria-label={`${step.label}, ${STATUS_LABEL[step.status]}, ${step.phase.label}`}
      style={{
        animationDelay: `${index * 55}ms`,
        ['--workflow-phase-color' as string]: phaseColor,
      }}
    >
      {strip ? (
        <>
          <Tooltip label={`${step.phase.stage} · ${step.phase.label}`} withArrow openDelay={200}>
            <Box
              aria-hidden
              className="monosuite-workflow-phase-mark"
              style={{ background: phaseColor }}
            />
          </Tooltip>
          <Text size="10px" c="dimmed" fw={700} lh={1} className="monosuite-workflow-step-no">
            {stepNo}
          </Text>
          <TruncatedTooltipText
            size="xs"
            fw={active ? 700 : done ? 600 : 500}
            c={pending ? 'dimmed' : undefined}
            lh={1.2}
            lineClamp={1}
            tooltip={`${step.label} · ${step.phase.label} · ${STATUS_LABEL[step.status]}`}
            className="monosuite-workflow-step-label"
            style={{ minWidth: 0, flex: 1 }}
          >
            {step.label}
          </TruncatedTooltipText>
          <StatusChip status={step.status} index={index} />
        </>
      ) : (
        <>
          <Group justify="space-between" wrap="nowrap" gap={4} mb={4}>
            <StatusChip status={step.status} index={index} />
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Tooltip label={`${step.phase.stage} · ${step.phase.label}`} withArrow openDelay={200}>
                <Box
                  aria-hidden
                  className="monosuite-workflow-phase-mark"
                  style={{ background: phaseColor }}
                />
              </Tooltip>
              <Text size="10px" c="dimmed" fw={700} lh={1} className="monosuite-workflow-step-no">
                {stepNo}
              </Text>
            </Group>
          </Group>

          <TruncatedTooltipText
            size="xs"
            fw={active ? 700 : done ? 600 : 500}
            c={pending ? 'dimmed' : undefined}
            lh={1.25}
            lineClamp={2}
            tooltip={`${step.label} · ${step.phase.label} · ${STATUS_LABEL[step.status]}`}
            className="monosuite-workflow-step-label"
          >
            {step.label}
          </TruncatedTooltipText>
        </>
      )}
    </Box>
  );
}

function StatusChip({
  status,
  index,
}: {
  status: WorkflowStep['status'];
  index: number;
}) {
  const active = status === 'current';
  const done = status === 'completed';
  const label = STATUS_LABEL[status];

  const chip = (
    <Group
      gap={4}
      wrap="nowrap"
      px={6}
      py={2}
      className={`monosuite-workflow-status workflow-status--${status}`}
      style={{
        animationDelay: active ? undefined : `${index * 55 + 80}ms`,
      }}
    >
      {done ? (
        <IconCheck size={11} color="var(--mantine-color-teal-filled)" aria-hidden />
      ) : (
        <Box
          aria-hidden
          className="monosuite-workflow-status-dot"
          data-active={active ? 'true' : 'false'}
        />
      )}
      <Text
        size="10px"
        fw={700}
        tt="uppercase"
        lh={1}
        c={active ? 'var(--monosuite-color-surface)' : done ? 'teal' : 'dimmed'}
        className="monosuite-workflow-status-text"
        style={{ letterSpacing: '0.03em' }}
      >
        {label}
      </Text>
    </Group>
  );

  return (
    <Tooltip label={label} withArrow openDelay={200} position="top">
      {chip}
    </Tooltip>
  );
}

function WorkflowConnector({ filled }: { filled: boolean }) {
  return (
    <Box
      className="monosuite-workflow-connector workflow-connector"
      aria-hidden
      data-filled={filled ? 'true' : 'false'}
    >
      <IconChevronRight size={11} />
    </Box>
  );
}
