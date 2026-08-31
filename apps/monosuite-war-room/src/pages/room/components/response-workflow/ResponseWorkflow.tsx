import { Box, Group, Text, Tooltip } from '@mantine/core';
import { Fragment } from 'react';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { TruncatedTooltipText } from '../../../../shared/components/TruncatedTooltipText';
import type { WorkflowStep } from '../../data';

interface ResponseWorkflowProps {
  steps: WorkflowStep[];
  protocol?: string;
  title?: string;
  height?: number;
}

const STATUS_LABEL: Record<WorkflowStep['status'], string> = {
  completed: 'Done',
  current: 'Active',
  pending: 'Queued',
};

/** Full-width compact workflow cards — responsive track with tooltip labels. */
export function ResponseWorkflow({
  steps,
  protocol = 'NIC800',
  title = 'Response Workflow',
}: ResponseWorkflowProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress =
    ((completedCount + (steps.some((s) => s.status === 'current') ? 0.5 : 0)) / steps.length) * 100;

  return (
    <Box className="monosuite-workflow" aria-label={title}>
      <Group justify="space-between" mb={6} wrap="nowrap" gap="xs">
        <TruncatedTooltipText size="xs" fw={600} style={{ minWidth: 0, flex: 1 }}>
          {title}
        </TruncatedTooltipText>
        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
          {protocol}
        </Text>
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
              <WorkflowStepCard step={step} index={index} />
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

function WorkflowStepCard({ step, index }: { step: WorkflowStep; index: number }) {
  const active = step.status === 'current';
  const done = step.status === 'completed';
  const pending = step.status === 'pending';
  const stepNo = String(index + 1).padStart(2, '0');

  return (
    <Box
      className={`monosuite-workflow-card workflow-card workflow-card--${step.status}`}
      data-status={step.status}
      style={{
        animationDelay: `${index * 55}ms`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap={4} mb={4}>
        <StatusChip status={step.status} index={index} />
        <Text size="10px" c="dimmed" fw={700} lh={1} className="monosuite-workflow-step-no">
          {stepNo}
        </Text>
      </Group>

      <TruncatedTooltipText
        size="xs"
        fw={active ? 700 : done ? 600 : 500}
        c={pending ? 'dimmed' : undefined}
        lh={1.25}
        lineClamp={2}
        tooltip={step.label}
        className="monosuite-workflow-step-label"
      >
        {step.label}
      </TruncatedTooltipText>
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
