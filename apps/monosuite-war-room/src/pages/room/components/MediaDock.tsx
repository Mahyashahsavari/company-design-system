import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Text,
  Tooltip,
  Transition,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
  IconPhoneOff,
  IconRefresh,
  IconScreenShare,
  IconScreenShareOff,
  IconSettings,
  IconShieldLock,
  IconUsers,
  IconVideo,
  IconVideoOff,
  IconVolume,
  IconVolumeOff,
  IconWifiOff,
} from '@tabler/icons-react';
import { CONNECTION_UI, type ConnectionState } from '../data';
import {
  resolveLocalCameraState,
  resolveLocalMicState,
  resolveLocalShareState,
  resolveLocalSpeakerState,
  type MediaState,
} from '../hooks/useRoomState';

interface MediaDockProps {
  media: MediaState;
  participantCount: number;
  onJoin: () => void;
  onLeave?: () => void;
  onToggleMedia: (key: 'mic' | 'camera' | 'speaker') => void;
  onShare: () => void;
  onStopShare: () => void;
  onSettings: () => void;
  onRetry: () => void;
  onMore: (action: string) => void;
  /** Render controls only — parent supplies the chrome shell. */
  embedded?: boolean;
  /** Sidebar / split panel — compact grid, no overlap. */
  density?: 'default' | 'sidebar';
  /** Hide media status / participant count / duration — shown in parent header instead. */
  hideStatusMeta?: boolean;
  /** Replaces status meta on the left of live controls (e.g. compact avatars). */
  leadingSlot?: ReactNode;
  /** Full-width bar (fullscreen collab) — keep media controls centered. */
  centerMediaControls?: boolean;
  /** Force the compact control layout (1366-class desktops). */
  compactLayout?: boolean;
  /** Extra controls after the primary set (e.g. mobile fullscreen). */
  trailingSlot?: ReactNode;
}

type ControlVisual = 'on' | 'off' | 'muted' | 'sharing' | 'warn' | 'danger';

/**
 * Floating Live Room Control Dock.
 * Distinguishes room access from joining the room's media session.
 */
