import {
  Avatar,
  Badge,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import type { ReactNode } from 'react';
import {
  IconAdjustments,
  IconAlertTriangle,
  IconDots,
  IconLoader2,
  IconMicrophone,
  IconMicrophoneOff,
  IconNetwork,
  IconPlayerPlay,
  IconRefresh,
  IconScreenShare,
  IconScreenShareOff,
  IconSettings,
  IconUsers,
  IconVideo,
  IconVideoOff,
  IconVolume,
  IconVolumeOff,
  IconWifiOff,
} from '@tabler/icons-react';
import { CONNECTION_UI, LIVE_PEOPLE, type ConnectionState } from '../data';
import type { MediaState } from '../hooks/useRoomState';

interface MediaDockProps {
  media: MediaState;
  durationLabel: string;
  onJoin: () => void;
  onToggleMedia: (key: 'mic' | 'camera' | 'speaker') => void;
  onShare: () => void;
  onStopShare: () => void;
  onSettings: () => void;
  onRetry: () => void;
  onMore: (action: string) => void;
}

const chromeMuted = 'var(--monosuite-color-chrome-text-muted)';
const chromeText = 'var(--monosuite-color-chrome-text)';

export function MediaDock({
  media,
  durationLabel,
  onJoin,
  onToggleMedia,
  onShare,
  onStopShare,
  onSettings,
  onRetry,
  onMore,
}: MediaDockProps) {
  const { joined, mic, camera, speaker, share, connection, speakingId } = media;
  const conn = (joined ? connection : 'idle') as ConnectionState;
  const connUi = conn !== 'idle' ? CONNECTION_UI[conn] : null;
  const presenting = Boolean(media.remoteShareBy || share) && media.shareLayout !== 'minimized';
  const showAudioStrip = joined && !camera && !presenting;
  const speakerPerson =
    LIVE_PEOPLE.find((p) => p.id === speakingId) ?? LIVE_PEOPLE[0];

  return (
    <Group
      h="100%"
      px="md"
      justify="space-between"
      wrap="nowrap"
      gap="md"
      style={{
        background: 'var(--monosuite-color-chrome)',
        color: chromeText,
        borderTop: '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 32%, transparent)',
      }}
    >
      <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
        <Group gap={6}>
          <Badge
            color="success"
            variant="filled"
            size="sm"
            leftSection={
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-white)',
                  display: 'inline-block',
                }}
              />
            }
          >
            {joined ? 'LIVE' : 'LIVE ROOM'}
          </Badge>
          <Group gap={4} c={chromeMuted}>
            <IconUsers size={14} />
            <Text size="xs">{LIVE_PEOPLE.length} participants</Text>
          </Group>
          {!joined && (
            <Text size="xs" c={chromeMuted}>
              Communication not started
            </Text>
          )}
          {joined && (
            <Text size="xs" c={chromeMuted}>
              {durationLabel} active
            </Text>
          )}
          {share && (
            <Text size="xs" c="teal.4">
              {LIVE_PEOPLE.length} participants can see your screen
            </Text>
          )}
        </Group>

        {showAudioStrip && (
          <Group gap={8}>
            <Group gap={4}>
              {LIVE_PEOPLE.slice(0, 3).map((p) => (
                <Avatar key={p.id} size={24} radius="xl" color={p.color}>
                  {p.initials}
                </Avatar>
              ))}
            </Group>
            <Group gap={4} c={chromeMuted}>
              <IconMicrophone size={14} />
              <Text size="xs">
                Speaking:{' '}
                <Text span size="xs" c={chromeText} fw={600}>
                  {speakerPerson?.name}
                </Text>
              </Text>
            </Group>
          </Group>
        )}
      </Group>

      {!joined ? (
        <Button color="teal" leftSection={<IconPlayerPlay size={16} />} onClick={onJoin}>
          Join Live
        </Button>
      ) : (
        <Group gap="xs" wrap="nowrap">
          <DockBtn
            label="Microphone"
            state={mic ? 'On' : 'Muted'}
            active={mic}
            onClick={() => onToggleMedia('mic')}
            icon={mic ? <IconMicrophone size={16} /> : <IconMicrophoneOff size={16} />}
          />
          <DockBtn
            label="Camera"
            state={camera ? 'On' : 'Off'}
            active={camera}
            onClick={() => onToggleMedia('camera')}
            icon={camera ? <IconVideo size={16} /> : <IconVideoOff size={16} />}
          />
          <DockBtn
            label="Speaker"
            state={speaker ? 'On' : 'Muted'}
            active={speaker}
            onClick={() => onToggleMedia('speaker')}
            icon={speaker ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
          />
          <DockBtn
            label="Screen Share"
            state={share ? 'Sharing' : 'Off'}
            active={share}
            onClick={onShare}
            icon={<IconScreenShare size={16} />}
          />
          {share && (
            <Button
              size="xs"
              color="danger"
              variant="light"
              leftSection={<IconScreenShareOff size={14} />}
              onClick={onStopShare}
            >
              Stop Sharing
            </Button>
          )}
          <Button
            size="xs"
            variant="subtle"
            c={chromeMuted}
            leftSection={<IconSettings size={14} />}
            onClick={onSettings}
          >
            Settings
          </Button>
          <Menu shadow="md" width={200} position="top-end">
            <Menu.Target>
              <Button size="xs" variant="subtle" c={chromeMuted} leftSection={<IconDots size={14} />}>
                More
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconAdjustments size={14} />}
                onClick={() => onMore('devices')}
              >
                Test devices
              </Menu.Item>
              <Menu.Item
                leftSection={<IconNetwork size={14} />}
                onClick={() => onMore('connection')}
              >
                Connection details
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )}

      {joined && connUi && (
        <Group gap={6} wrap="nowrap">
          <ConnIcon state={conn} />
          <Stack gap={0}>
            <Text size="xs" c={chromeMuted} fw={600}>
              {connUi.label}
            </Text>
          </Stack>
          {(conn === 'lost' || conn === 'reconnecting') && (
            <Button
              size="compact-xs"
              variant="light"
              color="teal"
              leftSection={<IconRefresh size={12} />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </Group>
      )}
    </Group>
  );
}

function DockBtn({
  label,
  state,
  active,
  onClick,
  icon,
}: {
  label: string;
  state: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <Button
      size="xs"
      variant={active ? 'light' : 'subtle'}
      color={active ? 'teal' : 'neutral'}
      onClick={onClick}
      styles={{
        root: {
          height: 'auto',
          padding: '4px 8px',
          flexDirection: 'column',
          gap: 0,
          color: active ? undefined : 'var(--monosuite-color-chrome-text-muted)',
        },
        label: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 },
      }}
    >
      {icon}
      <Text size="xs" lh={1.2}>
        {label}
      </Text>
      <Text size="xs" c="dimmed" lh={1.2}>
        {state}
      </Text>
    </Button>
  );
}

function ConnIcon({ state }: { state: ConnectionState }) {
  if (state === 'poor') {
    return (
      <ThemeIcon size="sm" color="warning" variant="light">
        <IconAlertTriangle size={12} />
      </ThemeIcon>
    );
  }
  if (state === 'reconnecting') {
    return (
      <ThemeIcon size="sm" color="accent" variant="light">
        <IconLoader2 size={12} />
      </ThemeIcon>
    );
  }
  if (state === 'lost') {
    return (
      <ThemeIcon size="sm" color="danger" variant="light">
        <IconWifiOff size={12} />
      </ThemeIcon>
    );
  }
  return (
    <ThemeIcon size="sm" color="success" variant="filled" radius="xl">
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--mantine-color-white)',
        }}
      />
    </ThemeIcon>
  );
}
