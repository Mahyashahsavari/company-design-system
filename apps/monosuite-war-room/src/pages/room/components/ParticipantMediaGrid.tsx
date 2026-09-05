import type { ReactNode } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Menu,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowsExchange,
  IconDots,
  IconMicrophone,
  IconMicrophoneOff,
  IconPin,
  IconPinFilled,
  IconScreenShare,
  IconUser,
  IconUserOff,
  IconVideo,
  IconVideoOff,
  IconWifiOff,
} from '@tabler/icons-react';
import { CURRENT_USER } from '../../../shared/constants';
import { ASSIGNABLE_ROOM_ROLES, participantRoleLabel, isRoomCommander, roomRoleColor, type LivePerson, type Participant, type PinTarget } from '../data';
import type { MediaState } from '../hooks/useRoomState';

export interface MediaParticipant {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  assignableRole: string;
  camera: boolean;
  mic: boolean;
  speaking: boolean;
  sharing: boolean;
  isLocal: boolean;
  connection: 'good' | 'poor';
  status: 'online' | 'away';
}

interface ParticipantMediaGridProps {
  media: MediaState;
  livePeople: LivePerson[];
  participants: Participant[];
  pinnedTarget: PinTarget | null;
  compact?: boolean;
  /** Screen share active — uniform cards docked below the share stage. */
  duringShare?: boolean;
  /** Grid (default) or immersive side-rail layout. */
  layout?: 'grid' | 'rail';
  canManageParticipants: boolean;
  onPin: (id: string) => void;
  onUnpin: () => void;
  onToggleMic: (id: string) => void;
  onToggleCamera: (id: string) => void;
  onRemove: (id: string) => void;
  onSetRole: (id: string, role: string) => void;
  onViewDetails: (id: string) => void;
  commanderParticipantId: string;
  canTransferCommand?: boolean;
  onTransferCommand?: () => void;
}

export function buildMediaRoster(
  livePeople: LivePerson[],
  participants: Participant[],
  media: MediaState,
  commanderParticipantId: string,
): MediaParticipant[] {
  return livePeople.map((person) => {
    const remote = participants.find((p) => p.id === person.id);
    const isLocal = Boolean(person.isLocal);
    const sharing =
      (isLocal && media.share) ||
      (!isLocal && media.remoteShareBy === (remote?.name ?? person.name));

    return {
      id: person.id,
      name: isLocal ? CURRENT_USER.name : person.name,
      initials: person.initials,
      color: person.color,
      assignableRole: isLocal ? CURRENT_USER.roomRole : (remote?.role ?? 'Responder'),
      role: isLocal
        ? participantRoleLabel(CURRENT_USER.id, CURRENT_USER.roomRole, commanderParticipantId)
        : participantRoleLabel(
            person.id,
            remote?.role ?? 'Responder',
            commanderParticipantId,
          ),
      camera: isLocal ? media.camera : (remote?.camera ?? person.camera),
      mic: isLocal
        ? media.mic && !media.mutedByModerator
        : (remote?.mic ?? true),
      speaking: isLocal ? false : media.speakingId === person.id,
      sharing,
      isLocal,
      connection: media.connection === 'poor' && !isLocal ? 'poor' : 'good',
      status: remote?.status ?? 'online',
    };
  });
}

