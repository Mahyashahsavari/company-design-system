import {
  AppShell,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { AppChrome } from '../../shared/components/AppChrome';
import { TruncatedTooltipText } from '../../shared/components/TruncatedTooltipText';
import { routes } from '../../shared/routes';
import { ROOM_SEVERITY_COLOR } from '../room/data';
import { SeverityIcon, SeverityPip, severityCardStyle } from '../room/severity';
import { ROOM_LIST, type RoomListItem, type RoomListStatus } from './data';

const STATUS_COLOR: Record<RoomListStatus, 'success' | 'neutral'> = {
  live: 'success',
  closed: 'neutral',
};

export function RoomsPage() {
  const navigate = useNavigate();

  const openRoom = (item: RoomListItem) => {
    if (item.href) {
      navigate(item.href);
      return;
    }
    navigate(routes.room);
  };

  return (
    <AppChrome>
      <AppShell.Main
        style={{
          background: 'var(--monosuite-color-background)',
          minHeight: 'calc(100dvh - 52px)',
        }}
      >
        <Stack gap="md" p="md" maw={1100} mx="auto" data-testid="rooms-page">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Stack gap={4}>
              <Title order={2}>Rooms</Title>
              <Text c="dimmed" size="sm">
                Open and recently closed incident response rooms
              </Text>
            </Stack>
            <Button
              color="teal"
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate(routes.createRoom)}
            >
              Create Room
            </Button>
          </Group>

          <Stack gap="sm" hiddenFrom="sm">
            {ROOM_LIST.map((item) => (
              <RoomCard key={item.id} item={item} onOpen={() => openRoom(item)} />
            ))}
          </Stack>

          <Table.ScrollContainer minWidth={720} visibleFrom="sm">
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Room</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Severity</Table.Th>
                  <Table.Th>Phase</Table.Th>
                  <Table.Th>Commander</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ROOM_LIST.map((item) => (
                  <Table.Tr
                    key={item.id}
                    style={{ cursor: item.status === 'live' ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (item.status === 'live') openRoom(item);
                    }}
                  >
                    <Table.Td>
                      <Group gap={8} wrap="nowrap" align="flex-start">
                        <Box mt={6}>
                          <SeverityPip severity={item.severity} />
                        </Box>
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <TruncatedTooltipText size="sm" fw={700} maw={360}>
                            {item.title}
                          </TruncatedTooltipText>
                          <Text size="xs" c="dimmed">
                            {item.incidentId} · {item.participantCount} participants
                          </Text>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={item.status} />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={ROOM_SEVERITY_COLOR[item.severity]}
                        variant="light"
                        size="sm"
                        leftSection={<SeverityIcon severity={item.severity} size={12} />}
                      >
                        {item.severity}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.phase}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.commander}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {item.updatedLabel}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {item.status === 'live' ? (
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="teal"
                          rightSection={<IconArrowRight size={14} />}
                          onClick={(event) => {
                            event.stopPropagation();
                            openRoom(item);
                          }}
                        >
                          Open
                        </Button>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </AppShell.Main>
    </AppChrome>
  );
}

function StatusBadge({ status }: { status: RoomListStatus }) {
  return (
    <Badge color={STATUS_COLOR[status]} variant={status === 'live' ? 'filled' : 'light'} size="sm">
      {status === 'live' ? 'Live' : 'Closed'}
    </Badge>
  );
}

function RoomCard({ item, onOpen }: { item: RoomListItem; onOpen: () => void }) {
  const interactive = item.status === 'live';

  return (
    <UnstyledButton
      onClick={interactive ? onOpen : undefined}
      disabled={!interactive}
      data-testid={interactive ? `open-room-${item.id}` : undefined}
      style={{
        width: '100%',
        padding: 14,
        paddingLeft: 16,
        borderRadius: 'var(--mantine-radius-md)',
        textAlign: 'start',
        opacity: interactive ? 1 : 0.78,
        ...severityCardStyle(item.severity),
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm" mb={8}>
        <StatusBadge status={item.status} />
        <Badge color={ROOM_SEVERITY_COLOR[item.severity]} variant="light" size="sm" leftSection={<SeverityIcon severity={item.severity} size={12} />}>
          {item.severity}
        </Badge>
      </Group>
      <TruncatedTooltipText size="sm" fw={700}>
        {item.title}
      </TruncatedTooltipText>
      <Text size="xs" c="dimmed" mt={4}>
        {item.incidentId} · {item.phase} · {item.commander}
      </Text>
      <Text size="xs" c="dimmed">
        {item.participantCount} participants · {item.updatedLabel}
      </Text>
    </UnstyledButton>
  );
}
