import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowsExchange,
  IconActivity,
  IconDots,
  IconMessage,
  IconMicrophone,
  IconMicrophoneOff,
  IconPaperclip,
  IconShield,
  IconUser,
  IconUserOff,
  IconUserPlus,
  IconUsers,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import { CURRENT_USER } from '../../../shared/constants';
import {
  ASSIGNABLE_ROOM_ROLES,
  participantRoleLabel,
  isRoomCommander,
  roomRoleColor,
  type ContextTab,
  type EvidenceItem,
  type HistoryEntry,
  type Participant,
} from '../data';
import type { MediaState } from '../hooks/useRoomState';
import { ChatPanel } from './ChatPanel';
import { HistoryPanel } from './HistoryPanel';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';

interface ContextSidebarProps {
  tab: ContextTab;
  onTabChange: (tab: ContextTab) => void;
  history: HistoryEntry[];
  onInvite: () => void;
  onOpenEvidence: () => void;
  evidence: EvidenceItem[];
  collapsed?: boolean;
  onExpand?: () => void;
  participants: Participant[];
  media: MediaState;
  canManageParticipants: boolean;
  onMuteParticipant: (id: string) => void;
  onDisableCamera: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onSetRole: (id: string, role: string) => void;
  onViewDetails: (id: string) => void;
  onPinParticipant?: (id: string) => void;
  onToggleCollapse?: () => void;
  commanderParticipantId: string;
  canTransferCommand?: boolean;
  onTransferCommand?: () => void;
}

const RAIL_TABS: { value: ContextTab; label: string; icon: typeof IconUsers }[] = [
  { value: 'participants', label: 'Participants', icon: IconUsers },
  { value: 'chat', label: 'Chat', icon: IconMessage },
  { value: 'activity', label: 'Activity', icon: IconActivity },
];

export function ContextSidebar({
  tab,
  onTabChange,
  history,
  onInvite,
  onOpenEvidence,
  evidence,
  collapsed = false,
  participants,
  media,
  canManageParticipants,
  onMuteParticipant,
  onDisableCamera,
  onRemoveParticipant,
  onSetRole,
  onViewDetails,
  onPinParticipant,
  onToggleCollapse,
  commanderParticipantId,
  canTransferCommand = false,
  onTransferCommand,
}: ContextSidebarProps) {
  const activeTabMeta = RAIL_TABS.find((item) => item.value === tab);

  if (collapsed) {
    return (
      <Stack gap={0} className="monosuite-context-rail-inner">
        <Box className="monosuite-context-rail-accent" aria-hidden />
        <UnstyledButton
          className="monosuite-collapsed-rail-label monosuite-collapsed-rail-label--end"
          onClick={onToggleCollapse}
          aria-label="Expand collaboration panel"
        >
          <span className="monosuite-collapsed-rail-label-text">Collaboration</span>
        </UnstyledButton>
      </Stack>
    );
  }

  return (
    <Stack gap={0} className="monosuite-context-rail-inner">
      <Box className="monosuite-context-rail-accent" aria-hidden />
      <ContextRailHeader
        label={activeTabMeta?.label ?? 'Participants'}
        evidenceCount={evidence.length}
        onOpenEvidence={onOpenEvidence}
      />

      <Tabs
        value={tab}
        onChange={(v) => v && onTabChange(v as ContextTab)}
        className="monosuite-room-tabs-fill monosuite-context-rail-tabs"
        style={{ flex: 1, minHeight: 0, height: '100%' }}
      >
        <Tabs.List grow px="xs" style={{ flexShrink: 0 }}>
          <Tabs.Tab value="participants">Participants</Tabs.Tab>
          <Tabs.Tab value="chat">Chat</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
        </Tabs.List>

        <Box className="monosuite-room-tabs-body">
          <Tabs.Panel value="participants" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <ParticipantsPanel
                  participants={participants}
                  media={media}
                  canManage={canManageParticipants}
                  commanderParticipantId={commanderParticipantId}
                  canTransferCommand={canTransferCommand}
                  onInvite={onInvite}
                  onMute={onMuteParticipant}
                  onDisableCamera={onDisableCamera}
                  onRemove={onRemoveParticipant}
                  onSetRole={onSetRole}
                  onViewDetails={onViewDetails}
                  onPin={onPinParticipant}
                  onTransferCommand={onTransferCommand}
                />
              </Box>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="chat" className="monosuite-context-tab-panel">
            <ChatPanel />
          </Tabs.Panel>

          <Tabs.Panel value="activity" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <HistoryPanel items={history} />
              </Box>
            </ScrollArea>
          </Tabs.Panel>
        </Box>
      </Tabs>

    </Stack>
  );
}

