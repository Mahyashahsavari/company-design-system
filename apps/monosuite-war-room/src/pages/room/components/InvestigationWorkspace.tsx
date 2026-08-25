import {
  Avatar,
  Badge,
  Group,
  Indicator,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { IconClock, IconUsers } from '@tabler/icons-react';
import { PARTICIPANTS, type WorkspaceTab } from '../data';
import type { RoomState } from '../hooks/useRoomState';
import { LiveActivity } from './LiveActivity';
import { QuestionCard } from './QuestionCard';
import { ScreenShareStage } from './ScreenShareStage';

interface InvestigationWorkspaceProps {
  room: RoomState;
}

export function InvestigationWorkspace({ room }: InvestigationWorkspaceProps) {
  const {
    workspaceTab,
    setWorkspaceTab,
    workspaceItems,
    tabCounts,
    expandedQuestion,
    toggleQuestion,
    answeringQuestion,
    startAddAnswer,
    cancelAddAnswer,
    submitAnswer,
    discussionOpen,
    toggleDiscussion,
    selectedDecision,
    setSelectedDecision,
    recordDecision,
    history,
    typingVisible,
    durationShort,
    media,
    setShareLayout,
  } = room;

  const shareActive = Boolean(media.share || media.remoteShareBy);
  const shareMinimized = media.shareLayout === 'minimized';

  return (
    <Stack
      gap={0}
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 6,
        background: 'var(--mantine-color-body)',
        flex: 1,
        minHeight: 360,
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py="sm"
        wrap="wrap"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Title order={5}>Investigation & Collaboration</Title>
        <Group gap="md" wrap="wrap">
          <Group gap={6}>
            <Indicator processing color="success" size={8}>
              <Badge color="success" variant="light" size="sm">
                Live War Room
              </Badge>
            </Indicator>
            <Group gap={4} c="dimmed">
              <IconUsers size={14} />
              <Text size="xs">
                <strong>4</strong> in room
              </Text>
              <Text size="xs">·</Text>
              <IconClock size={14} />
              <Text size="xs">{durationShort}</Text>
            </Group>
          </Group>
          <Avatar.Group spacing="sm">
            {PARTICIPANTS.map((p) => (
              <Avatar key={p.id} size={24} radius="xl" color={p.color} title={p.name}>
                {p.initials}
              </Avatar>
            ))}
          </Avatar.Group>
          {typingVisible && (
            <Text size="xs" c="dimmed" fs="italic">
              Sarah is typing…
            </Text>
          )}
        </Group>
      </Group>

      {shareActive && shareMinimized && (
        <Group
          px="md"
          py="xs"
          justify="space-between"
          style={{ background: 'var(--mantine-color-teal-light)' }}
        >
          <Text size="sm">
            Screen share minimized — {media.share ? 'You are sharing' : `${media.remoteShareBy} is sharing`}
          </Text>
          <Badge
            color="success"
            variant="filled"
            size="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => setShareLayout('split')}
          >
            Show screen
          </Badge>
        </Group>
      )}

      {shareActive && !shareMinimized && (
        <ScreenShareStage
          selfShare={media.share}
          sharerName={media.share ? 'You' : media.remoteShareBy ?? 'Mike Chen'}
          layout={media.shareLayout}
          onLayoutChange={setShareLayout}
        />
      )}

      <Tabs
        value={workspaceTab}
        onChange={(v) => v && setWorkspaceTab(v as WorkspaceTab)}
        px="md"
        pt="sm"
      >
        <Tabs.List>
          <Tabs.Tab value="questions">
            Questions{' '}
            <Badge size="xs" ml={4} variant="light" circle>
              {tabCounts.questions}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="findings">
            Findings{' '}
            <Badge size="xs" ml={4} variant="light" circle>
              {tabCounts.findings}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="decisions">
            Decisions{' '}
            <Badge size="xs" ml={4} variant="light" circle>
              {tabCounts.decisions}
            </Badge>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Group align="flex-start" gap="sm" p="md" wrap="nowrap" style={{ flex: 1 }}>
        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          {workspaceItems.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No items in this view.
            </Text>
          ) : (
            workspaceItems.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                variant={workspaceTab}
                expanded={expandedQuestion === q.id}
                answering={answeringQuestion === q.id}
                discussionOpen={discussionOpen === q.id}
                selectedDecision={selectedDecision[q.id]}
                onToggle={() => toggleQuestion(q.id)}
                onStartAnswer={() => startAddAnswer(q.id)}
                onCancelAnswer={cancelAddAnswer}
                onSubmitAnswer={(text) => submitAnswer(q.id, text)}
                onToggleDiscussion={() => toggleDiscussion(q.id)}
                onSelectDecision={(choice) =>
                  setSelectedDecision((prev) => ({ ...prev, [q.id]: choice }))
                }
                onRecordDecision={() => recordDecision(q.id)}
              />
            ))
          )}
        </Stack>
        <LiveActivity history={history} />
      </Group>
    </Stack>
  );
}