/** Dedicated participant video area — separate from Investigation. */
export function ParticipantMediaGrid({
  media,
  livePeople,
  participants,
  pinnedTarget,
  compact = false,
  duringShare = false,
  layout = 'grid',
  canManageParticipants,
  onPin,
  onUnpin,
  onToggleMic,
  onToggleCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  commanderParticipantId,
  canTransferCommand = false,
  onTransferCommand,
}: ParticipantMediaGridProps) {
  const roster = buildMediaRoster(livePeople, participants, media, commanderParticipantId);
  if (!media.joined || roster.length === 0) return null;

  const tileCommandProps = {
    commanderParticipantId,
    canTransferCommand,
    onTransferCommand,
  };

  const pinnedParticipant =
    pinnedTarget?.kind === 'participant'
      ? roster.find((p) => p.id === pinnedTarget.id)
      : null;

  const primary =
    pinnedParticipant ??
    roster.find((p) => p.sharing) ??
    roster.find((p) => p.speaking) ??
    roster.find((p) => p.camera) ??
    roster[0];

  const thumbnails = roster.filter((p) => p.id !== primary?.id);
  const gridMin = duringShare ? 100 : compact ? 112 : 132;

  if (layout === 'rail') {
    return (
      <Stack gap={6} px="sm" py={8} style={{ minHeight: 0, overflowY: 'auto' }}>
        {roster.map((person) => (
          <ParticipantTile
            key={person.id}
            person={person}
            size="rail"
            pinned={pinnedTarget?.kind === 'participant' && pinnedTarget.id === person.id}
            canManage={canManageParticipants && !person.isLocal}
            onPin={() => onPin(person.id)}
            onUnpin={onUnpin}
            onToggleMic={() => onToggleMic(person.id)}
            onToggleCamera={() => onToggleCamera(person.id)}
            onRemove={() => onRemove(person.id)}
            onSetRole={(role) => onSetRole(person.id, role)}
            onViewDetails={() => onViewDetails(person.id)}
            {...tileCommandProps}
          />
        ))}
      </Stack>
    );
  }

  if (duringShare) {
    return (
      <Stack
        gap={6}
        px="md"
        py={8}
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--monosuite-color-chrome-border)',
          background: 'var(--monosuite-color-chrome-raised)',
          maxHeight: 240,
          overflowY: 'auto',
        }}
      >
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Live participants
        </Text>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridMin}px, 1fr))`,
            gap: 6,
          }}
        >
          {roster.map((person) => (
            <ParticipantTile
              key={person.id}
              person={person}
              size="thumb"
              pinned={pinnedTarget?.kind === 'participant' && pinnedTarget.id === person.id}
              canManage={canManageParticipants && !person.isLocal}
              onPin={() => onPin(person.id)}
              onUnpin={onUnpin}
              onToggleMic={() => onToggleMic(person.id)}
              onToggleCamera={() => onToggleCamera(person.id)}
              onRemove={() => onRemove(person.id)}
              onSetRole={(role) => onSetRole(person.id, role)}
              onViewDetails={() => onViewDetails(person.id)}
              {...tileCommandProps}
            />
          ))}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap={compact ? 6 : 8} px="md" py={compact ? 6 : 10}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Live participants
        </Text>
        {pinnedParticipant && (
          <Text size="xs" c="teal" fw={600}>
            Pinned · {pinnedParticipant.name.split(' ')[0]}
          </Text>
        )}
      </Group>

      {roster.length > 0 && (
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridMin}px, 1fr))`,
            gap: 6,
          }}
        >
          {primary && (
            <Box style={{ gridColumn: '1 / -1' }}>
              <ParticipantTile
                person={primary}
                size="primary"
                pinned={pinnedTarget?.kind === 'participant' && pinnedTarget.id === primary.id}
                canManage={canManageParticipants && !primary.isLocal}
                onPin={() => onPin(primary.id)}
                onUnpin={onUnpin}
                onToggleMic={() => onToggleMic(primary.id)}
                onToggleCamera={() => onToggleCamera(primary.id)}
                onRemove={() => onRemove(primary.id)}
                onSetRole={(role) => onSetRole(primary.id, role)}
                onViewDetails={() => onViewDetails(primary.id)}
                {...tileCommandProps}
              />
            </Box>
          )}

          {thumbnails.map((person) => (
            <ParticipantTile
              key={person.id}
              person={person}
              size="thumb"
              pinned={pinnedTarget?.kind === 'participant' && pinnedTarget.id === person.id}
              canManage={canManageParticipants && !person.isLocal}
              onPin={() => onPin(person.id)}
              onUnpin={onUnpin}
              onToggleMic={() => onToggleMic(person.id)}
              onToggleCamera={() => onToggleCamera(person.id)}
              onRemove={() => onRemove(person.id)}
              onSetRole={(role) => onSetRole(person.id, role)}
              onViewDetails={() => onViewDetails(person.id)}
              {...tileCommandProps}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}

/** Single participant video tile — used in grid, stage, and rail layouts. */
export function ParticipantTile({
  person,
  size,
  pinned,
  canManage,
  onPin,
  onUnpin,
  onToggleMic,
  onToggleCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  commanderParticipantId,
  canTransferCommand = false,
  onTransferCommand,
}: {
  person: MediaParticipant;
  size: 'primary' | 'thumb' | 'stage' | 'rail' | 'featured';
  pinned: boolean;
  canManage: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onRemove: () => void;
  onSetRole: (role: string) => void;
  onViewDetails: () => void;
  commanderParticipantId: string;
  canTransferCommand?: boolean;
  onTransferCommand?: () => void;
}) {
  const w = '100%';
  const h =
    size === 'stage'
      ? '100%'
      : size === 'featured'
        ? 132
        : size === 'rail'
          ? 76
          : size === 'primary'
            ? 156
            : 88;
  const isLarge = size === 'primary' || size === 'stage' || size === 'featured';

  return (
    <Box
      data-testid={`participant-media-${person.id}`}
      className="monosuite-collab-participant-tile"
      data-speaking={person.speaking ? 'true' : 'false'}
      data-pinned={pinned ? 'true' : 'false'}
      style={{
        width: w,
        height: h,
        minHeight: size === 'stage' ? 120 : undefined,
        position: 'relative',
        borderRadius: 'var(--mantine-radius-sm)',
        overflow: 'hidden',
        background: 'var(--monosuite-color-chrome-raised)',
        border: person.speaking
          ? '2px solid var(--mantine-color-teal-filled)'
          : pinned
            ? '2px solid color-mix(in srgb, var(--mantine-color-accent-filled) 70%, transparent)'
            : '1px solid var(--monosuite-color-chrome-border)',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: person.camera
            ? 'linear-gradient(145deg, color-mix(in srgb, var(--mantine-color-teal-filled) 14%, transparent), var(--monosuite-color-chrome-raised))'
            : 'var(--monosuite-color-chrome-raised)',
        }}
      >
        {person.camera ? (
          <ThemeIcon size={isLarge ? 40 : 28} radius="xl" color={person.color} variant="light">
            <IconVideo size={isLarge ? 20 : 14} />
          </ThemeIcon>
        ) : (
          <Avatar size={isLarge ? 'md' : 'sm'} radius="xl" color={person.color}>
            {person.initials}
          </Avatar>
        )}
      </Box>

      <Group
        justify="space-between"
        align="flex-start"
        wrap="nowrap"
        px={6}
        py={4}
        style={{ position: 'absolute', inset: '0 0 auto 0', zIndex: 2 }}
      >
        <Group gap={4} wrap="wrap" style={{ minWidth: 0 }}>
          {person.sharing && (
            <Badge size="xs" color="teal" variant="filled" leftSection={<IconScreenShare size={10} />}>
              Sharing
            </Badge>
          )}
          {person.speaking && (
            <Badge size="xs" color="success" variant="light">
              Speaking
            </Badge>
          )}
          {person.connection === 'poor' && (
            <Badge size="xs" color="warning" variant="light" leftSection={<IconWifiOff size={10} />}>
              Poor
            </Badge>
          )}
        </Group>

        <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Tooltip label={pinned ? 'Unpin' : 'Pin participant'}>
            <ActionIcon
              size="xs"
              variant="transparent"
              aria-label={pinned ? 'Unpin participant' : 'Pin participant'}
              aria-pressed={pinned}
              onClick={pinned ? onUnpin : onPin}
              styles={{
                root: {
                  color: pinned
                    ? 'var(--mantine-color-accent-filled)'
                    : 'var(--monosuite-color-chrome-text-muted)',
                  '&:hover': {
                    background:
                      'color-mix(in srgb, var(--monosuite-color-chrome-text) 10%, transparent)',
                    color: pinned
                      ? 'var(--mantine-color-accent-filled)'
                      : 'var(--monosuite-color-chrome-text)',
                  },
                },
              }}
            >
              {pinned ? <IconPinFilled size={12} /> : <IconPin size={12} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Group
        gap={6}
        px={8}
        py={4}
        wrap="nowrap"
        justify="space-between"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          background: 'color-mix(in srgb, var(--monosuite-color-chrome) 88%, transparent)',
        }}
      >
        <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
          <Text size="xs" fw={700} lineClamp={1} c="var(--monosuite-color-chrome-text)">
            {person.isLocal ? 'You' : person.name.split(' ')[0]}
          </Text>
          {(size === 'primary' || size === 'stage' || size === 'featured') && (
            <Text
              size="10px"
              c={`var(--mantine-color-${roomRoleColor(person.role)}-filled)`}
              fw={600}
              style={{ whiteSpace: 'nowrap' }}
            >
              {person.role}
            </Text>
          )}
        </Stack>
        <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
          {canManage ? (
            <>
              <ChromeMediaToggle
                active={person.mic}
                label={person.mic ? 'Mute participant' : 'Unmute participant'}
                ariaLabel={person.mic ? `Mute ${person.name}` : `Unmute ${person.name}`}
                onClick={onToggleMic}
                activeIcon={<IconMicrophone size={12} />}
                offIcon={<IconMicrophoneOff size={12} />}
              />
              <ChromeMediaToggle
                active={person.camera}
                label={person.camera ? 'Turn camera off' : 'Turn camera on'}
                ariaLabel={
                  person.camera
                    ? `Turn off camera for ${person.name}`
                    : `Turn on camera for ${person.name}`
                }
                onClick={onToggleCamera}
                activeIcon={<IconVideo size={12} />}
                offIcon={<IconVideoOff size={12} />}
              />
              {isLarge && (
                <ParticipantMoreMenu
                  participantId={person.id}
                  name={person.name}
                  assignableRole={person.assignableRole}
                  commanderParticipantId={commanderParticipantId}
                  canTransferCommand={canTransferCommand}
                  onViewDetails={onViewDetails}
                  onPin={onPin}
                  onSetRole={onSetRole}
                  onRemove={onRemove}
                  onTransferCommand={onTransferCommand}
                />
              )}
            </>
          ) : (
            <>
              {person.mic ? (
                <IconMicrophone size={12} color="var(--monosuite-color-chrome-text)" />
              ) : (
                <IconMicrophoneOff size={12} color="var(--mantine-color-warning-filled)" />
              )}
              {person.camera ? (
                <IconVideo size={12} color="var(--monosuite-color-chrome-text)" />
              ) : (
                <IconVideoOff size={12} color="var(--mantine-color-warning-filled)" />
              )}
            </>
          )}
        </Group>
      </Group>

      {!person.camera && isLarge && (
        <Text
          size="xs"
          c="var(--monosuite-color-chrome-text-muted)"
          ta="center"
          style={{ position: 'absolute', top: '50%', marginTop: 20, width: '100%', zIndex: 1 }}
        >
          Camera off
        </Text>
      )}
    </Box>
  );
}

/** Icon-only media toggle — no border/background; off state uses warning icon color. */
function ChromeMediaToggle({
  active,
  label,
  ariaLabel,
  onClick,
  activeIcon,
  offIcon,
}: {
  active: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  activeIcon: ReactNode;
  offIcon: ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <ActionIcon
        size="xs"
        variant="transparent"
        aria-label={ariaLabel}
        aria-pressed={active}
        onClick={onClick}
        styles={{
          root: {
            color: active
              ? 'var(--monosuite-color-chrome-text)'
              : 'var(--mantine-color-warning-filled)',
            '&:hover': {
              background:
                'color-mix(in srgb, var(--monosuite-color-chrome-text) 10%, transparent)',
            },
          },
        }}
      >
        {active ? activeIcon : offIcon}
      </ActionIcon>
    </Tooltip>
  );
}

/** Role / remove actions — primary tile only; mic/camera toggles sit inline with the name. */
function ParticipantMoreMenu({
  participantId,
  name,
  assignableRole,
  commanderParticipantId,
  canTransferCommand = false,
  onViewDetails,
  onPin,
  onSetRole,
  onRemove,
  onTransferCommand,
}: {
  participantId: string;
  name: string;
  assignableRole: string;
  commanderParticipantId: string;
  canTransferCommand?: boolean;
  onViewDetails: () => void;
  onPin: () => void;
  onSetRole: (role: string) => void;
  onRemove: () => void;
  onTransferCommand?: () => void;
}) {
  const isCommander = isRoomCommander(participantId, commanderParticipantId);

  return (
    <Menu shadow="md" width={200} position="top-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          size="xs"
          variant="transparent"
          aria-label={`More actions for ${name}`}
          styles={{
            root: {
              color: 'var(--monosuite-color-chrome-text-muted)',
              '&:hover': {
                background:
                  'color-mix(in srgb, var(--monosuite-color-chrome-text) 10%, transparent)',
                color: 'var(--monosuite-color-chrome-text)',
              },
            },
          }}
        >
          <IconDots size={12} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconUser size={14} />} onClick={onViewDetails}>
          View details
        </Menu.Item>
        <Menu.Item leftSection={<IconPin size={14} />} onClick={onPin}>
          Pin video
        </Menu.Item>
        <Menu.Divider />
        <Menu.Label>Role</Menu.Label>
        {ASSIGNABLE_ROOM_ROLES.map((r) => (
          <Menu.Item
            key={r.value}
            onClick={() => onSetRole(r.value)}
            disabled={assignableRole === r.value}
            leftSection={
              <Box
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: `var(--mantine-color-${roomRoleColor(r.value)}-filled)`,
                }}
              />
            }
          >
            {r.label}
          </Menu.Item>
        ))}
        {isCommander && canTransferCommand && onTransferCommand ? (
          <>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconArrowsExchange size={14} />}
              onClick={onTransferCommand}
            >
              Transfer command
            </Menu.Item>
          </>
        ) : null}
        <Menu.Divider />
        <Menu.Item
          color="danger"
          leftSection={<IconUserOff size={14} />}
          onClick={onRemove}
          disabled={isCommander}
        >
          Remove participant
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
