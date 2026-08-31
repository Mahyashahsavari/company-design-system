import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAntennaBars5,
  IconLayoutNavbar,
  IconLayoutSidebarRight,
  IconLoader2,
  IconMaximize,
  IconMaximizeOff,
  IconVideoOff,
  IconWifiOff,
} from '@tabler/icons-react';
import type { LivePerson, Participant, PinTarget, ShareLayout } from '../data';
import type { MediaState } from '../hooks/useRoomState';
import {
  CollaborationImmersiveLayout,
  type CollaborationMediaControlsProps,
} from './CollaborationImmersiveLayout';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';

interface CollaborationLayerProps extends CollaborationMediaControlsProps {
  media: MediaState;
  livePeople: LivePerson[];
  participants: Participant[];
  pinnedTarget: PinTarget | null;
  viewerCount: number;
  fullscreen: boolean;
  split: boolean;
  onSplitToggle: () => void;
  onShareLayoutChange: (layout: ShareLayout) => void;
  onStopShare: () => void;
  onRetry: () => void;
  onPinParticipant: (id: string) => void;
  onUnpin: () => void;
  onFullscreenChange: (active: boolean) => void;
  onExitFullscreen: () => void;
  canManageParticipants: boolean;
  onToggleParticipantMic: (id: string) => void;
  onToggleParticipantCamera: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onSetParticipantRole: (id: string, role: string) => void;
  onViewParticipantDetails: (id: string) => void;
}

