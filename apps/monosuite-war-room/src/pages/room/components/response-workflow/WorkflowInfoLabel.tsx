import { ActionIcon, Box, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { RESPONSE_WORKFLOW_FIELD_DESCRIPTION } from '../../data';

interface WorkflowInfoLabelProps {
  workflowName?: string;
  workflowDescription?: string;
  size?: 'xs' | 'sm';
  fw?: number;
  required?: boolean;
}

function buildTooltip(workflowName?: string, workflowDescription?: string) {
  if (workflowName && workflowDescription) {
    return `${workflowName} — ${workflowDescription}`;
  }
  if (workflowDescription) {
    return workflowDescription;
  }
  if (workflowName) {
    return workflowName;
  }
  return RESPONSE_WORKFLOW_FIELD_DESCRIPTION;
}

/** "Response workflow" label with info tooltip — playbook name is not shown inline. */
export function WorkflowInfoLabel({
  workflowName,
  workflowDescription,
  size = 'xs',
  fw = 600,
  required = false,
}: WorkflowInfoLabelProps) {
  const tooltip = buildTooltip(workflowName, workflowDescription);

  return (
    <Box
      component="span"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}
    >
      <Text component="span" size={size} fw={fw}>
        Response workflow
        {required ? (
          <Text
            component="span"
            c="var(--mantine-color-error)"
            inherit
            aria-hidden
            style={{ marginInlineStart: 4 }}
          >
            *
          </Text>
        ) : null}
      </Text>
      <Tooltip label={tooltip} multiline maw={320} withArrow openDelay={200}>
        <ActionIcon
          variant="subtle"
          color="neutral"
          size={size === 'sm' ? 'sm' : 'xs'}
          aria-label={`About response workflow${workflowName ? `: ${workflowName}` : ''}`}
        >
          <IconInfoCircle size={size === 'sm' ? 16 : 14} aria-hidden />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}