export function MediaDock({
  media,
  participantCount,
  onJoin,
  onLeave,
  onToggleMedia,
  onShare,
  onStopShare,
  onSettings,
  onRetry,
  onMore,
  embedded = false,
  density = 'default',
  hideStatusMeta = false,
  leadingSlot,
  centerMediaControls = false,
  compactLayout = false,
  trailingSlot,
}: MediaDockProps) {
  const compactQuery = useMediaQuery('(max-width: 64em)', false, {
    getInitialValueInEffect: false,
  });
  const compact = compactLayout || compactQuery;
  const soloControls = compact && hideStatusMeta && !leadingSlot;

  const { joined, connection } = media;
  const conn = (joined ? connection : 'idle') as ConnectionState;
  const connUi = conn !== 'idle' ? CONNECTION_UI[conn] : null;

  const mic = micControlMeta(resolveLocalMicState(media));
  const camera = cameraControlMeta(resolveLocalCameraState(media));
  const speaker = speakerControlMeta(resolveLocalSpeakerState(media));
  const share = shareControlMeta(resolveLocalShareState(media), media.remoteShareBy);

  const liveControlProps = {
    mic,
    camera,
    speaker,
    share,
    onToggleMedia,
    onShare,
    onStopShare,
    onSettings,
    onMore,
    onLeave,
    conn,
    connUi,
    onRetry,
  };

  const controls = (
    <Group
      gap={compact ? 'md' : 'lg'}
      wrap="nowrap"
      align="center"
      justify={soloControls ? 'center' : 'space-between'}
      w="100%"
      className={
        centerMediaControls
          ? 'monosuite-media-dock-bar--centered'
          : soloControls
            ? 'monosuite-media-dock-bar--solo'
            : undefined
      }
    >
        {(!hideStatusMeta || (joined && leadingSlot)) ? (
          <Group gap="sm" wrap="nowrap" style={{ flexShrink: hideStatusMeta ? 0 : 1, minWidth: 0 }}>
            {!hideStatusMeta ? (
              <>
                <StatusChip
                  tone="live"
                  label={joined ? 'MEDIA CONNECTED' : 'MEDIA ROOM'}
                  pulsing={joined}
                />
                <MetaItem
                  icon={<IconUsers size={13} stroke={1.75} />}
                  label={`${participantCount} participants`}
                />
              </>
            ) : (
              leadingSlot
            )}
            {!centerMediaControls && <DockDivider />}
          </Group>
        ) : null}

        <Box className="monosuite-media-dock-primary">
        <Transition
          mounted={!joined}
          transition="fade"
          duration={150}
          timingFunction="ease"
        >
          {(styles) => (
            <Button
              style={styles}
              size="sm"
              color="teal"
              radius="xl"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={onJoin}
              data-testid="dock-join"
              aria-label="Join media session"
              styles={{ root: { fontWeight: 700 } }}
            >
              Join media
            </Button>
          )}
        </Transition>

        <Transition
          mounted={joined}
          transition="fade"
          duration={180}
          timingFunction="ease"
        >
          {(styles) => (
            <Group gap={compact ? 4 : 'sm'} wrap="nowrap" data-testid="dock-live-controls" style={{ ...styles, minWidth: 0 }}>
              <DockControl
                testId="dock-mic"
                label="Microphone"
                stateLabel={mic.stateLabel}
                visual={mic.visual}
                disabled={mic.disabled}
                pressed={mic.pressed}
                onClick={() => onToggleMedia('mic')}
                icon={mic.icon}
              />
              <DockControl
                testId="dock-camera"
                label="Camera"
                stateLabel={camera.stateLabel}
                visual={camera.visual}
                disabled={camera.disabled}
                pressed={camera.pressed}
                onClick={() => onToggleMedia('camera')}
                icon={camera.icon}
              />
              <DockControl
                testId="dock-speaker"
                label="Speaker"
                stateLabel={speaker.stateLabel}
                visual={speaker.visual}
                disabled={speaker.disabled}
                pressed={speaker.pressed}
                onClick={() => onToggleMedia('speaker')}
                icon={speaker.icon}
              />

              {compact ? null : <DockDivider />}

              <DockControl
                testId="dock-share"
                label="Screen Share"
                stateLabel={share.stateLabel}
                visual={share.visual}
                disabled={share.disabled}
                pressed={share.pressed}
                onClick={share.pressed ? onStopShare : onShare}
                icon={share.icon}
              />
              {media.share && !centerMediaControls && !compact && (
                <Button
                  size="xs"
                  color="danger"
                  variant="light"
                  leftSection={<IconScreenShareOff size={14} />}
                  onClick={onStopShare}
                  data-testid="dock-stop-sharing"
                  aria-label="Stop sharing your screen"
                >
                  Stop Sharing
                </Button>
              )}

              {media.share && !compact && !centerMediaControls && (
                <Group gap={6} wrap="nowrap" data-testid="dock-share-viewers">
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
                  <Text
                    size="xs"
                    c="var(--monosuite-color-chrome-text-muted)"
                    fw={600}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {participantCount} participants can see your screen
                  </Text>
                </Group>
              )}

              {!compact && <DockDivider />}

              <DockControl
                testId="dock-settings"
                label="Media Settings"
                stateLabel="Open"
                visual="off"
                pressed={false}
                onClick={onSettings}
                icon={<IconSettings size={18} stroke={1.75} />}
              />
              {trailingSlot}

              <Menu shadow="md" width={220} position="top" withinPortal>
                <Menu.Target>
                  <Tooltip label="More" withArrow position="top">
                    <ActionIcon
                      variant="subtle"
                      color="neutral"
                      size={36}
                      radius="md"
                      aria-label="More"
                      data-testid="dock-more"
                      styles={{
                        root: {
                          color: 'var(--monosuite-color-chrome-text-muted)',
                          border: '1px solid transparent',
                        },
                      }}
                    >
                      <IconDots size={18} stroke={1.75} />
                    </ActionIcon>
                  </Tooltip>
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
                <Menu.Item
                  leftSection={<IconShieldLock size={14} />}
                  onClick={() => onMore('simulate-moderator-mute')}
                >
                  Simulate moderator mute
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconScreenShare size={14} />}
                  onClick={() => onMore('simulate-mike-share')}
                >
                  Simulate Mike sharing
                </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              {onLeave ? (
                <Tooltip label="Leave live communication" withArrow position="top">
                  <ActionIcon
                    variant="filled"
                    color="danger"
                    size={36}
                    radius="xl"
                    aria-label="Leave live communication"
                    data-testid="dock-leave"
                    onClick={onLeave}
                  >
                    <IconPhoneOff size={18} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>
              ) : null}

              {!compact && !centerMediaControls && connUi && (
                <>
                  <DockDivider />
                  <DockConnectionStatus conn={conn} connUi={connUi} onRetry={onRetry} />
                </>
              )}
            </Group>
          )}
        </Transition>
        </Box>
        {centerMediaControls && connUi && !compact ? (
          <DockConnectionStatus
            conn={conn}
            connUi={connUi}
            onRetry={onRetry}
            className="monosuite-media-dock-trailing"
          />
        ) : null}
      </Group>
  );

  if (embedded) {
    return (
      <Box
        data-testid="media-control-dock"
        data-joined={joined ? 'true' : 'false'}
        data-density={density}
        className={density === 'sidebar' ? 'monosuite-media-dock-sidebar' : undefined}
        px={density === 'sidebar' ? 8 : compact ? 14 : 24}
        py={density === 'sidebar' ? 8 : compact ? 6 : 12}
        w="100%"
      >
        {density === 'sidebar' ? (
          joined ? (
            <SidebarDockControls {...liveControlProps} />
          ) : (
            <Button
              fullWidth
              size="sm"
              color="teal"
              radius="md"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={onJoin}
              data-testid="dock-join"
              aria-label="Join media session"
              styles={{ root: { fontWeight: 700 } }}
            >
              Join media
            </Button>
          )
        ) : (
          controls
        )}
      </Box>
    );
  }

  return (
    <Box
      data-testid="media-control-dock"
      data-joined={joined ? 'true' : 'false'}
      style={{
        width: 'fit-content',
        maxWidth: '100%',
        marginInline: 'auto',
        padding: '10px 20px',
        borderRadius: 14,
        background: 'var(--monosuite-color-chrome)',
        color: 'var(--monosuite-color-chrome-text)',
        border: '1px solid var(--monosuite-color-chrome-border)',
        boxShadow: 'var(--mantine-shadow-lg)',
        outline: joined
          ? '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 36%, transparent)'
          : undefined,
        minHeight: 64,
        maxHeight: 72,
      }}
    >
      {controls}
    </Box>
  );
}

