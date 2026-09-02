import { Badge, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import {
  IconBellRinging,
  IconDeviceDesktop,
  IconServer,
  IconShieldSearch,
  IconTimeline,
} from '@tabler/icons-react';
import type { ShareLayout } from '../data';

interface ScreenShareStageProps {
  selfShare: boolean;
  sharerName: string;
  layout: ShareLayout;
  viewerCount?: number;
  onLayoutChange: (layout: ShareLayout) => void;
  onStopShare?: () => void;
  /** When true, header/controls are owned by CollaborationLayer. */
  embedded?: boolean;
}

/** Shared screen mock surface for live collaboration. */
export function ScreenShareStage({
  selfShare,
  sharerName,
  layout,
  viewerCount: _viewerCount = 4,
  onLayoutChange,
  embedded = false,
}: ScreenShareStageProps) {
  const isExpanded = layout === 'full';
  const stageShellStyle =
    embedded && isExpanded
      ? {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column' as const,
          padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md) var(--mantine-spacing-md)',
        }
      : {
          height:
            layout === 'full'
              ? 'min(62vh, 520px)'
              : layout === 'room'
                ? 'min(36vh, 300px)'
                : 'min(28vh, 240px)',
          padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md) var(--mantine-spacing-md)',
        };

  return (
    <Stack
      gap={0}
      data-testid={selfShare ? 'self-screen-share-stage' : 'remote-screen-share-stage'}
      style={embedded && isExpanded ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}
    >
      {!embedded && (
        <Group
          px="md"
          py="sm"
          justify="space-between"
          wrap="nowrap"
          style={{
            background: selfShare
              ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 16%, var(--monosuite-color-chrome-raised))'
              : 'var(--monosuite-color-chrome-raised)',
            borderBottom: '1px solid var(--monosuite-color-chrome-border)',
          }}
        >
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Badge color="success" size="xs" variant="filled">
              LIVE SHARING
            </Badge>
            <Text size="sm" fw={700} c="var(--monosuite-color-chrome-text)" lineClamp={1}>
              {selfShare ? 'You are sharing your screen' : `${sharerName} is sharing their screen`}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Button size="compact-xs" variant="subtle" onClick={() => onLayoutChange('minimized')}>
              Minimize
            </Button>
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => onLayoutChange(layout === 'full' ? 'split' : 'full')}
            >
              {layout === 'full' ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
          </Group>
        </Group>
      )}

      <Box style={stageShellStyle}>
        <Paper
          radius="sm"
          h="100%"
          style={{
            flex: embedded && isExpanded ? 1 : undefined,
            minHeight: embedded && isExpanded ? 0 : undefined,
            display: embedded && isExpanded ? 'flex' : undefined,
            flexDirection: embedded && isExpanded ? 'column' : undefined,
            overflow: 'hidden',
            background: 'var(--monosuite-color-chrome-raised)',
            border: '1px solid var(--monosuite-color-chrome-border)',
          }}
        >
          <Group
            px="sm"
            py={6}
            justify="space-between"
            style={{
              background: 'var(--monosuite-color-chrome)',
              borderBottom: '1px solid var(--monosuite-color-chrome-border)',
            }}
          >
            <Group gap={6}>
              <IconDeviceDesktop size={14} />
              <Text size="xs" fw={600} c="var(--monosuite-color-chrome-text)">
                Splunk — Alert SPL-8847291
              </Text>
            </Group>
            <Text size="xs" c="var(--monosuite-color-chrome-text-muted)">
              {sharerName} · Analyst workstation
            </Text>
          </Group>
          <Group align="stretch" gap={0} h="calc(100% - 32px)" wrap="nowrap">
            <Stack
              gap={4}
              p="xs"
              w={120}
              style={{
                borderRight: '1px solid var(--monosuite-color-chrome-border)',
                background: 'var(--monosuite-color-chrome)',
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
                    background: item.active
                      ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 22%, transparent)'
                      : undefined,
                  }}
                >
                  <item.icon size={12} />
                  <Text
                    size="xs"
                    fw={item.active ? 700 : 400}
                    c="var(--monosuite-color-chrome-text)"
                  >
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
                <Text size="sm" fw={600} c="var(--monosuite-color-chrome-text)">
                  Lateral Movement — Suspicious Auth
                </Text>
                <Text size="xs" c="var(--monosuite-color-chrome-text-muted)">
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
                  <Box
                    key={k}
                    p="xs"
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: 'var(--monosuite-color-chrome)',
                      border: '1px solid var(--monosuite-color-chrome-border)',
                    }}
                  >
                    <Text size="xs" c="var(--monosuite-color-chrome-text-muted)">
                      {k}
                    </Text>
                    <Text size="xs" fw={600} c="var(--monosuite-color-chrome-text)">
                      {v}
                    </Text>
                  </Box>
                ))}
              </Group>
              <Stack gap={2}>
                <Group
                  gap="md"
                  px="xs"
                  py={4}
                  style={{ borderBottom: '1px solid var(--monosuite-color-chrome-border)' }}
                >
                  <Text size="xs" fw={700} w={48} c="var(--monosuite-color-chrome-text-muted)">
                    Time
                  </Text>
                  <Text size="xs" fw={700} style={{ flex: 1 }} c="var(--monosuite-color-chrome-text-muted)">
                    Event
                  </Text>
                  <Text size="xs" fw={700} c="var(--monosuite-color-chrome-text-muted)">
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
                      background: hot
                        ? 'color-mix(in srgb, var(--mantine-color-danger-filled) 18%, transparent)'
                        : undefined,
                      borderRadius: 4,
                    }}
                  >
                    <Text size="xs" w={48} c="var(--monosuite-color-chrome-text)">
                      {t as string}
                    </Text>
                    <Text size="xs" style={{ flex: 1 }} c="var(--monosuite-color-chrome-text)">
                      {e as string}
                    </Text>
                    <Text size="xs" c="var(--monosuite-color-chrome-text-muted)">
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