function ContextRailHeader({
  label,
  evidenceCount,
  onOpenEvidence,
}: {
  label: string;
  evidenceCount: number;
  onOpenEvidence: () => void;
}) {
  return (
    <Group gap={8} wrap="nowrap" px="sm" py={8} style={{ flexShrink: 0 }}>
      <Box
        style={{
          width: 26,
          height: 26,
          borderRadius: 'var(--mantine-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'color-mix(in srgb, var(--mantine-color-teal-filled) 12%, var(--monosuite-color-surface-sunken))',
          border: '1px solid var(--monosuite-color-border)',
          flexShrink: 0,
        }}
      >
        <IconShield size={14} color="var(--mantine-color-teal-filled)" aria-hidden />
      </Box>
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
          Room collaboration
        </Text>
        <TruncatedTooltipText size="xs" fw={700} tooltip={label}>
          {label}
        </TruncatedTooltipText>
      </Stack>
      <Tooltip label={`Open evidence · ${evidenceCount}`} withArrow>
        <Button
          size="compact-xs"
          variant="light"
          color="accent"
          leftSection={<IconPaperclip size={12} />}
          onClick={onOpenEvidence}
          aria-label={`Open evidence (${evidenceCount})`}
          style={{ flexShrink: 0 }}
        >
          {evidenceCount}
        </Button>
      </Tooltip>
    </Group>
  );
}

function ParticipantsPanel({
  participants,
  media,
  canManage,
  commanderParticipantId,
  canTransferCommand,
  onInvite,
  onMute,
  onDisableCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  onPin,
  onTransferCommand,
}: {
  participants: Participant[];
  media: MediaState;
  canManage: boolean;
  commanderParticipantId: string;
  canTransferCommand: boolean;
  onInvite: () => void;
  onMute: (id: string) => void;
  onDisableCamera: (id: string) => void;
  onRemove: (id: string) => void;
  onSetRole: (id: string, role: string) => void;
  onViewDetails: (id: string) => void;
  onPin?: (id: string) => void;
  onTransferCommand?: () => void;
}) {
  return (
    <Stack gap="sm" pl={2}>
      <Text fw={700} size="sm">
        Participants{' '}
        <Text span c="dimmed" fw={400}>
          · {participants.length + 1}
        </Text>
      </Text>

      <Stack gap={6}>
        <ParticipantRow
          participantId={CURRENT_USER.id}
          name={CURRENT_USER.name}
          initials={CURRENT_USER.initials}
          role={CURRENT_USER.roomRole}
          commanderParticipantId={commanderParticipantId}
          status="online"
          color="brand"
          mic={media.mic && !media.mutedByModerator}
          camera={media.camera}
          isLocal
          canManage={false}
          canTransferCommand={canTransferCommand}
          onTransferCommand={onTransferCommand}
        />
        {participants.map((p) => (
          <ParticipantRow
            key={p.id}
            participantId={p.id}
            name={p.name}
            initials={p.initials}
            role={p.role}
            commanderParticipantId={commanderParticipantId}
            status={p.status}
            color={p.color}
            mic={p.mic}
            camera={p.camera}
            speaking={media.speakingId === p.id}
            typing={p.typing}
            canManage={canManage}
            canTransferCommand={canTransferCommand}
            onMute={() => onMute(p.id)}
            onDisableCamera={() => onDisableCamera(p.id)}
            onRemove={() => onRemove(p.id)}
            onSetRole={(role) => onSetRole(p.id, role)}
            onViewDetails={() => onViewDetails(p.id)}
            onPin={onPin ? () => onPin(p.id) : undefined}
            onTransferCommand={onTransferCommand}
          />
        ))}
      </Stack>

      <Button
        size="xs"
        variant="subtle"
        leftSection={<IconUserPlus size={14} />}
        onClick={onInvite}
      >
        Invite participant
      </Button>
    </Stack>
  );
}

