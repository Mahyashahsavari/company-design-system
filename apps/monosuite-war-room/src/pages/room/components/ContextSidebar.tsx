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
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { useRef, type ReactNode } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDatabase,
  IconDeviceDesktop,
  IconDots,
  IconHistory,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconList,
  IconMessage,
  IconMicrophone,
  IconMicrophoneOff,
  IconPaperclip,
  IconServer,
  IconShield,
  IconUser,
  IconUserOff,
  IconUserPlus,
  IconUsers,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import { CURRENT_USER } from '../../../shared/constants';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';
import {
  ASSETS,
  ROOM_ROLES,
  SEVERITY_COLOR,
  type ContextTab,
  type EvidenceItem,
  type EvidenceKind,
  type HistoryEntry,
  type Participant,
} from '../data';
import type { MediaState } from '../hooks/useRoomState';
import { ChatPanel } from './ChatPanel';
import { EvidencePanel } from './EvidencePanel';
import { HistoryPanel } from './HistoryPanel';

interface ContextSidebarProps {
  tab: ContextTab;
  onTabChange: (tab: ContextTab) => void;
  history: HistoryEntry[];
  onInvite: () => void;
  onAddEvidence: (kind?: EvidenceKind) => void;
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
}

const ASSET_ICONS = {
  server: IconServer,
  database: IconDatabase,
  desktop: IconDeviceDesktop,
} as const;

const RAIL_TABS: { value: ContextTab; label: string; icon: typeof IconUsers }[] = [
  { value: 'participants', label: 'Participants', icon: IconUsers },
  { value: 'chat', label: 'Chat', icon: IconMessage },
  { value: 'assets', label: 'Assets', icon: IconServer },
  { value: 'evidence', label: 'Evidence', icon: IconPaperclip },
  { value: 'history', label: 'History', icon: IconHistory },
];

export function ContextSidebar({
  tab,
  onTabChange,
  history,
  onInvite,
  onAddEvidence,
  evidence,
  collapsed = false,
  onExpand,
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
}: ContextSidebarProps) {
  const activeTabMeta = RAIL_TABS.find((item) => item.value === tab);

  if (collapsed) {
    return (
      <Stack gap={0} className="monosuite-context-rail-inner">
        <Box className="monosuite-context-rail-accent" aria-hidden />
        <Stack gap={6} align="center" py="sm" px={4} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {RAIL_TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <Tooltip key={item.value} label={item.label} position="left" withArrow>
                <ActionIcon
                  variant={active ? 'light' : 'subtle'}
                  color={active ? 'teal' : 'neutral'}
                  size="lg"
                  aria-label={item.label}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    onTabChange(item.value);
                    onExpand?.();
                  }}
                  style={
                    active
                      ? {
                          border: '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 35%, transparent)',
                        }
                      : undefined
                  }
                >
                  <Icon size={18} />
                </ActionIcon>
              </Tooltip>
            );
          })}
        </Stack>
        <ContextRailFooter collapsed onToggle={onToggleCollapse} />
      </Stack>
    );
  }

  return (
    <Stack gap={0} className="monosuite-context-rail-inner">
      <Box className="monosuite-context-rail-accent" aria-hidden />
      <ContextRailHeader label={activeTabMeta?.label ?? 'Operations'} />

      <Tabs
        value={tab}
        onChange={(v) => v && onTabChange(v as ContextTab)}
        className="monosuite-room-tabs-fill monosuite-context-rail-tabs"
        style={{ flex: 1, minHeight: 0, height: '100%' }}
      >
        <ScrollableTabList>
          <Tabs.Tab value="participants">Participants</Tabs.Tab>
          <Tabs.Tab value="chat">Chat</Tabs.Tab>
          <Tabs.Tab value="assets">Assets</Tabs.Tab>
          <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </ScrollableTabList>

        <Box className="monosuite-room-tabs-body">
          <Tabs.Panel value="participants" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <ParticipantsPanel
                  participants={participants}
                  media={media}
                  canManage={canManageParticipants}
                  onInvite={onInvite}
                  onMute={onMuteParticipant}
                  onDisableCamera={onDisableCamera}
                  onRemove={onRemoveParticipant}
                  onSetRole={onSetRole}
                  onViewDetails={onViewDetails}
                  onPin={onPinParticipant}
                />
              </Box>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="chat" className="monosuite-context-tab-panel">
            <ChatPanel />
          </Tabs.Panel>

          <Tabs.Panel value="assets" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <Stack gap="sm">
                  <Text fw={700} size="sm">
                    Affected Assets{' '}
                    <Text span c="dimmed" fw={400}>
                      · {ASSETS.length}
                    </Text>
                  </Text>
                  {ASSETS.map((a) => {
                    const Icon = ASSET_ICONS[a.icon];
                    return (
                      <Group
                        key={a.id}
                        gap="sm"
                        p="sm"
                        wrap="nowrap"
                        style={{
                          borderRadius: 'var(--mantine-radius-sm)',
                          background: 'var(--monosuite-color-surface-sunken)',
                        }}
                      >
                        <ThemeIcon variant="light" color="neutral" size="lg">
                          <Icon size={16} />
                        </ThemeIcon>
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <TruncatedTooltipText size="sm" fw={600} tooltip={a.name}>
                            {a.name}
                          </TruncatedTooltipText>
                          <TruncatedTooltipText size="xs" c="dimmed" tooltip={a.type}>
                            {a.type}
                          </TruncatedTooltipText>
                          <TruncatedTooltipText size="xs" c="dimmed" tooltip={a.ip}>
                            {a.ip}
                          </TruncatedTooltipText>
                        </Stack>
                        <Badge size="sm" color={SEVERITY_COLOR[a.severity]}>
                          {a.severity}
                        </Badge>
                      </Group>
                    );
                  })}
                  <Button size="xs" variant="subtle" leftSection={<IconList size={14} />}>
                    View all assets
                  </Button>
                </Stack>
              </Box>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="evidence" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <EvidencePanel items={evidence} onAdd={onAddEvidence} />
              </Box>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="history" className="monosuite-context-tab-panel">
            <ScrollArea h="100%" type="auto">
              <Box px="md" py="sm">
                <HistoryPanel items={history} />
              </Box>
            </ScrollArea>
          </Tabs.Panel>
        </Box>
      </Tabs>

      <ContextRailFooter collapsed={false} onToggle={onToggleCollapse} />
    </Stack>
  );
}