function DockDivider({ className }: { className?: string }) {
  return (
    <Box
      aria-hidden
      className={className}
      style={{
        width: 1,
        height: 28,
        flexShrink: 0,
        marginInline: 6,
        background: 'var(--monosuite-color-chrome-border)',
      }}
    />
  );
}

function DockConnectionStatus({
  conn,
  connUi,
  onRetry,
  className,
}: {
  conn: ConnectionState | 'idle';
  connUi: { label: string; detail: string };
  onRetry: () => void;
  className?: string;
}) {
  return (
    <Group gap="xs" wrap="nowrap" data-testid="dock-connection" className={className}>
      <StatusChip
        tone={
          conn === 'connected'
            ? 'ok'
            : conn === 'poor' || conn === 'reconnecting'
              ? 'warn'
              : 'danger'
        }
        label={conn === 'connected' ? 'Connected' : connUi.label.replace(/\.\.\.$/, '')}
        icon={
          conn === 'poor' ? (
            <IconAlertTriangle size={12} />
          ) : conn === 'reconnecting' ? (
            <IconLoader2 size={12} />
          ) : conn === 'lost' ? (
            <IconWifiOff size={12} />
          ) : undefined
        }
      />
      {(conn === 'lost' || conn === 'reconnecting') && (
        <Tooltip label="Retry connection" withArrow>
          <ActionIcon
            size={28}
            radius="md"
            variant="light"
            color="teal"
            aria-label="Retry connection"
            onClick={onRetry}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

type LiveControlBundle = {
  mic: ReturnType<typeof micControlMeta>;
  camera: ReturnType<typeof cameraControlMeta>;
  speaker: ReturnType<typeof speakerControlMeta>;
  share: ReturnType<typeof shareControlMeta>;
  onToggleMedia: (key: 'mic' | 'camera' | 'speaker') => void;
  onShare: () => void;
  onStopShare: () => void;
  onSettings: () => void;
  onMore: (action: string) => void;
  onLeave?: () => void;
  conn: ConnectionState | 'idle';
  connUi: { label: string; detail: string } | null;
  onRetry: () => void;
};

/** Compact grid for narrow split collaboration panel — prevents control overlap. */
function SidebarDockControls({
  mic,
  camera,
  speaker,
  share,
  onToggleMedia,
  onShare,
  onStopShare,
  onSettings,
  onMore,
  onLeave,
  conn,
  connUi,
  onRetry,
}: LiveControlBundle) {
  const controlSize = 28;

  return (
    <Box className="monosuite-media-dock-sidebar-toolbar" data-testid="dock-live-controls">
      <Group gap={4} wrap="nowrap" className="monosuite-media-dock-sidebar-primary">
        <DockControl
          testId="dock-mic"
          size={controlSize}
          label="Microphone"
          stateLabel={mic.stateLabel}
          visual={mic.visual}
          disabled={mic.disabled}
          pressed={mic.pressed}
          onClick={() => onToggleMedia('mic')}
          icon={mic.icon}
        />
        <DockControl
          testId="dock-camera"
          size={controlSize}
          label="Camera"
          stateLabel={camera.stateLabel}
          visual={camera.visual}
          disabled={camera.disabled}
          pressed={camera.pressed}
          onClick={() => onToggleMedia('camera')}
          icon={camera.icon}
        />
        <DockControl
          testId="dock-speaker"
          size={controlSize}
          label="Speaker"
          stateLabel={speaker.stateLabel}
          visual={speaker.visual}
          disabled={speaker.disabled}
          pressed={speaker.pressed}
          onClick={() => onToggleMedia('speaker')}
          icon={speaker.icon}
        />
        <DockControl
          testId="dock-share"
          size={controlSize}
          label="Screen Share"
          stateLabel={share.stateLabel}
          visual={share.visual}
          disabled={share.disabled}
          pressed={share.pressed}
          onClick={share.pressed ? onStopShare : onShare}
          icon={share.icon}
        />
      </Group>

      <Box className="monosuite-media-dock-sidebar-divider" aria-hidden />

      <Group gap={4} wrap="nowrap" className="monosuite-media-dock-sidebar-secondary">
        <DockControl
          testId="dock-settings"
          size={controlSize}
          label="Media Settings"
          stateLabel="Open"
          visual="off"
          pressed={false}
          onClick={onSettings}
          icon={<IconSettings size={15} stroke={1.75} />}
        />
        <Menu shadow="md" width={220} position="top" withinPortal>
          <Menu.Target>
            <Tooltip label="More" withArrow position="top">
              <ActionIcon
                variant="subtle"
                color="neutral"
                size={controlSize}
                radius="md"
                aria-label="More"
                data-testid="dock-more"
                styles={{
                  root: {
                    color: 'var(--monosuite-color-chrome-text-muted)',
                    border: '1px solid transparent',
                  },
                }}
              >
                <IconDots size={15} stroke={1.75} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconAdjustments size={14} />} onClick={() => onMore('devices')}>
              Test devices
            </Menu.Item>
            <Menu.Item leftSection={<IconNetwork size={14} />} onClick={() => onMore('connection')}>
              Connection details
            </Menu.Item>
            <Menu.Item
              leftSection={<IconShieldLock size={14} />}
              onClick={() => onMore('simulate-moderator-mute')}
            >
              Simulate moderator mute
            </Menu.Item>
            <Menu.Item
              leftSection={<IconScreenShare size={14} />}
              onClick={() => onMore('simulate-mike-share')}
            >
              Simulate Mike sharing
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        {onLeave ? (
          <Tooltip label="Leave live communication" withArrow position="top">
            <ActionIcon
              variant="filled"
              color="danger"
              size={controlSize}
              radius="xl"
              aria-label="Leave live communication"
              data-testid="dock-leave"
              onClick={onLeave}
            >
              <IconPhoneOff size={15} />
            </ActionIcon>
          </Tooltip>
        ) : null}
        {connUi ? (
          <Tooltip
            label={
              conn === 'connected' ? 'Connected' : connUi.label.replace(/\.\.\.$/, '')
            }
            withArrow
            position="top"
          >
            <ActionIcon
              variant="subtle"
              color={
                conn === 'connected'
                  ? 'success'
                  : conn === 'poor' || conn === 'reconnecting'
                    ? 'warning'
                    : 'danger'
              }
              size={controlSize}
              radius="md"
              aria-label="Connection status"
              data-testid="dock-connection"
              onClick={conn === 'reconnecting' || conn === 'lost' ? onRetry : undefined}
              styles={{
                root: {
                  color: 'var(--monosuite-color-chrome-text-muted)',
                  border: '1px solid transparent',
                },
              }}
            >
              {conn === 'poor' ? (
                <IconAlertTriangle size={15} />
              ) : conn === 'reconnecting' ? (
                <IconLoader2 size={15} />
              ) : conn === 'lost' ? (
                <IconWifiOff size={15} />
              ) : (
                <IconNetwork size={15} />
              )}
            </ActionIcon>
          </Tooltip>
        ) : null}
      </Group>
    </Box>
  );
}

function MetaItem({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <Group gap={4} wrap="nowrap" c="var(--monosuite-color-chrome-text-muted)">
      {icon}
      <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Group>
  );
}

function StatusChip({
  label,
  tone,
  pulsing,
  icon,
}: {
  label: string;
  tone: 'live' | 'ok' | 'warn' | 'danger';
  pulsing?: boolean;
  icon?: ReactNode;
}) {
  const color =
    tone === 'live' || tone === 'ok'
      ? 'var(--mantine-color-success-filled)'
      : tone === 'warn'
        ? 'var(--mantine-color-warning-filled)'
        : 'var(--mantine-color-danger-filled)';

  return (
    <Group
      gap={6}
      wrap="nowrap"
      px={10}
      py={5}
      style={{
        borderRadius: 999,
        background:
          tone === 'live'
            ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 18%, transparent)'
            : 'var(--monosuite-color-chrome-raised)',
      }}
    >
      {icon ?? (
        <Box
          component="span"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            boxShadow: pulsing ? `0 0 0 3px color-mix(in srgb, ${color} 28%, transparent)` : undefined,
            flexShrink: 0,
          }}
        />
      )}
      <Text
        size="xs"
        fw={700}
        style={{
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
          color:
            tone === 'live'
              ? 'var(--mantine-color-teal-filled)'
              : 'var(--monosuite-color-chrome-text)',
        }}
      >
        {label}
      </Text>
    </Group>
  );
}