function ParticipantRow({
  participantId,
  name,
  initials,
  role,
  commanderParticipantId,
  status,
  color,
  mic,
  camera,
  speaking,
  typing,
  isLocal,
  canManage,
  canTransferCommand,
  onMute,
  onDisableCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  onPin,
  onTransferCommand,
}: {
  participantId: string;
  name: string;
  initials: string;
  role: string;
  commanderParticipantId: string;
  status: 'online' | 'away';
  color: string;
  mic: boolean;
  camera: boolean;
  speaking?: boolean;
  typing?: boolean;
  isLocal?: boolean;
  canManage: boolean;
  canTransferCommand?: boolean;
  onMute?: () => void;
  onDisableCamera?: () => void;
  onRemove?: () => void;
  onSetRole?: (role: string) => void;
  onViewDetails?: () => void;
  onPin?: () => void;
  onTransferCommand?: () => void;
}) {
  const isCommander = isRoomCommander(participantId, commanderParticipantId);
  const displayRole = participantRoleLabel(participantId, role, commanderParticipantId);
  return (
    <Group
      gap="sm"
      wrap="nowrap"
      align="center"
      py={6}
      className="monosuite-context-participant-row"
      style={{ minWidth: 0 }}
    >
      <ParticipantAvatar
        initials={initials}
        color={color}
        status={status}
        speaking={speaking}
        name={name}
      />
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
          <TruncatedTooltipText
            size="sm"
            fw={600}
            style={{ flex: 1, minWidth: 0 }}
            tooltip={`${name}${isLocal ? ' · You' : ''}`}
          >
            {name}
            {isLocal ? ' · You' : ''}
          </TruncatedTooltipText>
          {speaking && (
            <Badge size="xs" color="success" variant="light" style={{ flexShrink: 0 }}>
              Speaking
            </Badge>
          )}
        </Group>
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <Badge size="xs" variant="light" color={roomRoleColor(displayRole)} style={{ flexShrink: 0 }}>
            {displayRole}
          </Badge>
          {displayRole === 'Guest' ? (
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              view only
            </Text>
          ) : null}
          {typing && !speaking ? (
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              typing…
            </Text>
          ) : null}
        </Group>
      </Stack>

      <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
        {canManage && (
          <>
            <Tooltip label={mic ? 'Mute participant' : 'Unmute participant'}>
              <ActionIcon
                variant={mic ? 'subtle' : 'light'}
                color={mic ? 'neutral' : 'warning'}
                size="sm"
                aria-label={mic ? `Mute ${name}` : `Unmute ${name}`}
                aria-pressed={mic}
                onClick={onMute}
              >
                {mic ? <IconMicrophone size={14} /> : <IconMicrophoneOff size={14} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label={camera ? 'Turn camera off' : 'Turn camera on'}>
              <ActionIcon
                variant={camera ? 'subtle' : 'light'}
                color={camera ? 'neutral' : 'warning'}
                size="sm"
                aria-label={camera ? `Turn off camera for ${name}` : `Turn on camera for ${name}`}
                aria-pressed={camera}
                onClick={onDisableCamera}
              >
                {camera ? <IconVideo size={14} /> : <IconVideoOff size={14} />}
              </ActionIcon>
            </Tooltip>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="neutral"
                  size="sm"
                  aria-label={`More actions for ${name}`}
                >
                  <IconDots size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={onViewDetails}>
                  View details
                </Menu.Item>
                {onPin && (
                  <Menu.Item leftSection={<IconVideo size={14} />} onClick={onPin}>
                    Pin video
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Label>Role</Menu.Label>
                {ASSIGNABLE_ROOM_ROLES.map((r) => (
                  <Menu.Item
                    key={r.value}
                    onClick={() => onSetRole?.(r.value)}
                    disabled={role === r.value}
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
                <Tooltip
                  label={isCommander ? 'Transfer command before removing the commander' : undefined}
                  disabled={!isCommander}
                >
                  <Menu.Item
                    color="danger"
                    leftSection={<IconUserOff size={14} />}
                    onClick={onRemove}
                    disabled={isCommander}
                  >
                    Remove participant
                  </Menu.Item>
                </Tooltip>
              </Menu.Dropdown>
            </Menu>
          </>
        )}
      </Group>
    </Group>
  );
}

function ParticipantAvatar({
  initials,
  color,
  status,
  speaking,
  name,
}: {
  initials: string;
  color: string;
  status: 'online' | 'away';
  speaking?: boolean;
  name: string;
}) {
  const ringColor = speaking
    ? 'var(--mantine-color-teal-filled)'
    : status === 'online'
      ? 'var(--mantine-color-success-filled)'
      : 'var(--mantine-color-warning-filled)';

  const statusLabel = speaking ? 'Speaking' : status === 'online' ? 'Online' : 'Away';
  const avatarSize = 28;
  const ringWidth = 2;

  return (
    <Tooltip label={statusLabel}>
      <Box
        aria-label={`${name} — ${statusLabel}`}
        style={{
          position: 'relative',
          flexShrink: 0,
          width: avatarSize + ringWidth * 2,
          height: avatarSize + ringWidth * 2,
          borderRadius: '50%',
          border: `${ringWidth}px solid ${ringColor}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Avatar size={avatarSize} radius="xl" color={color}>
          {initials}
        </Avatar>
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: ringColor,
            border: '2px solid var(--monosuite-color-surface)',
            boxSizing: 'border-box',
          }}
        />
      </Box>
    </Tooltip>
  );
}
