import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowsExchange,
  IconDotsVertical,
  IconDownload,
  IconDoorExit,
  IconInfoCircle,
  IconList,
  IconPaperclip,
  IconSettings,
  IconUserPlus,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { TruncatedTooltipText } from '../../../shared/components/TruncatedTooltipText';
import {
  ROOM_PAGE_HEADER_CARD_HEIGHT,
  ROOM_PAGE_HEADER_GUTTER,
} from '../../../shared/constants';
import { routes } from '../../../shared/routes';
import { ROOM_ROLE_COLOR, ROOM_ROLE_EMOJI, type RoomSlaPolicy } from '../data';
import type { PapLevel, RoomTlpPolicy, RoomVisibility } from '../roomPolicy';
import { useRoomIncident } from '../RoomScenarioContext';
import { RoomDetailsDrawer } from './RoomDetailsDrawer';

const VISIBLE_TAG_LIMIT = 2;
const titleSize = 'clamp(1.05rem, 1.6vw, 1.35rem)';

interface RoomCommandHeaderProps {
  roomTitle: string;
  roomDescription: string;
  roomTags: string[];
  visibility: RoomVisibility;
  tlp: RoomTlpPolicy;
  pap: PapLevel;
  onRoomAction: (action: string) => void;
  onCloseRoom: () => void;
  canEditRoomSettings?: boolean;
  compact?: boolean;
  showOperationalTime?: boolean;
  startedAtLabel?: string;
  elapsedLabel?: string;
  roomSlaPolicy?: RoomSlaPolicy | null;
  commanderName?: string;
  canTransferCommand?: boolean;
  onTransferCommand?: () => void;
}