function ContextRailHeader({ label }: { label: string }) {
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
          background: 'color-mix(in srgb, var(--mantine-color-teal-filled) 12%, var(--monosuite-color-surface-sunken))',
          border: '1px solid var(--monosuite-color-border)',
          flexShrink: 0,
        }}
      >
        <IconShield size={14} color="var(--mantine-color-teal-filled)" aria-hidden />
      </Box>
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
          Room utility
        </Text>
        <TruncatedTooltipText size="xs" fw={700} tooltip={label}>
          {label}
        </TruncatedTooltipText>
      </Stack>
    </Group>
  );
}

function ContextRailFooter({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle?: () => void;
}) {
  if (!onToggle) return null;

  return (
    <Box className="monosuite-context-rail-footer" px={collapsed ? 4 : 'sm'} py={6}>
      <Tooltip
        label={collapsed ? 'Expand utility panel' : 'Collapse utility panel'}
        position="left"
        withArrow
      >
        <Button
          fullWidth={!collapsed}
          variant="subtle"
          color="neutral"
          size="compact-xs"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand utility panel' : 'Collapse utility panel'}
          aria-expanded={!collapsed}
          leftSection={
            collapsed ? undefined : (
              <IconLayoutSidebarRightCollapse size={14} aria-hidden />
            )
          }
          style={collapsed ? { padding: 0, width: 36, height: 32, margin: '0 auto' } : undefined}
        >
          {collapsed ? <IconLayoutSidebarRightExpand size={16} aria-hidden /> : 'Collapse panel'}
        </Button>
      </Tooltip>
    </Box>
  );
}

