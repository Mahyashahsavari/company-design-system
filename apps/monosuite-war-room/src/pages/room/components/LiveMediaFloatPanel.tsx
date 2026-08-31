import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconLayoutSidebarRight,
  IconMaximize,
  IconMaximizeOff,
  IconMicrophone,
  IconScreenShareOff,
  IconUsers,
} from '@tabler/icons-react';
import type { LivePerson, Participant, PinTarget } from '../data';
import type { MediaState } from '../hooks/useRoomState';
import { MediaDock } from './MediaDock';
import { ParticipantMediaGrid } from './ParticipantMediaGrid';
import { VIDEO_ROOM_IDS } from './VideoPresenceStrip';

interface LiveMediaFloatPanelProps {
  media: MediaState;
  livePeople: LivePerson[];
  participants: Participant[];
  pinnedTarget: PinTarget | null;
  durationLabel: string;
  participantCount: number;
  onJoin: () => void;
  onToggleMedia: (key: 'mic' | 'camera' | 'speaker') => void;
  onShare: () => void;
  onStopShare: () => void;
  onSettings: () => void;
  onRetry: () => void;
  onMore: (action: string) => void;
  onSplitToggle: () => void;
  onFullscreenChange: (active: boolean) => void;
  fullscreenActive?: boolean;
  onExitFullscreen?: () => void;
  canManageParticipants: boolean;
  onPinParticipant: (id: string) => void;
  onUnpin: () => void;
  onToggleParticipantMic: (id: string) => void;
  onToggleParticipantCamera: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onSetParticipantRole: (id: string, role: string) => void;
  onViewParticipantDetails: (id: string) => void;
}