/** Icon + tooltip communicate on/off — muted uses the same chrome as other off controls. */
function DockControl({
  label,
  stateLabel,
  visual,
  disabled,
  pressed,
  onClick,
  icon,
  testId,
  size = 36,
}: {
  label: string;
  stateLabel: string;
  visual: ControlVisual;
  disabled?: boolean;
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
  testId: string;
  size?: number;
}) {
  const tooltip = `${label}: ${stateLabel}`;
  const styles = visualStyles(visual);

  return (
    <Tooltip label={tooltip} withArrow position="top">
      <ActionIcon
        variant={styles.variant}
        color={styles.color}
        size={size}
        radius="md"
        disabled={disabled}
        onClick={onClick}
        aria-label={tooltip}
        aria-pressed={pressed}
        data-testid={testId}
        data-state={stateLabel.toLowerCase().replace(/\s+/g, '-')}
        styles={{
          root: {
            position: 'relative',
            border: styles.border,
            color: styles.colorToken,
            background: styles.background,
            transition: 'background-color 120ms ease, color 120ms ease, border-color 120ms ease',
          },
        }}
      >
        {icon}
        {visual === 'sharing' && (
          <Box
            component="span"
            aria-hidden
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--mantine-color-white)',
            }}
          />
        )}
      </ActionIcon>
    </Tooltip>
  );
}

