import {
  Avatar,
  Badge,
  Button,
  Group,
  Indicator,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconClock,
  IconDotsVertical,
  IconDownload,
  IconDoorExit,
  IconPaperclip,
  IconSettings,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import { INCIDENT, PARTICIPANTS } from '../data';

interface RoomCommandHeaderProps {
  durationShort: string;
  onRoomAction: (action: string) => void;
  onCloseRoom: () => void;
}

export function RoomCommandHeader({
  durationShort,
  onRoomAction,
  onCloseRoom,
}: RoomCommandHeaderProps) {
  return (
    <Stack
      gap={0}
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 6,
        overflow: 'hidden',
        borderLeft: '4px solid var(--mantine-color-teal-filled)',
        background: 'var(--mantine-color-body)',
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py="xs"
        wrap="wrap"
        style={{ background: 'var(--mantine-color-success-light)' }}
      >
        <Group gap="md" wrap="wrap">
          <Group gap={8}>
            <Indicator processing color="success" size={8} offset={4}>
              <Badge color="success" variant="filled" size="sm" tt="uppercase" style={{ letterSpacing: '0.14em' }}>
                LIVE
              </Badge>
            </Indicator>
            <Text size="sm" fw={600}>
              Room
            </Text>
          </Group>
          <Group gap={6} c="dimmed">
            <IconClock size={14} />
            <Text size="xs">Started {durationShort} ago</Text>
            <Text size="xs">·</Text>
            <IconUsers size={14} />
            <Text size="xs">4 participants</Text>
          </Group>
        </Group>
        <Avatar.Group spacing="sm">
          {PARTICIPANTS.map((p) => (
            <Avatar key={p.id} size="sm" radius="xl" color={p.color} title={p.name}>
              {p.initials}
            </Avatar>
          ))}
        </Avatar.Group>
      </Group>

      <Group justify="space-between" align="flex-start" px="md" py="md" wrap="wrap">
        <Stack gap={6} style={{ flex: 1, minWidth: 240 }}>
          <Title order={2} style={{ fontSize: 28, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            {INCIDENT.title}
          </Title>
          <Group gap="xs">
            <Text size="xs" c="dimmed" ff="monospace" fw={600}>
              {INCIDENT.id}
            </Text>
            <Badge color="danger" size="sm">
              {INCIDENT.severity}
            </Badge>
            <Text size="sm" c="dimmed">
              · Commander · {INCIDENT.owner}
            </Text>
          </Group>
        </Stack>
        <Group gap="xs">
          <Menu shadow="md" width={240} position="bottom-end">
            <Menu.Target>
              <Button variant="default" size="sm" leftSection={<IconDotsVertical size={16} />}>
                Room Actions
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Room Actions</Menu.Label>
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
          <Button color="danger" size="sm" onClick={onCloseRoom}>
            Close Room
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