/** Unified floating live presence + media controls — replaces inline collaboration + separate dock. */
export function LiveMediaFloatPanel({
  media,
  livePeople,
  participants,
  pinnedTarget,
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
  onFullscreenChange,
  fullscreenActive = false,
  onExitFullscreen,
  canManageParticipants,
  onPinParticipant,
  onUnpin,
  onToggleParticipantMic,
  onToggleParticipantCamera,
  onRemoveParticipant,
  onSetParticipantRole,
  onViewParticipantDetails,
}: LiveMediaFloatPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const joined = media.joined;
  const shareActive = Boolean(media.share || media.remoteShareBy);
  const sharerName = media.share ? 'You' : (media.remoteShareBy ?? 'Participant');

  return (
    <Box
      data-testid="live-media-float-panel"
      data-joined={joined ? 'true' : 'false'}
      style={{
        width: 'fit-content',
        maxWidth: 'min(960px, calc(100vw - 32px))',
        marginInline: 'auto',
        borderRadius: 14,
        background: 'var(--monosuite-color-chrome)',
        color: 'var(--monosuite-color-chrome-text)',
        border: '1px solid var(--monosuite-color-chrome-border)',
        boxShadow: 'var(--mantine-shadow-lg)',
        outline: joined
          ? '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 36%, transparent)'
          : undefined,
        overflow: 'hidden',
      }}
    >
      {joined ? (
        <Stack gap={0}>
          <Group
            px="sm"
            py={6}
            justify="space-between"
            wrap="nowrap"
            style={{
              borderBottom: '1px solid var(--monosuite-color-chrome-border)',
              background: 'var(--monosuite-color-chrome-raised)',
            }}
          >
            <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
              <Badge color="success" size="xs" variant="filled">
                LIVE
              </Badge>
              <Text size="xs" fw={700} visibleFrom="xs">
                Live collaboration
              </Text>
              <Group gap={4} wrap="nowrap" c="var(--monosuite-color-chrome-text-muted)">
                <IconUsers size={12} aria-hidden />
                <Text size="xs" fw={600}>
                  {participantCount}
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap" c="var(--monosuite-color-chrome-text-muted)">
                <IconClock size={12} aria-hidden />
                <Text size="xs" fw={600}>
                  {durationLabel}
                </Text>
              </Group>
            </Group>
            <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Tooltip label={expanded ? 'Collapse participants' : 'Expand participants'}>
                <ActionIcon
                  size="sm"
                  variant={expanded ? 'light' : 'subtle'}
                  color="teal"
                  aria-label={expanded ? 'Collapse participants' : 'Expand participants'}
                  aria-expanded={expanded}
                  onClick={() => setExpanded((open) => !open)}
                  style={{ color: 'var(--monosuite-color-chrome-text-muted)' }}
                >
                  {expanded ? <IconChevronDown size={15} /> : <IconChevronUp size={15} />}
                </ActionIcon>
              </Tooltip>
              {!fullscreenActive && (
                <Tooltip label="Split page — live collaboration on the right">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="neutral"
                    aria-label="Split live collaboration to side panel"
                    onClick={onSplitToggle}
                    style={{ color: 'var(--monosuite-color-chrome-text-muted)' }}
                  >
                    <IconLayoutSidebarRight size={15} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip
                label={fullscreenActive ? 'Exit fullscreen collaboration' : 'Fullscreen collaboration'}
              >
                <ActionIcon
                  size="sm"
                  variant={fullscreenActive ? 'light' : 'subtle'}
                  color="teal"
                  aria-label={
                    fullscreenActive ? 'Exit fullscreen collaboration' : 'Fullscreen collaboration'
                  }
                  onClick={() =>
                    fullscreenActive ? onExitFullscreen?.() : onFullscreenChange(true)
                  }
                  style={{ color: 'var(--monosuite-color-chrome-text-muted)' }}
                >
                  {fullscreenActive ? <IconMaximizeOff size={15} /> : <IconMaximize size={15} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {shareActive && (
            <Group
              px="sm"
              py={4}
              gap="xs"
              wrap="nowrap"
              style={{
                borderBottom: '1px solid var(--monosuite-color-chrome-border)',
                background:
                  'color-mix(in srgb, var(--mantine-color-success-filled) 10%, var(--monosuite-color-chrome))',
              }}
            >
              <Badge size="xs" color="success" variant="filled">
                SHARING
              </Badge>
              <Text size="xs" fw={600} truncate style={{ flex: 1, minWidth: 0 }}>
                {media.share ? 'You are sharing your screen' : `${sharerName} is sharing`}
              </Text>
              {media.share && (
                <Button
                  size="compact-xs"
                  color="danger"
                  variant="light"
                  leftSection={<IconScreenShareOff size={14} />}
                  onClick={onStopShare}
                  style={{ flexShrink: 0 }}
                >
                  Stop
                </Button>
              )}
            </Group>
          )}

          {expanded ? (
            <Box
              px="sm"
              py={6}
              style={{
                maxHeight: 220,
                overflow: 'auto',
                borderBottom: '1px solid var(--monosuite-color-chrome-border)',
              }}
            >
              <ParticipantMediaGrid
                media={media}
                livePeople={livePeople}
                participants={participants}
                pinnedTarget={pinnedTarget}
                compact
                canManageParticipants={canManageParticipants}
                onPin={onPinParticipant}
                onUnpin={onUnpin}
                onToggleMic={onToggleParticipantMic}
                onToggleCamera={onToggleParticipantCamera}
                onRemove={onRemoveParticipant}
                onSetRole={onSetParticipantRole}
                onViewDetails={onViewParticipantDetails}
              />
            </Box>
          ) : null}
        </Stack>
      ) : null}

      <MediaDock
        embedded
        hideStatusMeta={joined}
        leadingSlot={
          joined ? (
            <CompactParticipantAvatars
              people={livePeople}
              localCamera={media.camera}
              speakingId={media.speakingId}
            />
          ) : undefined
        }
        media={media}
        durationLabel={durationLabel}
        participantCount={participantCount}
        onJoin={onJoin}
        onToggleMedia={onToggleMedia}
        onShare={onShare}
        onStopShare={onStopShare}
        onSettings={onSettings}
        onRetry={onRetry}
        onMore={onMore}
      />
    </Box>
  );
}

function CompactParticipantAvatars({
  people,
  localCamera,
  speakingId,
}: {
  people: LivePerson[];
  localCamera: boolean;
  speakingId: string;
}) {
  const roster = VIDEO_ROOM_IDS.map((id) => {
    const person = people.find((p) => p.id === id);
    if (!person) return null;
    if (person.isLocal) {
      return { ...person, camera: localCamera };
    }
    return person;
  }).filter(Boolean) as LivePerson[];

  return (
    <Group gap={4} wrap="nowrap" data-testid="compact-participant-avatars">
      {roster.map((person) => {
        const speaking = person.id === speakingId;
        const label = person.isLocal ? `${person.name} (You)` : person.name;
        return (
          <Tooltip key={person.id} label={label} withArrow position="top">
            <Box style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                size={26}
                radius="xl"
                color={person.color}
                aria-label={label}
                style={{
                  border: speaking
                    ? '2px solid var(--mantine-color-teal-filled)'
                    : '2px solid var(--monosuite-color-chrome-border)',
                }}
              >
                {person.initials}
              </Avatar>
              {speaking && (
                <Box
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: -1,
                    bottom: -1,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--monosuite-color-chrome)',
                    border: '1px solid var(--monosuite-color-chrome-border)',
                  }}
                >
                  <IconMicrophone size={8} color="var(--mantine-color-teal-filled)" />
                </Box>
              )}
              {!person.camera && (
                <Box
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--monosuite-color-chrome) 55%, transparent)',
                  }}
                />
              )}
            </Box>
          </Tooltip>
        );
      })}
    </Group>
  );
}
