import { Badge, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import {
  IconArrowsMaximize,
  IconBellRinging,
  IconDeviceDesktop,
  IconMaximize,
  IconMinus,
  IconScreenShare,
  IconServer,
  IconShieldSearch,
  IconTimeline,
} from '@tabler/icons-react';
import type { ShareLayout } from '../data';

interface ScreenShareStageProps {
  selfShare: boolean;
  sharerName: string;
  layout: ShareLayout;
  onLayoutChange: (layout: ShareLayout) => void;
}

export function ScreenShareStage({
  selfShare,
  sharerName,
  layout,
  onLayoutChange,
}: ScreenShareStageProps) {
  const height = layout === 'full' ? 420 : layout === 'room' ? 360 : 280;

  return (
    <Stack gap={0} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group
        px="md"
        py="xs"
        justify="space-between"
        wrap="wrap"
        style={{ background: 'var(--monosuite-color-surface-sunken)' }}
      >
        <Group gap="sm">
          <Box c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
            <IconScreenShare size={16} />
          </Box>
          <Stack gap={0}>
            <Text size="sm" fw={600}>
              {selfShare ? 'You are sharing your screen' : `${sharerName} is sharing his screen`}
            </Text>
            {selfShare && (
              <Text size="xs" c="dimmed">
                4 participants can see your screen
              </Text>
            )}
          </Stack>
          <Badge color="success" size="xs" variant="filled">
            LIVE
          </Badge>
        </Group>
        <Group gap={4}>
          <Button
            size="compact-xs"
            variant="subtle"
            c="dimmed"
            leftSection={<IconMinus size={14} />}
            onClick={() => onLayoutChange('minimized')}
          >
            Minimize
          </Button>
          <Button
            size="compact-xs"
            variant="subtle"
            c="dimmed"
            leftSection={<IconArrowsMaximize size={14} />}
            onClick={() => onLayoutChange(layout === 'room' ? 'split' : 'room')}
          >
            {layout === 'room' ? 'Split view' : 'Fit to room'}
          </Button>
          <Button
            size="compact-xs"
            variant="subtle"
            c="dimmed"
            leftSection={<IconMaximize size={14} />}
            onClick={() => onLayoutChange(layout === 'full' ? 'split' : 'full')}
          >
            {layout === 'full' ? 'Exit full' : 'Fullscreen'}
          </Button>
        </Group>
      </Group>

      <Box px="md" pb="md" pt="sm" style={{ height }}>
        <Paper withBorder radius="sm" h="100%" style={{ overflow: 'hidden' }}>
          <Group
            px="sm"
            py={6}
            justify="space-between"
            style={{
              background: 'var(--monosuite-color-surface-sunken)',
              borderBottom: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Group gap={6}>
              <IconDeviceDesktop size={14} />
              <Text size="xs" fw={600}>
                CoreLog — Alert CL-8847291
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {sharerName} · Analyst workstation
            </Text>
          </Group>
          <Group align="stretch" gap={0} h="calc(100% - 32px)" wrap="nowrap">
            <Stack
              gap={4}
              p="xs"
              w={120}
              style={{
                borderRight: '1px solid var(--mantine-color-default-border)',
                background: 'var(--monosuite-color-surface-sunken)',
              }}
            >
              {[
                { icon: IconBellRinging, label: 'Alerts', active: true },
                { icon: IconTimeline, label: 'Timeline' },
                { icon: IconServer, label: 'Hosts' },
                { icon: IconShieldSearch, label: 'IOC Hunt' },
              ].map((item) => (
                <Group
                  key={item.label}
                  gap={6}
                  px={6}
                  py={4}
                  style={{
                    borderRadius: 4,
                    background: item.active ? 'var(--mantine-color-teal-light)' : undefined,
                  }}
                >
                  <item.icon size={12} />
                  <Text size="xs" fw={item.active ? 700 : 400}>
                    {item.label}
                  </Text>
                </Group>
              ))}
            </Stack>
            <Stack gap="xs" p="sm" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
              <Group gap="xs">
                <Badge color="danger" size="xs">
                  Critical
                </Badge>
                <Text size="sm" fw={600}>
                  Lateral Movement — Suspicious Auth
                </Text>
                <Text size="xs" c="dimmed">
                  Last event 21:46 UTC
                </Text>
              </Group>
              <Group gap="xs" grow>
                {[
                  ['Source IP', '185.23.45.10'],
                  ['Destination', 'srv-prod-01'],
                  ['Victim user', 'jsmith@corp.local'],
                  ['Threat actor', 'FIN7 · IOC-8842'],
                ].map(([k, v]) => (
                  <Paper key={k} withBorder p="xs" radius="sm">
                    <Text size="xs" c="dimmed">
                      {k}
                    </Text>
                    <Text size="xs" fw={600} ff="monospace">
                      {v}
                    </Text>
                  </Paper>
                ))}
              </Group>
              <Stack gap={2}>
                <Group
                  gap="md"
                  px="xs"
                  py={4}
                  style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
                >
                  <Text size="xs" fw={700} w={48}>
                    Time
                  </Text>
                  <Text size="xs" fw={700} style={{ flex: 1 }}>
                    Event
                  </Text>
                  <Text size="xs" fw={700}>
                    Host
                  </Text>
                </Group>
                {[
                  ['21:42', 'Failed auth burst', 'workstation-114', false],
                  ['21:44', 'Lateral movement detected', 'srv-prod-01', true],
                  ['21:46', 'Suspicious PowerShell spawn', 'srv-prod-01', false],
                ].map(([t, e, h, hot]) => (
                  <Group
                    key={String(t)}
                    gap="md"
                    px="xs"
                    py={4}
                    style={{
                      background: hot ? 'var(--mantine-color-danger-light)' : undefined,
                      borderRadius: 4,
                    }}
                  >
                    <Text size="xs" w={48} ff="monospace">
                      {t as string}
                    </Text>
                    <Text size="xs" style={{ flex: 1 }}>
                      {e as string}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {h as string}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Group>
        </Paper>
      </Box>
    </Stack>
  );
}
