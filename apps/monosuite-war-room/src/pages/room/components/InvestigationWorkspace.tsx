import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Indicator,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconActivity,
  IconClock,
  IconRadar2,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import { ROOM_MEDIA_DOCK_SAFE_ZONE } from '../../../shared/constants';
import { PARTICIPANTS, type WorkspaceTab } from '../data';
import type { RoomState } from '../hooks/useRoomState';
import { LiveActivity } from './LiveActivity';
import { QuestionCard } from './QuestionCard';

interface InvestigationWorkspaceProps {
  room: RoomState;
  dockSafeZone?: boolean;
  dockSafeZoneHeight?: number;
}

const tabStyles = {
  tab: {
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    paddingInline: 14,
    paddingBlock: 8,
  },
};

/** Primary investigation surface — full-width SOC workspace. */
export function InvestigationWorkspace({
  room,
  dockSafeZone = false,
  dockSafeZoneHeight = ROOM_MEDIA_DOCK_SAFE_ZONE,
}: InvestigationWorkspaceProps) {
  const [activityOpen, setActivityOpen] = useState(false);
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
    updateAnswer,
    deleteAnswer,
    discussionOpen,
    toggleDiscussion,
    submitDiscussion,
    updateDiscussion,
    deleteDiscussion,
    selectedDecision,
    setSelectedDecision,
    recordDecision,
    history,
    typingVisible,
    durationShort,
  } = room;

  const tabLabel = (base: string, count: number) => `${base} · ${count}`;

  return (
    <Stack
      gap={0}
      className="monosuite-room-panel monosuite-investigation-workspace"
      style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--monosuite-color-border)',
        background: 'var(--monosuite-color-surface)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Box className="monosuite-investigation-accent" aria-hidden />

      <Group
        px="md"
        py={8}
        justify="space-between"
        wrap="nowrap"
        gap="sm"
        className="monosuite-investigation-header"
      >
        <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size={30}
            radius="sm"
            variant="light"
            color="brand"
            aria-hidden
            style={{ flexShrink: 0 }}
          >
            <IconRadar2 size={16} />
          </ThemeIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
              Investigation
            </Text>
            <Text size="sm" fw={700} lineClamp={1}>
              Collaboration workspace
            </Text>
          </Stack>
        </Group>

        <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Indicator processing color="success" size={8}>
            <Badge color="success" variant="light" size="sm">
              LIVE
            </Badge>
          </Indicator>
          <Group gap={4} c="dimmed" wrap="nowrap" visibleFrom="sm">
            <IconUsers size={14} aria-hidden />
            <Text size="xs" fw={600}>
              {PARTICIPANTS.length}
            </Text>
          </Group>
          <Group gap={4} c="dimmed" wrap="nowrap" visibleFrom="sm">
            <IconClock size={14} aria-hidden />
            <Text size="xs" fw={600}>
              {durationShort}
            </Text>
          </Group>
          {typingVisible && (
            <Text size="xs" c="dimmed" fs="italic" visibleFrom="lg">
              Sarah is typing…
            </Text>
          )}
          <Tooltip label={activityOpen ? 'Hide activity feed' : 'Show activity feed'}>
            <ActionIcon
              variant={activityOpen ? 'light' : 'subtle'}
              color={activityOpen ? 'teal' : 'neutral'}
              size="md"
              aria-label={activityOpen ? 'Hide activity feed' : 'Show activity feed'}
              aria-pressed={activityOpen}
              onClick={() => setActivityOpen((open) => !open)}
            >
              <IconActivity size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Tabs
        value={workspaceTab}
        onChange={(v) => v && setWorkspaceTab(v as WorkspaceTab)}
        className="monosuite-investigation-tabs"
        styles={tabStyles}
      >
        <Tabs.List
          px="md"
          className="monosuite-hide-scrollbar-x monosuite-investigation-tablist"
          style={{
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            borderBottom: '1px solid var(--monosuite-color-border)',
          }}
        >
          <Tabs.Tab value="questions">{tabLabel('Questions', tabCounts.questions)}</Tabs.Tab>
          <Tabs.Tab value="findings">{tabLabel('Findings', tabCounts.findings)}</Tabs.Tab>
          <Tabs.Tab value="decisions">{tabLabel('Decisions', tabCounts.decisions)}</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Box
        className="monosuite-room-workspace-scroll monosuite-investigation-body"
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          paddingBottom: dockSafeZone ? dockSafeZoneHeight : undefined,
        }}
      >
        <Box px="md" py="sm" pr={activityOpen ? 'min(300px, 38vw)' : undefined} style={{ width: '100%' }}>
          <Stack gap="sm">
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
                  onUpdateAnswer={(answerId, text) => updateAnswer(q.id, answerId, text)}
                  onDeleteAnswer={(answerId) => deleteAnswer(q.id, answerId)}
                  onToggleDiscussion={() => toggleDiscussion(q.id)}
                  onSubmitComment={(text) => submitDiscussion(q.id, text)}
                  onUpdateComment={(commentId, text) => updateDiscussion(q.id, commentId, text)}
                  onDeleteComment={(commentId) => deleteDiscussion(q.id, commentId)}
                  onSelectDecision={(choice) =>
                    setSelectedDecision((prev) => ({ ...prev, [q.id]: choice }))
                  }
                  onRecordDecision={() => recordDecision(q.id)}
                />
              ))
            )}
          </Stack>
        </Box>

        {activityOpen && (
          <Box className="monosuite-investigation-activity-rail">
            <Group
              px="sm"
              py={8}
              justify="space-between"
              wrap="nowrap"
              style={{
                borderBottom: '1px solid var(--monosuite-color-border)',
                background: 'var(--monosuite-color-surface-sunken)',
                flexShrink: 0,
              }}
            >
              <Group gap={6}>
                <IconActivity size={14} color="var(--mantine-color-teal-filled)" aria-hidden />
                <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
                  Live activity
                </Text>
              </Group>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="neutral"
                aria-label="Close activity feed"
                onClick={() => setActivityOpen(false)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
            <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <LiveActivity history={history} variant="rail" />
            </Box>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
