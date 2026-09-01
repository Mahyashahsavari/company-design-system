import {
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconChevronRight,
  IconDotsVertical,
  IconDownload,
  IconDoorExit,
  IconPaperclip,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';
import {
  ROOM_PAGE_HEADER_CARD_HEIGHT,
  ROOM_PAGE_HEADER_GUTTER,
} from '../../../shared/constants';
import { INCIDENT, type RoomSeverity } from '../data';

const SEVERITY_BADGE_COLOR: Record<RoomSeverity, 'danger' | 'warning' | 'success'> = {
  Critical: 'danger',
  High: 'danger',
  Medium: 'warning',
  Low: 'success',
};

interface RoomCommandHeaderProps {
  roomTitle: string;
  roomSeverity: RoomSeverity;
  onRoomAction: (action: string) => void;
  onCloseRoom: () => void;
}

const titleSize = 'clamp(1.05rem, 1.6vw, 1.35rem)';

/** Room page header card — breadcrumb + room title + actions. */
export function RoomCommandHeader({
  roomTitle,
  roomSeverity,
  onRoomAction,
  onCloseRoom,
}: RoomCommandHeaderProps) {
  return (
    <Box
      pt={ROOM_PAGE_HEADER_GUTTER}
      px={ROOM_PAGE_HEADER_GUTTER}
      style={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--monosuite-color-background)',
      }}
    >
      <Box
        component="header"
        px="md"
        style={{
          minHeight: ROOM_PAGE_HEADER_CARD_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--monosuite-color-border)',
          background: 'var(--monosuite-color-surface)',
          boxShadow: 'var(--mantine-shadow-sm)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="md" w="100%">
          <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
            <UnstyledButton
              onClick={() => onRoomAction('rooms')}
              aria-label="Back to rooms list"
              style={{ flexShrink: 0 }}
            >
              <Text
                component="span"
                fw={600}
                c="dimmed"
                style={{ fontSize: titleSize, letterSpacing: '-0.02em' }}
              >
                Rooms
              </Text>
            </UnstyledButton>

            <IconChevronRight
              size={18}
              aria-hidden
              style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }}
            />

            <Group gap={6} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
              <Badge color="success" variant="light" size="sm" style={{ flexShrink: 0 }}>
                LIVE
              </Badge>

              <UnstyledButton
                onClick={() => onRoomAction('room-settings')}
                aria-label="Edit room settings"
                style={{ minWidth: 0, flex: 1, textAlign: 'left' }}
              >
                <Text
                  component="span"
                  fw={700}
                  lineClamp={1}
                  style={{
                    fontSize: titleSize,
                    letterSpacing: '-0.02em',
                    color: 'var(--mantine-color-text)',
                  }}
                >
                  {roomTitle}
                </Text>
              </UnstyledButton>
            </Group>
          </Group>

          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Text size="sm" c="dimmed" fw={600} visibleFrom="lg">
              {INCIDENT.id}
            </Text>
            <Badge color={SEVERITY_BADGE_COLOR[roomSeverity]} size="xs" variant="light">
              {roomSeverity}
            </Badge>
            <Badge color="success" size="xs" variant="light">
              {INCIDENT.status}
            </Badge>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="neutral"
                  size="compact-xs"
                  leftSection={<IconDotsVertical size={14} />}
                  aria-label="Room Actions"
                >
                  Actions
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUserPlus size={16} />}
                  onClick={() => onRoomAction('invite')}
                >
                  Invite Participants
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPaperclip size={16} />}
                  onClick={() => onRoomAction('add-evidence')}
                >
                  Add Evidence
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDownload size={16} />}
                  onClick={() => onRoomAction('export')}
                >
                  Export Room Summary
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => onRoomAction('room-settings')}
                >
                  Room Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="danger"
                  leftSection={<IconDoorExit size={16} />}
                  onClick={() => onRoomAction('close-room')}
                >
                  Close Room
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button color="danger" variant="light" size="compact-xs" onClick={onCloseRoom}>
              Close Room
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}
