import {
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconAlignLeft, IconInfoCircle, IconSettings, IconTags } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { ROOM_SEVERITY_COLOR, type RoomSeverity } from '../data';

interface RoomDetailsDrawerProps {
  opened: boolean;
  onClose: () => void;
  roomTitle: string;
  roomSeverity: RoomSeverity;
  description: string;
  tags: string[];
  canEditRoomSettings?: boolean;
  onEditRoomSettings?: () => void;
}

function DetailSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof IconAlignLeft;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon variant="light" color="neutral" size="sm" radius="sm" aria-hidden>
          <Icon size={14} />
        </ThemeIcon>
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="0.05em">
          {title}
          {count != null ? (
            <Text span c="dimmed" fw={600}>
              {' '}
              · {count}
            </Text>
          ) : null}
        </Text>
      </Group>
      <Box
        p="sm"
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
          border: '1px solid var(--monosuite-color-border)',
          background: 'var(--monosuite-color-surface-sunken)',
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

/** Read-only room description and tags — editing stays in Room Settings. */
export function RoomDetailsDrawer({
  opened,
  onClose,
  roomTitle,
  roomSeverity,
  description,
  tags,
  canEditRoomSettings = false,
  onEditRoomSettings,
}: RoomDetailsDrawerProps) {
  const trimmedDescription = description.trim();
  const hasDescription = trimmedDescription.length > 0;
  const hasTags = tags.length > 0;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color="teal" size="lg" radius="md" aria-hidden>
            <IconInfoCircle size={18} />
          </ThemeIcon>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw={700} size="sm">
              Room context
            </Text>
            <Text size="xs" c="dimmed" fw={400}>
              Read-only summary for all room members
            </Text>
          </Stack>
        </Group>
      }
      overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
      data-testid="room-details-drawer"
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Box
        px="md"
        pt="xs"
        pb="sm"
        style={{
          flexShrink: 0,
          borderBottom: '1px solid var(--monosuite-color-border)',
          background: 'var(--monosuite-color-surface)',
        }}
      >
        <Text fw={700} size="lg" lineClamp={2} style={{ letterSpacing: '-0.02em' }}>
          {roomTitle}
        </Text>
        <Group gap={6} mt={6}>
          <Badge color={ROOM_SEVERITY_COLOR[roomSeverity]} size="sm" variant="light">
            {roomSeverity}
          </Badge>
          <Badge color="neutral" variant="outline" size="sm">
            View only
          </Badge>
        </Group>
      </Box>

      <ScrollArea.Autosize
        mah="calc(100dvh - 280px)"
        type="auto"
        offsetScrollbars
        px="md"
        py="md"
      >
        <Stack gap="md">
          <DetailSection title="Description" icon={IconAlignLeft}>
            {hasDescription ? (
              <Text size="sm" lh={1.6} style={{ whiteSpace: 'pre-wrap' }}>
                {trimmedDescription}
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                No description provided for this room.
              </Text>
            )}
          </DetailSection>

          <DetailSection title="Tags" icon={IconTags} count={tags.length}>
            {hasTags ? (
              <Group gap={6}>
                {tags.map((tag) => (
                  <Badge key={tag} variant="light" color="neutral" size="sm" radius="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                No tags assigned.
              </Text>
            )}
          </DetailSection>
        </Stack>
      </ScrollArea.Autosize>

      {canEditRoomSettings && onEditRoomSettings ? (
        <Box
          px="md"
          py="sm"
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface)',
          }}
        >
          <Text size="xs" c="dimmed" mb="xs">
            Changes to description and tags are made in Room Settings.
          </Text>
          <Button
            variant="light"
            color="teal"
            fullWidth
            leftSection={<IconSettings size={16} />}
            onClick={() => {
              onClose();
              onEditRoomSettings();
            }}
            data-testid="room-details-edit-settings"
          >
            Edit in Room Settings
          </Button>
        </Box>
      ) : null}
    </Drawer>
  );
}