function visualStyles(visual: ControlVisual): {
  variant: 'filled' | 'light' | 'subtle';
  color: string;
  border: string;
  background?: string;
  colorToken?: string;
} {
  switch (visual) {
    case 'on':
      return {
        variant: 'light',
        color: 'teal',
        border: '1px solid color-mix(in srgb, var(--mantine-color-teal-filled) 45%, transparent)',
      };
    case 'sharing':
      return {
        variant: 'filled',
        color: 'teal',
        border: '1px solid var(--mantine-color-teal-filled)',
      };
    case 'warn':
      return {
        variant: 'light',
        color: 'warning',
        border: '1px solid color-mix(in srgb, var(--mantine-color-warning-filled) 40%, transparent)',
      };
    case 'danger':
      return {
        variant: 'light',
        color: 'danger',
        border: '1px solid color-mix(in srgb, var(--mantine-color-danger-filled) 40%, transparent)',
      };
    case 'muted':
    case 'off':
    default:
      return {
        variant: 'subtle',
        color: 'neutral',
        border: '1px solid var(--monosuite-color-chrome-border)',
        background: 'var(--monosuite-color-chrome-raised)',
        colorToken: 'var(--monosuite-color-chrome-text-muted)',
      };
  }
}

function micControlMeta(state: ReturnType<typeof resolveLocalMicState>) {
  switch (state) {
    case 'on':
      return {
        stateLabel: 'On',
        visual: 'on' as const,
        pressed: true,
        icon: <IconMicrophone size={18} stroke={1.75} />,
      };
    case 'off':
      return {
        stateLabel: 'Muted',
        visual: 'off' as const,
        pressed: false,
        icon: <IconMicrophoneOff size={18} stroke={1.75} />,
      };
    case 'muted-by-moderator':
      return {
        stateLabel: 'Muted by moderator',
        visual: 'off' as const,
        pressed: false,
        disabled: true,
        icon: <IconMicrophoneOff size={18} stroke={1.75} />,
      };
    case 'permission-denied':
      return {
        stateLabel: 'Permission denied',
        visual: 'danger' as const,
        pressed: false,
        disabled: true,
        icon: <IconMicrophoneOff size={18} stroke={1.75} />,
      };
    case 'connecting':
      return {
        stateLabel: 'Connecting',
        visual: 'warn' as const,
        pressed: false,
        disabled: true,
        icon: <IconLoader2 size={18} stroke={1.75} />,
      };
  }
}

