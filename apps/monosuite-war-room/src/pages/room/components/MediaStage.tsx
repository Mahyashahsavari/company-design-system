import {
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconLoader2,
  IconScreenShare,
  IconScreenShareOff,
  IconVideoOff,
  IconWifiOff,
} from '@tabler/icons-react';
import type { LivePerson, ShareLayout } from '../data';
import type { MediaState } from '../hooks/useRoomState';
import { ScreenShareStage } from './ScreenShareStage';
import { VideoPresenceStrip } from './VideoPresenceStrip';

interface MediaStageProps {
  media: MediaState;
  livePeople: LivePerson[];
  shareMinimized: boolean;
  viewerCount: number;
  onShareLayoutChange: (layout: ShareLayout) => void;
  onExpandShare: () => void;
  onStopShare: () => void;
  onRetry: () => void;
}

/**
 * Shared screen (primary) + optional participant PIP strip (secondary).
 * Incident context and dock stay outside this surface.
 */
export function MediaStage({
  media,
  livePeople,
  shareMinimized,
  viewerCount,
  onShareLayoutChange,
  onExpandShare,
  onStopShare,
  onRetry,
}: MediaStageProps) {
  if (!media.joined) return null;

  const shareActive = Boolean(media.share || media.remoteShareBy);
  const shareVisible = shareActive && !shareMinimized;
  const camerasActive =
    media.camera || livePeople.some((p) => !p.isLocal && p.camera);
  const showStatus =
    media.permission === 'denied' ||
    media.permission === 'unavailable' ||
    media.connection === 'reconnecting' ||
    media.connection === 'lost';

  // No permanent empty video — only open when share, cameras, or media status need it.
  if (!shareActive && !camerasActive && !showStatus) return null;

  const sharerName = media.share ? 'You' : (media.remoteShareBy ?? 'Participant');

  return (
    <Stack
      gap={0}
      style={{
        flexShrink: 0,
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        background: shareVisible
          ? 'var(--monosuite-color-chrome)'
          : 'var(--monosuite-color-surface)',
      }}
      data-testid="media-stage-combined"
    >
      {media.share && (
        <Group
          px="md"
          py={8}
          justify="space-between"
          wrap="nowrap"
          data-testid="self-share-banner"
          style={{
            background:
              'color-mix(in srgb, var(--mantine-color-teal-filled) 14%, var(--monosuite-color-surface-sunken))',
            borderBottom:
              '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 35%, var(--mantine-color-default-border))',
          }}
        >
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" fw={700}>
              You are sharing your screen
            </Text>
            <Group gap={6} wrap="nowrap">
              <Box
                component="span"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-success-filled)',
                  flexShrink: 0,
                }}
              />
              <Text size="xs" c="dimmed" fw={600}>
                {viewerCount} participants can see your screen
              </Text>
            </Group>
          </Stack>
          <Group gap="xs" wrap="nowrap">
            {shareMinimized && (
              <Button size="compact-xs" variant="light" color="teal" onClick={onExpandShare}>
                Show screen
              </Button>
            )}
            <Button
              size="xs"
              color="danger"
              variant="light"
              leftSection={<IconScreenShareOff size={14} />}
              onClick={onStopShare}
              data-testid="banner-stop-sharing"
            >
              Stop Sharing
            </Button>
          </Group>
        </Group>
      )}

      {shareActive && shareMinimized && !media.share && (
        <Group
          px="md"
          py={6}
          justify="space-between"
          wrap="nowrap"
          style={{
            background: 'var(--monosuite-color-surface-sunken)',
            borderBottom: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <IconScreenShare size={14} />
            <Text size="xs" fw={600}>
              {media.remoteShareBy} is sharing his screen
            </Text>
            <Badge color="success" size="xs" variant="filled">
              LIVE
            </Badge>
          </Group>
          <Button size="compact-xs" variant="light" color="teal" onClick={onExpandShare}>
            Show screen
          </Button>
        </Group>
      )}

      {showStatus && (
        <MediaStatusBanner
          permission={media.permission}
          connection={media.connection}
          onRetry={onRetry}
        />
      )}

      {shareVisible && (
        <Box
          style={{
            background: 'var(--monosuite-color-chrome)',
            color: 'var(--monosuite-color-chrome-text)',
          }}
        >
          {!media.share && (
            <Group px="md" pt="sm" pb={4} gap="xs" wrap="nowrap">
              <Badge color="success" size="xs" variant="filled">
                LIVE
              </Badge>
              <Text size="sm" fw={600} c="var(--monosuite-color-chrome-text)">
                {sharerName} is sharing their screen
              </Text>
            </Group>
          )}
          <ScreenShareStage
            selfShare={media.share}
            sharerName={sharerName}
            layout={media.shareLayout === 'split' ? 'room' : media.shareLayout}
            viewerCount={viewerCount}
            onLayoutChange={onShareLayoutChange}
          />
          {camerasActive && (
            <VideoPresenceStrip
              people={livePeople}
              localCamera={media.camera}
              speakingId={media.speakingId}
              placement="pip"
            />
          )}
        </Box>
      )}

      {!shareVisible && camerasActive && (
        <VideoPresenceStrip
          people={livePeople}
          localCamera={media.camera}
          speakingId={media.speakingId}
          placement="workspace"
        />
      )}
    </Stack>
  );
}

function MediaStatusBanner({
  permission,
  connection,
  onRetry,
}: {
  permission: MediaState['permission'];
  connection: MediaState['connection'];
  onRetry: () => void;
}) {
  if (permission === 'denied') {
    return (
      <Group
        px="md"
        py="sm"
        style={{
          background: 'var(--mantine-color-warning-light)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <ThemeIcon color="warning" variant="light" size="sm">
          <IconVideoOff size={14} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            Camera permission denied
          </Text>
          <Text size="xs" c="dimmed">
            Your local camera is blocked. Remote participant cameras stay visible.
          </Text>
        </Stack>
      </Group>
    );
  }

  if (connection === 'reconnecting') {
    return (
      <Group
        px="md"
        py="sm"
        justify="space-between"
        style={{
          background: 'var(--monosuite-color-surface-sunken)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Group gap="sm">
          <ThemeIcon color="accent" variant="light" size="sm">
            <IconLoader2 size={14} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="sm" fw={600}>
              Reconnecting media…
            </Text>
            <Text size="xs" c="dimmed">
              Restoring live room audio and video.
            </Text>
          </Stack>
        </Group>
        <Button size="compact-xs" variant="light" color="teal" onClick={onRetry}>
          Retry
        </Button>
      </Group>
    );
  }

  return (
    <Group
      px="md"
      py="sm"
      justify="space-between"
      style={{
        background: 'var(--mantine-color-danger-light)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group gap="sm">
        <ThemeIcon color="danger" variant="light" size="sm">
          {permission === 'unavailable' ? <IconVideoOff size={14} /> : <IconWifiOff size={14} />}
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            Media unavailable
          </Text>
          <Text size="xs" c="dimmed">
            Live media cannot be established. Investigation remains available.
          </Text>
        </Stack>
      </Group>
      <Button size="compact-xs" variant="light" color="teal" onClick={onRetry}>
        Retry
      </Button>
    </Group>
  );
}
