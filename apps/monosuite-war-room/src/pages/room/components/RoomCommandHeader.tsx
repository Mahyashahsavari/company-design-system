import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCrown,
  IconDotsVertical,
  IconDownload,
  IconDoorExit,
  IconList,
  IconPaperclip,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import {
  ROOM_PAGE_HEADER_CARD_HEIGHT,
  ROOM_PAGE_HEADER_GUTTER,
} from '../../../shared/constants';
import { routes } from '../../../shared/routes';
import { INCIDENT, ROOM_SEVERITY_COLOR, type RoomSeverity } from '../data';

interface RoomCommandHeaderProps {
  roomTitle: string;
  roomSeverity: RoomSeverity;
  onRoomAction: (action: string) => void;
  onCloseRoom: () => void;
  compact?: boolean;
}

const titleSize = 'clamp(1.05rem, 1.6vw, 1.35rem)';

/** Room page header card — breadcrumb + room title + actions. */
export function RoomCommandHeader({
  roomTitle,
  roomSeverity,
  onRoomAction,
  onCloseRoom,
  compact = false,
}: RoomCommandHeaderProps) {
  const navigate = useNavigate();
  const headingSize = compact ? '1rem' : titleSize;

  const backToRooms = () => navigate(routes.rooms);
  return (
    <Box
      pt={ROOM_PAGE_HEADER_GUTTER}
      px={ROOM_PAGE_HEADER_GUTTER}
      pb={compact ? 4 : 0}
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
            <ActionIcon
              variant="subtle"
              color="neutral"
              size="sm"
              aria-label="Back to rooms list"
              data-testid="back-to-rooms"
              onClick={backToRooms}
              style={{ flexShrink: 0 }}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>

            <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
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
                    fontSize: headingSize,
                    letterSpacing: '-0.02em',
                    color: 'var(--mantine-color-text)',
                  }}
                >
                  {roomTitle}
                </Text>
              </UnstyledButton>
              <Group gap={5} wrap="nowrap" visibleFrom="md" style={{ flexShrink: 0 }}>
                <Badge color="neutral" variant="outline" size="sm">
                  {INCIDENT.id}
                </Badge>
                <Badge color={ROOM_SEVERITY_COLOR[roomSeverity]} size="sm" variant="light">
                  {roomSeverity}
                </Badge>
                <Badge color="success" size="sm" variant="light">
                  {INCIDENT.status}
                </Badge>
                <Badge
                  color="brand"
                  size="sm"
                  variant="light"
                  leftSection={<IconCrown size={12} aria-hidden />}
                >
                  Commander · {INCIDENT.owner}
                </Badge>
              </Group>
              {compact ? (
                <Badge
                  color="brand"
                  size="xs"
                  variant="light"
                  leftSection={<IconCrown size={11} aria-hidden />}
                  style={{ flexShrink: 0 }}
                >
                  {INCIDENT.owner}
                </Badge>
              ) : null}
            </Group>
          </Group>

          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="neutral"
                  size="compact-xs"
                  leftSection={<IconDotsVertical size={14} />}
                  aria-label="Room Actions"
                >
                  {compact ? null : 'Actions'}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconList size={16} />}
                  onClick={backToRooms}
                >
                  Back to rooms
                </Menu.Item>
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

            <Button
              color="danger"
              variant="light"
              size="compact-xs"
              onClick={onCloseRoom}
              visibleFrom="sm"
            >
              Close Room
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}