function cameraControlMeta(state: ReturnType<typeof resolveLocalCameraState>) {
  switch (state) {
    case 'on':
      return {
        stateLabel: 'On',
        visual: 'on' as const,
        pressed: true,
        icon: <IconVideo size={18} stroke={1.75} />,
      };
    case 'off':
      return {
        stateLabel: 'Off',
        visual: 'off' as const,
        pressed: false,
        icon: <IconVideoOff size={18} stroke={1.75} />,
      };
    case 'permission-denied':
      return {
        stateLabel: 'Permission denied',
        visual: 'danger' as const,
        pressed: false,
        disabled: true,
        icon: <IconVideoOff size={18} stroke={1.75} />,
      };
    case 'connecting':
      return {
        stateLabel: 'Connecting',
        visual: 'warn' as const,
        pressed: false,
        disabled: true,
        icon: <IconLoader2 size={18} stroke={1.75} />,
      };
  }
}

function speakerControlMeta(state: ReturnType<typeof resolveLocalSpeakerState>) {
  switch (state) {
    case 'on':
      return {
        stateLabel: 'On',
        visual: 'on' as const,
        pressed: true,
        icon: <IconVolume size={18} stroke={1.75} />,
      };
    case 'off':
      return {
        stateLabel: 'Off',
        visual: 'off' as const,
        pressed: false,
        icon: <IconVolumeOff size={18} stroke={1.75} />,
      };
    case 'unavailable':
      return {
        stateLabel: 'Device unavailable',
        visual: 'warn' as const,
        pressed: false,
        disabled: true,
        icon: <IconVolumeOff size={18} stroke={1.75} />,
      };
  }
}

function shareControlMeta(
  state: ReturnType<typeof resolveLocalShareState>,
  remoteShareBy: string | null,
) {
  switch (state) {
    case 'available':
      return {
        stateLabel: 'Off',
        visual: 'off' as const,
        pressed: false,
        icon: <IconScreenShare size={18} stroke={1.75} />,
      };
    case 'sharing':
      return {
        stateLabel: 'Sharing',
        visual: 'sharing' as const,
        pressed: true,
        icon: <IconScreenShare size={18} stroke={1.75} />,
      };
    case 'remote-sharing':
      return {
        stateLabel: remoteShareBy
          ? `${remoteShareBy} is sharing`
          : 'Another participant is sharing',
        visual: 'warn' as const,
        pressed: false,
        disabled: true,
        icon: <IconScreenShareOff size={18} stroke={1.75} />,
      };
    case 'permission-denied':
      return {
        stateLabel: 'Permission denied',
        visual: 'danger' as const,
        pressed: false,
        disabled: true,
        icon: <IconScreenShareOff size={18} stroke={1.75} />,
      };
  }
}