/** Room page header card — breadcrumb + room title + description/tags + actions. */
export function RoomCommandHeader({
  roomTitle,
  roomDescription,
  roomTags,
  visibility,
  tlp,
  pap,
  onRoomAction,
  onCloseRoom,
  canEditRoomSettings = false,
  compact = false,
  showOperationalTime = false,
  startedAtLabel,
  elapsedLabel,
  roomSlaPolicy = null,
  commanderName,
  canTransferCommand = false,
  onTransferCommand,
}: RoomCommandHeaderProps) {
  const navigate = useNavigate();
  const incident = useRoomIncident();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const headingSize = compact ? '1rem' : titleSize;

  const trimmedDescription = roomDescription.trim();
  const hasMeta = trimmedDescription.length > 0 || roomTags.length > 0;
  const visibleTags = roomTags.slice(0, VISIBLE_TAG_LIMIT);
  const overflowTags = roomTags.slice(VISIBLE_TAG_LIMIT);
  const overflowTagCount = overflowTags.length;

  const openDetails = () => setDetailsOpen(true);

  const backToRooms = () => navigate(routes.rooms);

  const titleStyles = {
    fontSize: headingSize,
    letterSpacing: '-0.02em',
    color: 'var(--mantine-color-text)',
  } as const;

  const slaTone =
    roomSlaPolicy?.status === 'breached'
      ? 'danger'
      : roomSlaPolicy?.status === 'warning'
        ? 'warning'
        : 'teal';

  const infoButton = hasMeta ? (
    <Tooltip label="View room description and tags" withArrow position="bottom">
      <ActionIcon
        variant="subtle"
        color="neutral"
        size="sm"
        aria-label="View room description and tags"
        onClick={openDetails}
        style={{ flexShrink: 0 }}
        data-testid="room-header-info"
      >
        <IconInfoCircle size={16} />
      </ActionIcon>
    </Tooltip>
  ) : null;

  const operationalTime = showOperationalTime && startedAtLabel && elapsedLabel && (
    <Text
      component="span"
      size="xs"
      c="dimmed"
      fw={600}
      style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
      data-testid="room-operational-time"
    >
      <Text span visibleFrom="sm">
        Started{' '}
      </Text>
      <Text span fw={700}>
        {startedAtLabel}
      </Text>
      <Text span aria-hidden>
        {' '}
        ·{' '}
      </Text>
      <Text span visibleFrom="sm">
        Elapsed{' '}
      </Text>
      <Text span fw={700} ff="monospace">
        {elapsedLabel}
      </Text>
    </Text>
  );

  const metaContent = (hasMeta || overflowTagCount > 0) && (
    <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
      {trimmedDescription ? (
        <UnstyledButton
          onClick={openDetails}
          aria-label="View full room description"
          style={{
            minWidth: 0,
            flexShrink: 1,
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          <TruncatedTooltipText size="xs" c="dimmed" lineClamp={1}>
            {trimmedDescription}
          </TruncatedTooltipText>
        </UnstyledButton>
      ) : null}

      {(visibleTags.length > 0 || overflowTagCount > 0) ? (
        <Group gap={8} wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
          {visibleTags.map((tag) => (
            <UnstyledButton
              key={tag}
              onClick={openDetails}
              aria-label={`View room tag ${tag}`}
              style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
            >
              <Badge variant="light" color="neutral" size="xs">
                {tag}
              </Badge>
            </UnstyledButton>
          ))}

          {overflowTagCount > 0 ? (
            <Tooltip
              withArrow
              position="bottom"
              multiline
              maw={240}
              label={
                <Stack gap={2}>
                  {overflowTags.map((tag) => (
                    <Text key={tag} size="xs">
                      {tag}
                    </Text>
                  ))}
                </Stack>
              }
            >
              <UnstyledButton
                onClick={openDetails}
                aria-label={`View ${overflowTagCount} more room tags: ${overflowTags.join(', ')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                <Badge variant="outline" color="neutral" size="xs">
                  +{overflowTagCount}
                </Badge>
              </UnstyledButton>
            </Tooltip>
          ) : null}
        </Group>
      ) : null}
    </Group>
  );

  const metaRowVisible = Boolean(metaContent) || Boolean(operationalTime);

  return (
    <>
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
          py="xs"
          style={{
            minHeight:
              metaRowVisible
                ? ROOM_PAGE_HEADER_CARD_HEIGHT + 18
                : ROOM_PAGE_HEADER_CARD_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--monosuite-color-border)',
            background: 'var(--monosuite-color-surface)',
            boxShadow: 'var(--mantine-shadow-sm)',
          }}
        >
          <Stack gap={metaRowVisible ? 4 : 0} w="100%">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md" w="100%">
              <Group gap={8} wrap="nowrap" align="flex-start" style={{ minWidth: 0, flex: 1 }}>
                <ActionIcon
                  variant="subtle"
                  color="neutral"
                  size="sm"
                  aria-label="Back to rooms list"
                  data-testid="back-to-rooms"
                  onClick={backToRooms}
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <IconArrowLeft size={16} />
                </ActionIcon>

                <Group gap={6} wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
                  <Group
                    gap={8}
                    wrap="nowrap"
                    align="center"
                    style={{ minWidth: 0, flexShrink: 1, maxWidth: '100%' }}
                  >
                    {canEditRoomSettings ? (
                      <UnstyledButton
                        onClick={() => onRoomAction('room-settings')}
                        aria-label="Edit room settings"
                        style={{
                          minWidth: 0,
                          flexShrink: 1,
                          overflow: 'hidden',
                          textAlign: 'left',
                        }}
                      >
                        <Text component="span" fw={700} lineClamp={1} style={titleStyles}>
                          {roomTitle}
                        </Text>
                      </UnstyledButton>
                    ) : (
                      <Text
                        component="span"
                        fw={700}
                        lineClamp={1}
                        style={{ ...titleStyles, minWidth: 0, flexShrink: 1, overflow: 'hidden' }}
                      >
                        {roomTitle}
                      </Text>
                    )}

                    <Box hiddenFrom="lg" style={{ flexShrink: 0 }}>
                      {infoButton}
                    </Box>
                  </Group>

                  <Group gap={5} wrap="nowrap" visibleFrom="md" style={{ flexShrink: 0 }}>
                    <Badge color="neutral" variant="outline" size="sm">
                      {incident.id}
                    </Badge>
                    <Badge color="success" size="sm" variant="light">
                      {incident.status}
                    </Badge>
                    <Badge
                      color={ROOM_ROLE_COLOR.Commander}
                      size="sm"
                      variant="light"
                      leftSection={
                        <Text component="span" size="xs" lh={1} aria-hidden>
                          {ROOM_ROLE_EMOJI.Commander}
                        </Text>
                      }
                    >
                      Commander · {commanderName ?? incident.owner}
                    </Badge>
                  </Group>
                  {compact ? (
                    <Badge
                      color={ROOM_ROLE_COLOR.Commander}
                      size="xs"
                      variant="light"
                      leftSection={
                        <Text component="span" size="10px" lh={1} aria-hidden>
                          {ROOM_ROLE_EMOJI.Commander}
                        </Text>
                      }
                      style={{ flexShrink: 0 }}
                    >
                      {commanderName ?? incident.owner}
                    </Badge>
                  ) : null}
                </Group>
              </Group>

              <Stack gap={4} align="flex-end" style={{ flexShrink: 0, marginTop: 2 }}>
                <Group gap="xs" wrap="nowrap">
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
                  <Menu.Item leftSection={<IconList size={16} />} onClick={backToRooms}>
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
                  {canEditRoomSettings ? (
                    <Menu.Item
                      leftSection={<IconSettings size={16} />}
                      onClick={() => onRoomAction('room-settings')}
                    >
                      Room Settings
                    </Menu.Item>
                  ) : null}
                  {canTransferCommand && onTransferCommand ? (
                    <Menu.Item
                      leftSection={<IconArrowsExchange size={16} />}
                      onClick={onTransferCommand}
                    >
                      Transfer command
                    </Menu.Item>
                  ) : null}
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

                <Box hiddenFrom="lg" style={{ textAlign: 'right' }}>
                  {operationalTime}
                </Box>

                {roomSlaPolicy ? (
                  <Badge color={slaTone} variant="light" size="xs">
                    {roomSlaPolicy.label}
                  </Badge>
                ) : null}
              </Stack>
            </Group>

            {metaRowVisible ? (
              <Group
                gap={8}
                wrap="nowrap"
                align="center"
                justify="space-between"
                visibleFrom="lg"
                w="100%"
                data-testid="room-header-meta-wide"
              >
                <Box w={28} style={{ flexShrink: 0 }} aria-hidden />
                {metaContent}
                {operationalTime}
              </Group>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <RoomDetailsDrawer
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        roomTitle={roomTitle}
        description={roomDescription}
        tags={roomTags}
        visibility={visibility}
        tlp={tlp}
        pap={pap}
        canEditRoomSettings={canEditRoomSettings}
        onEditRoomSettings={() => onRoomAction('room-settings')}
      />
    </>
  );
}
