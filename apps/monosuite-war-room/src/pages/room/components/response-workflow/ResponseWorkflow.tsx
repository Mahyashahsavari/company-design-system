import { Box, Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { Fragment, useState } from 'react';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { TruncatedTooltipText } from '../../../../shared/components/TruncatedTooltipText';
import type { WorkflowPhaseColor, WorkflowStep } from '../../data';

interface ResponseWorkflowProps {
  steps: WorkflowStep[];
  protocol?: string;
  title?: string;
  height?: number;
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
  protocol = 'NIST SP 800-61',
  title = 'Response Workflow',
  density = 'cards',
}: ResponseWorkflowProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress =
    ((completedCount + (steps.some((s) => s.status === 'current') ? 0.5 : 0)) / steps.length) * 100;
  const strip = density === 'strip';
  const focus = density === 'focus';
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === 'current'),
  );
  const current = steps[currentIndex] ?? steps[0];
  const [focusedIndex, setFocusedIndex] = useState(currentIndex);
  const safeFocus = Math.min(Math.max(focusedIndex, 0), steps.length - 1);
  const prevStep = safeFocus > 0 ? steps[safeFocus - 1] : null;
  const nextStep = safeFocus < steps.length - 1 ? steps[safeFocus + 1] : null;
  const focused = steps[safeFocus] ?? current;

  if (focus) {
    return (
      <Box className="monosuite-workflow monosuite-workflow--focus" aria-label={title}>
        <Group justify="space-between" mb={8} wrap="nowrap" gap="xs">
          <Text size="xs" fw={600}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {protocol}
          </Text>
        </Group>
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
      </Box>
    );
  }

  return (
    <Box
      className={`monosuite-workflow${strip ? ' monosuite-workflow--strip' : ''}`}
      aria-label={title}
    >
      <Group justify="space-between" mb={strip ? 4 : 6} wrap="nowrap" gap="xs">
        <TruncatedTooltipText size="xs" fw={600} style={{ minWidth: 0, flex: 1 }}>
          {title}
        </TruncatedTooltipText>
        <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
          <PhaseKey steps={steps} />
          <Text size="xs" c="dimmed">
            {protocol}
          </Text>
        </Group>
      </Group>

      <Box className="monosuite-workflow-shell" style={{ position: 'relative', width: '100%' }}>
        <Box className="monosuite-workflow-progress" aria-hidden>
          <Box
            className="monosuite-workflow-progress-fill"
            style={{ width: `${progress}%` }}
          />
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
    <Group gap={4} wrap="nowrap" aria-label="NIST phase colors">
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
    <Box className="monosuite-workflow-connector workflow-connector" aria-hidden data-filled={filled ? 'true' : 'false'}>
      <IconChevronRight size={11} />
    </Box>
  );
}

export type { ResponseWorkflowProps };