/** Live collaboration surface — SOC-styled immersive channel. */
export function CollaborationLayer({
  media,
  livePeople,
  participants,
  pinnedTarget,
  viewerCount,
  fullscreen,
  split,
  durationLabel,
  participantCount,
  onJoin,
  onToggleMedia,
  onShare,
  onStopShare,
  onSettings,
  onRetry,
  onMore,
  onSplitToggle,
  onShareLayoutChange,
  onPinParticipant,
  onUnpin,
  onFullscreenChange,
  onExitFullscreen,
  canManageParticipants,
  onToggleParticipantMic,
  onToggleParticipantCamera,
  onRemoveParticipant,
  onSetParticipantRole,
  onViewParticipantDetails,
}: CollaborationLayerProps) {
  const shareActive = Boolean(media.share || media.remoteShareBy);
  const sharerName = media.share ? 'You' : (media.remoteShareBy ?? 'Participant');

  const showStatus =
    media.permission === 'denied' ||
    media.permission === 'unavailable' ||
    media.connection === 'reconnecting' ||
    media.connection === 'lost';

  if (!media.joined) return null;

  return (
    <Box
      data-testid="collaboration-layer"
      data-fullscreen={fullscreen ? 'true' : 'false'}
      data-split={split ? 'true' : 'false'}
      className="monosuite-collab-workspace"
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--monosuite-color-chrome)',
        color: 'var(--monosuite-color-chrome-text)',
        flex: 1,
        minHeight: 0,
        height: '100%',
        position: 'relative',
        borderRadius: fullscreen || split ? 0 : 'var(--mantine-radius-md)',
        border: fullscreen || split ? 'none' : '1px solid var(--monosuite-color-chrome-border)',
        borderLeft: split ? '1px solid var(--monosuite-color-chrome-border)' : undefined,
        boxShadow: fullscreen || split ? 'none' : 'var(--mantine-shadow-sm)',
      }}
    >
      <Box className="monosuite-collab-accent" aria-hidden />

      <Group
        px="sm"
        py={8}
        justify="space-between"
        wrap="nowrap"
        gap="sm"
        className="monosuite-collab-header"
        style={{ flexShrink: 0 }}
      >
        <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size={28}
            radius="sm"
            variant="light"
            color="teal"
            aria-hidden
            style={{ flexShrink: 0 }}
          >
            <IconAntennaBars5 size={15} />
          </ThemeIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text
              size="10px"
              fw={700}
              tt="uppercase"
              c="var(--monosuite-color-chrome-text-muted)"
              style={{ letterSpacing: '0.1em' }}
            >
              Live comms
            </Text>
            <TruncatedTooltipText
              size="sm"
              fw={700}
              c="var(--monosuite-color-chrome-text)"
              tooltip="Collaboration channel"
            >
              Collaboration channel
            </TruncatedTooltipText>
          </Stack>
          <Badge size="xs" variant="light" color="teal" style={{ flexShrink: 0 }}>
            SOC
          </Badge>
        </Group>

        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {!fullscreen && (
            <Tooltip label={split ? 'Dock in page' : 'Split page — live collaboration on the right'}>
              <ActionIcon
                size="sm"
                variant={split ? 'light' : 'subtle'}
                color={split ? 'teal' : 'neutral'}
                aria-label={
                  split ? 'Dock live collaboration in page' : 'Split live collaboration to side panel'
                }
                aria-pressed={split}
                onClick={onSplitToggle}
                style={
                  split
                    ? undefined
                    : {
                        color: 'var(--monosuite-color-chrome-text-muted)',
                      }
                }
              >
                {split ? <IconLayoutNavbar size={16} /> : <IconLayoutSidebarRight size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
          {!fullscreen && (
            <Tooltip label="Fullscreen collaboration">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="teal"
                aria-label="Fullscreen collaboration"
                onClick={() => onFullscreenChange(true)}
                style={{ color: 'var(--monosuite-color-chrome-text-muted)' }}
              >
                <IconMaximize size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {fullscreen && (
            <Button
              size="compact-xs"
              variant="light"
              color="teal"
              leftSection={<IconMaximizeOff size={14} />}
              onClick={onExitFullscreen}
            >
              Exit
            </Button>
          )}
        </Group>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {showStatus && (
          <MediaStatusBanner
            permission={media.permission}
            connection={media.connection}
            onRetry={onRetry}
          />
        )}

        {shareActive && media.shareLayout === 'minimized' && (
          <Group px="sm" py={8} justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <Badge size="xs" color="success" variant="filled">
                SHARING
              </Badge>
              <TruncatedTooltipText size="xs" fw={600} tooltip={media.share ? 'You are sharing' : `${sharerName} is sharing`}>
                {media.share ? 'You are sharing' : `${sharerName} is sharing`}
              </TruncatedTooltipText>
            </Group>
            <Button
              size="compact-xs"
              variant="light"
              color="teal"
              onClick={() => onShareLayoutChange('full')}
              style={{ flexShrink: 0 }}
            >
              Restore
            </Button>
          </Group>
        )}

        <CollaborationImmersiveLayout
          media={media}
          livePeople={livePeople}
          participants={participants}
          pinnedTarget={pinnedTarget}
          viewerCount={viewerCount}
          variant={fullscreen ? 'fullscreen' : 'split'}
          durationLabel={durationLabel}
          participantCount={participantCount}
          onJoin={onJoin}
          onToggleMedia={onToggleMedia}
          onShare={onShare}
          onStopShare={onStopShare}
          onSettings={onSettings}
          onRetry={onRetry}
          onMore={onMore}
          onShareLayoutChange={onShareLayoutChange}
          canManageParticipants={canManageParticipants}
          onPinParticipant={onPinParticipant}
          onUnpin={onUnpin}
          onToggleParticipantMic={onToggleParticipantMic}
          onToggleParticipantCamera={onToggleParticipantCamera}
          onRemoveParticipant={onRemoveParticipant}
          onSetParticipantRole={onSetParticipantRole}
          onViewParticipantDetails={onViewParticipantDetails}
        />
      </Box>
    </Box>
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
      <Group px="sm" py="sm" style={{ background: 'var(--mantine-color-warning-light)' }}>
        <ThemeIcon color="warning" variant="light" size="sm">
          <IconVideoOff size={14} />
        </ThemeIcon>
        <Stack gap={0} style={{ flex: 1 }}>
          <Text size="sm" fw={600}>
            Camera blocked
          </Text>
          <Text size="xs" c="dimmed">
            Local camera unavailable. Remote participants remain visible.
          </Text>
        </Stack>
      </Group>
    );
  }

  if (connection === 'reconnecting') {
    return (
      <Group px="sm" py="sm" justify="space-between">
        <Group gap="sm">
          <ThemeIcon color="accent" variant="light" size="sm">
            <IconLoader2 size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            Reconnecting…
          </Text>
        </Group>
        <Button size="compact-xs" variant="light" onClick={onRetry}>
          Retry
        </Button>
      </Group>
    );
  }

  return (
    <Group px="sm" py="sm" justify="space-between">
      <Group gap="sm">
        <ThemeIcon color="danger" variant="light" size="sm">
          <IconWifiOff size={14} />
        </ThemeIcon>
        <Text size="sm" fw={600}>
          Media unavailable
        </Text>
      </Group>
      <Button size="compact-xs" variant="light" onClick={onRetry}>
        Retry
      </Button>
    </Group>
  );
}
