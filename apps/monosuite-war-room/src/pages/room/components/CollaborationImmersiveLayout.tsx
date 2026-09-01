import { ActionIcon, Badge, Box, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMaximizeOff, IconScreenShareOff } from '@tabler/icons-react';
import type { LivePerson, Participant, PinTarget, ShareLayout } from '../data';
import type { MediaState } from '../hooks/useRoomState';
import { ROOM_MOBILE_QUERY } from '../../../shared/constants';
import { MediaDock } from './MediaDock';
import { buildMediaRoster, ParticipantTile } from './ParticipantMediaGrid';
import { ScreenShareStage } from './ScreenShareStage';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';

export interface CollaborationMediaControlsProps {
  durationLabel: string;
  participantCount: number;
  onJoin: () => void;
  onToggleMedia: (key: 'mic' | 'camera' | 'speaker') => void;
  onShare: () => void;
  onStopShare: () => void;
  onSettings: () => void;
  onRetry: () => void;
  onMore: (action: string) => void;
}

interface CollaborationImmersiveLayoutProps extends CollaborationMediaControlsProps {
  media: MediaState;
  livePeople: LivePerson[];
  participants: Participant[];
  pinnedTarget: PinTarget | null;
  viewerCount: number;
  /** Fullscreen: stage + rail. Split: single participant column. */
  variant: 'fullscreen' | 'split';
  onShareLayoutChange: (layout: ShareLayout) => void;
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

/** Full-height collaboration layouts — fullscreen stage+rail or split stack column. */
export function CollaborationImmersiveLayout({
  media,
  livePeople,
  participants,
  pinnedTarget,
  viewerCount,
  variant,
  durationLabel,
  participantCount,
  onJoin,
  onToggleMedia,
  onShare,
  onStopShare,
  onSettings,
  onRetry,
  onMore,
  onShareLayoutChange,
  onExitFullscreen,
  canManageParticipants,
  onPinParticipant,
  onUnpin,
  onToggleParticipantMic,
  onToggleParticipantCamera,
  onRemoveParticipant,
  onSetParticipantRole,
  onViewParticipantDetails,
}: CollaborationImmersiveLayoutProps) {
  const shareActive = Boolean(media.share || media.remoteShareBy);
  const shareVisible = shareActive && media.shareLayout !== 'minimized';
  const sharerName = media.share ? 'You' : (media.remoteShareBy ?? 'Participant');
  const roster = buildMediaRoster(livePeople, participants, media);
  const isSplit = variant === 'split';
  const isMobile = useMediaQuery(ROOM_MOBILE_QUERY, false, { getInitialValueInEffect: false });

  const pinnedParticipant =
    pinnedTarget?.kind === 'participant'
      ? roster.find((p) => p.id === pinnedTarget.id)
      : null;

  const stageParticipant = !shareVisible
    ? pinnedParticipant ??
      roster.find((p) => p.speaking) ??
      roster.find((p) => p.camera) ??
      roster[0]
    : null;

  const railParticipants = shareVisible
    ? roster
    : roster.filter((p) => p.id !== stageParticipant?.id);

  const splitFeatured = !shareVisible
    ? pinnedParticipant ??
      roster.find((p) => p.speaking) ??
      roster.find((p) => p.camera) ??
      roster[0]
    : null;

  const splitGridParticipants = shareVisible
    ? roster
    : roster.filter((p) => p.id !== splitFeatured?.id);

  const tileProps = (person: (typeof roster)[number]) => ({
    pinned: pinnedTarget?.kind === 'participant' && pinnedTarget.id === person.id,
    canManage: canManageParticipants && !person.isLocal,
    onPin: () => onPinParticipant(person.id),
    onUnpin,
    onToggleMic: () => onToggleParticipantMic(person.id),
    onToggleCamera: () => onToggleParticipantCamera(person.id),
    onRemove: () => onRemoveParticipant(person.id),
    onSetRole: (role: string) => onSetParticipantRole(person.id, role),
    onViewDetails: () => onViewParticipantDetails(person.id),
  });

  const shareHeader = (
    <Group justify="space-between" wrap="nowrap" gap="xs" style={{ flexShrink: 0 }}>
      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
        <Badge color="success" size="xs" variant="filled">
          SHARING
        </Badge>
        <TruncatedTooltipText size="xs" fw={700} lineClamp={1} c="var(--monosuite-color-chrome-text)" tooltip={media.share ? 'Your screen' : `${sharerName.split(' ')[0]}'s screen`}>
          {media.share ? 'Your screen' : `${sharerName.split(' ')[0]}'s screen`}
        </TruncatedTooltipText>
      </Group>
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
  );

  const participantColumn = (
    isMobile && !isSplit ? (
      <Group gap={6} wrap="nowrap" className="monosuite-collab-participant-stack">
        {railParticipants.map((person) => (
          <ParticipantTile
            key={person.id}
            person={person}
            size="thumb"
            {...tileProps(person)}
          />
        ))}
      </Group>
    ) : (
      <Stack gap={6} className="monosuite-collab-participant-stack">
        {railParticipants.map((person) => (
          <ParticipantTile
            key={person.id}
            person={person}
            size="rail"
            {...tileProps(person)}
          />
        ))}
      </Stack>
    )
  );

  const splitParticipantLayout = (
    <Stack gap="sm" className="monosuite-collab-split-participants">
      {!shareVisible && splitFeatured && (
        <Box className="monosuite-collab-split-featured">
          <ParticipantTile
            person={splitFeatured}
            size="featured"
            {...tileProps(splitFeatured)}
          />
        </Box>
      )}
      {splitGridParticipants.length > 0 && (
        <Box className="monosuite-collab-split-grid">
          {splitGridParticipants.map((person) => (
            <ParticipantTile
              key={person.id}
              person={person}
              size="thumb"
              {...tileProps(person)}
            />
          ))}
        </Box>
      )}
    </Stack>
  );

  return (
    <Stack
      gap={0}
      className="monosuite-collab-immersive"
      data-variant={variant}
      style={{ flex: 1, minHeight: 0 }}
    >
      <Box
        className="monosuite-collab-immersive-body"
        style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}
      >
        {isSplit ? (
          <Box
            className="monosuite-collab-split-body"
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Text
              size="10px"
              fw={700}
              tt="uppercase"
              px="sm"
              pt="sm"
              pb={6}
              c="var(--monosuite-color-chrome-text-muted)"
              className="monosuite-collab-section-label"
              style={{ letterSpacing: '0.08em', flexShrink: 0 }}
            >
              Participants · {roster.length}
            </Text>
            <Box
              px="sm"
              pb="sm"
              style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
            >
              <Stack gap="sm">
                {shareVisible && (
                  <Box className="monosuite-collab-share-compact">
                    {shareHeader}
                    <Box mt={6} style={{ minHeight: 0 }}>
                      <ScreenShareStage
                        selfShare={media.share}
                        sharerName={sharerName}
                        layout="room"
                        viewerCount={viewerCount}
                        onLayoutChange={onShareLayoutChange}
                        embedded
                      />
                    </Box>
                  </Box>
                )}
                {splitParticipantLayout}
              </Stack>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              className="monosuite-collab-stage"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: 12,
              }}
            >
              {shareVisible ? (
                <Stack gap={8} style={{ flex: 1, minHeight: 0 }}>
                  {shareHeader}
                  <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <ScreenShareStage
                      selfShare={media.share}
                      sharerName={sharerName}
                      layout="full"
                      viewerCount={viewerCount}
                      onLayoutChange={onShareLayoutChange}
                      embedded
                    />
                  </Box>
                </Stack>
              ) : stageParticipant ? (
                <Box style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  <ParticipantTile
                    person={stageParticipant}
                    size="stage"
                    {...tileProps(stageParticipant)}
                  />
                </Box>
              ) : (
                <Box
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="sm" c="var(--monosuite-color-chrome-text-muted)">
                    Waiting for participant media…
                  </Text>
                </Box>
              )}
            </Box>

            <Box
              className="monosuite-collab-participant-rail"
              data-orientation={isMobile ? 'horizontal' : 'vertical'}
              style={{
                width: isMobile ? '100%' : 212,
                flexShrink: 0,
                borderLeft: isMobile ? undefined : '1px solid var(--monosuite-color-chrome-border)',
                borderTop: isMobile ? '1px solid var(--monosuite-color-chrome-border)' : undefined,
                background: 'var(--monosuite-color-chrome-raised)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <Text
                size="10px"
                fw={700}
                tt="uppercase"
                px="sm"
                pt="sm"
                pb={6}
                c="var(--monosuite-color-chrome-text-muted)"
                className="monosuite-collab-section-label"
                style={{ letterSpacing: '0.08em', flexShrink: 0 }}
              >
                Participants · {roster.length}
              </Text>
              <Box
                px="sm"
                pb="sm"
                style={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflowX: isMobile ? 'auto' : 'hidden',
                  overflowY: isMobile ? 'hidden' : 'auto',
                }}
              >
                {participantColumn}
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Box
        className={`monosuite-collab-media-dock${isSplit ? ' monosuite-collab-media-dock--split' : ''}`}
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--monosuite-color-chrome-border)',
          background: 'var(--monosuite-color-chrome-raised)',
        }}
      >
        <MediaDock
          embedded
          density={isSplit ? 'sidebar' : 'default'}
          hideStatusMeta={isSplit || isMobile}
          centerMediaControls={!isSplit && media.joined && !isMobile}
          compactLayout={isMobile}
          trailingSlot={
            isMobile && !isSplit && onExitFullscreen ? (
              <Tooltip label="Exit fullscreen collaboration" withArrow position="top">
                <ActionIcon
                  variant="light"
                  color="teal"
                  size={36}
                  radius="md"
                  aria-label="Exit fullscreen collaboration"
                  data-testid="dock-fullscreen"
                  onClick={onExitFullscreen}
                  styles={{
                    root: {
                      color: 'var(--monosuite-color-chrome-text-muted)',
                      border: '1px solid transparent',
                    },
                  }}
                >
                  <IconMaximizeOff size={18} stroke={1.75} />
                </ActionIcon>
              </Tooltip>
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
    </Stack>
  );
}
