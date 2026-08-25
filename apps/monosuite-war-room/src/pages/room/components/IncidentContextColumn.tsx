import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { ATTACKER_CONTEXT, CONNECTED_SOURCES, VICTIM_CONTEXT, type HostContext } from '../data';

function HostContextCard({
  context,
  tone,
}: {
  context: HostContext;
  tone: 'attacker' | 'victim';
}) {
  const source = CONNECTED_SOURCES.find((s) => s.id === context.sourceId);
  const headerBg =
    tone === 'attacker'
      ? 'var(--mantine-color-danger-filled)'
      : 'var(--monosuite-color-chrome)';
  const headerFg =
    tone === 'attacker'
      ? 'var(--mantine-color-white)'
      : 'var(--monosuite-color-chrome-text)';

  return (
    <Paper
      withBorder
      radius="sm"
      style={{ overflow: 'hidden', background: 'var(--mantine-color-body)' }}
    >
      <Group
        justify="space-between"
        px="sm"
        py={8}
        wrap="nowrap"
        style={{ background: headerBg, color: headerFg }}
      >
        <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          {context.label}
        </Text>
        {context.multi && (
          <Badge
            size="xs"
            variant="filled"
            color={tone === 'attacker' ? 'neutral' : 'neutral'}
            style={
              tone === 'attacker'
                ? {
                    background: 'color-mix(in srgb, var(--mantine-color-white) 22%, transparent)',
                    color: 'var(--mantine-color-white)',
                  }
                : undefined
            }
          >
            {context.multiLabel}
          </Badge>
        )}
      </Group>
      <Stack gap={6} p="sm">
        <Text size="sm" fw={700} ff="monospace">
          {context.primary}
        </Text>
        {context.hostname && (
          <Text size="xs" c="dimmed">
            Host · {context.hostname}
          </Text>
        )}
        {context.fields.map((field) => (
          <Group key={field.label} justify="space-between" gap="xs" wrap="nowrap">
            <Text size="xs" c="dimmed">
              {field.label}
            </Text>
            <Text size="xs" fw={600} ta="right" style={{ minWidth: 0 }}>
              {field.value}
            </Text>
          </Group>
        ))}
        {source && (
          <Text size="xs" c="dimmed" mt={4}>
            Adapter · {source.adapter} · {source.status} · {source.lastSync}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export function IncidentContextColumn() {
  return (
    <Stack gap="sm" w={260} style={{ flexShrink: 0 }}>
      <HostContextCard context={ATTACKER_CONTEXT} tone="attacker" />
      <HostContextCard context={VICTIM_CONTEXT} tone="victim" />
    </Stack>
  );
}