function ScrollableTabList({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: direction * 72, behavior: 'smooth' });
  };

  return (
    <Group gap={2} wrap="nowrap" px={4} pt={6} pb={4} align="center" style={{ flexShrink: 0, borderBottom: '1px solid var(--monosuite-color-border)' }}>
      <ActionIcon
        variant="subtle"
        color="neutral"
        size="sm"
        aria-label="Scroll tabs left"
        onClick={() => scroll(-1)}
      >
        <IconChevronLeft size={14} />
      </ActionIcon>
      <Box
        ref={scrollRef}
        className="monosuite-hide-scrollbar-x"
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        <Tabs.List
          style={{
            flexWrap: 'nowrap',
            width: 'max-content',
            minWidth: '100%',
          }}
        >
          {children}
        </Tabs.List>
      </Box>
      <ActionIcon
        variant="subtle"
        color="neutral"
        size="sm"
        aria-label="Scroll tabs right"
        onClick={() => scroll(1)}
      >
        <IconChevronRight size={14} />
      </ActionIcon>
    </Group>
  );
}

function ParticipantsPanel({
  participants,
  media,
  canManage,
  onInvite,
  onMute,
  onDisableCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  onPin,
}: {
  participants: Participant[];
  media: MediaState;
  canManage: boolean;
  onInvite: () => void;
  onMute: (id: string) => void;
  onDisableCamera: (id: string) => void;
  onRemove: (id: string) => void;
  onSetRole: (id: string, role: string) => void;
  onViewDetails: (id: string) => void;
  onPin?: (id: string) => void;
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
        <Text size="10px" fw={700} c="teal" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
          My media
        </Text>
        <ParticipantRow
          name={CURRENT_USER.name}
          initials={CURRENT_USER.initials}
          role={CURRENT_USER.role}
          status="online"
          color="brand"
          mic={media.mic && !media.mutedByModerator}
          camera={media.camera}
          isLocal
          canManage={false}
        />
      </Stack>

      <Stack gap={6}>
        <Text size="10px" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
          Remote participants
        </Text>
        {participants.map((p) => (
          <ParticipantRow
            key={p.id}
            name={p.name}
            initials={p.initials}
            role={p.role}
            status={p.status}
            color={p.color}
            mic={p.mic}
            camera={p.camera}
            speaking={media.speakingId === p.id}
            typing={p.typing}
            canManage={canManage}
            onMute={() => onMute(p.id)}
            onDisableCamera={() => onDisableCamera(p.id)}
            onRemove={() => onRemove(p.id)}
            onSetRole={(role) => onSetRole(p.id, role)}
            onViewDetails={() => onViewDetails(p.id)}
            onPin={onPin ? () => onPin(p.id) : undefined}
          />
        ))}
      </Stack>

      <Button size="xs" variant="subtle" leftSection={<IconUserPlus size={14} />} onClick={onInvite}>
        Invite participant
      </Button>
    </Stack>
  );
}

function ParticipantRow({
  name,
  initials,
  role,
  status,
  color,
  mic,
  camera,
  speaking,
  typing,
  isLocal,
  canManage,
  onMute,
  onDisableCamera,
  onRemove,
  onSetRole,
  onViewDetails,
  onPin,
}: {
  name: string;
  initials: string;
  role: string;
  status: 'online' | 'away';
  color: string;
  mic: boolean;
  camera: boolean;
  speaking?: boolean;
  typing?: boolean;
  isLocal?: boolean;
  canManage: boolean;
  onMute?: () => void;
  onDisableCamera?: () => void;
  onRemove?: () => void;
  onSetRole?: (role: string) => void;
  onViewDetails?: () => void;
  onPin?: () => void;
}) {
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
        <TruncatedTooltipText
          size="xs"
          c="dimmed"
          tooltip={`${role}${role === 'Guest' ? ' · view only' : ''}${typing && !speaking ? ' · typing…' : ''}`}
        >
          {role}
          {role === 'Guest' ? ' · view only' : ''}
          {typing && !speaking ? ' · typing…' : ''}
        </TruncatedTooltipText>
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
                <ActionIcon variant="subtle" color="neutral" size="sm" aria-label={`More actions for ${name}`}>
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
                {ROOM_ROLES.map((r) => (
                  <Menu.Item
                    key={r.value}
                    onClick={() => onSetRole?.(r.value)}
                    disabled={role === r.value}
                  >
                    {r.label}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item color="danger" leftSection={<IconUserOff size={14} />} onClick={onRemove}>
                  Remove participant
                </Menu.Item>
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
