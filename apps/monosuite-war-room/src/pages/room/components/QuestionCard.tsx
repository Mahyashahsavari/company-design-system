import {
  Badge,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useState } from 'react';
import type { Question, WorkspaceTab } from '../data';

interface QuestionCardProps {
  question: Question;
  variant: WorkspaceTab;
  expanded: boolean;
  answering: boolean;
  discussionOpen: boolean;
  selectedDecision?: string;
  onToggle: () => void;
  onStartAnswer: () => void;
  onCancelAnswer: () => void;
  onSubmitAnswer: (text: string) => void;
  onToggleDiscussion: () => void;
  onSelectDecision: (choice: string) => void;
  onRecordDecision: () => void;
}

function statusBadge(status: Question['status']) {
  if (status === 'open') return <Badge color="accent" size="sm">Open</Badge>;
  if (status === 'decision')
    return (
      <Badge color="warning" size="sm">
        Decision required
      </Badge>
    );
  return (
    <Badge color="success" size="sm">
      Answered
    </Badge>
  );
}

export function QuestionCard({
  question: q,
  variant,
  expanded,
  answering,
  discussionOpen,
  selectedDecision,
  onToggle,
  onStartAnswer,
  onCancelAnswer,
  onSubmitAnswer,
  onToggleDiscussion,
  onSelectDecision,
  onRecordDecision,
}: QuestionCardProps) {
  const [draft, setDraft] = useState('');
  const numLabel = variant === 'findings' ? `F${q.id}` : `Q${q.id}`;
  const meta =
    q.status !== 'decision' && !q.decision
      ? `${q.answerCount} answer${q.answerCount !== 1 ? 's' : ''} · ${q.participantCount} participant${q.participantCount !== 1 ? 's' : ''}`
      : null;

  return (
    <Paper
      withBorder
      p="sm"
      radius="sm"
      style={{
        borderLeft:
          variant === 'findings'
            ? '3px solid var(--mantine-color-accent-5)'
            : expanded
              ? '3px solid var(--mantine-color-teal-filled)'
              : undefined,
      }}
    >
      <UnstyledButton onClick={onToggle} w="100%" style={{ textAlign: 'left' }}>
        <Group align="flex-start" wrap="nowrap" gap="sm">
          <Badge variant="light" color="neutral" size="sm">
            {numLabel}
          </Badge>
          <Stack gap={4} style={{ flex: 1 }}>
            <Group justify="space-between" wrap="wrap">
              <Text size="sm" fw={600}>
                {q.text}
              </Text>
              {statusBadge(q.decision ? 'answered' : q.status)}
            </Group>
            {meta && (
              <Text size="xs" c="dimmed">
                {meta}
              </Text>
            )}
          </Stack>
        </Group>
      </UnstyledButton>

      {expanded && (
        <Stack gap="sm" mt="sm" pl={42}>
          {(q.status === 'decision' || q.decision) &&
            (q.decision ? (
              <Paper p="sm" radius="sm" bg="var(--mantine-color-success-light)">
                <Group gap={6} mb={4}>
                  <IconCircleCheck size={16} color="var(--mantine-color-success-6)" />
                  <Text size="sm" fw={600}>
                    Decision recorded
                  </Text>
                </Group>
                <Text size="xs">
                  <strong>Decision:</strong> {q.decision.choice}
                </Text>
                <Text size="xs">
                  <strong>By:</strong> {q.decision.by}
                </Text>
                <Text size="xs">
                  <strong>At:</strong> {q.decision.at}
                </Text>
              </Paper>
            ) : (
              <Stack gap="sm">
                <Radio.Group
                  value={selectedDecision}
                  onChange={onSelectDecision}
                  name={`decision-${q.id}`}
                >
                  <Stack gap={6}>
                    {(q.options ?? []).map((opt) => (
                      <Radio key={opt} value={opt} label={opt} size="sm" />
                    ))}
                  </Stack>
                </Radio.Group>
                <Button size="xs" w="fit-content" onClick={onRecordDecision}>
                  Record Decision
                </Button>
              </Stack>
            ))}

          {(q.status === 'open' || q.status === 'answered') && (
            <>
              {q.answers && q.answers.length > 0 && (
                <Stack gap={6}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {variant === 'findings' ? 'Evidence' : 'Recent answers'}
                  </Text>
                  {q.answers.map((a, i) => (
                    <Paper
                      key={i}
                      p="xs"
                      radius="sm"
                      bg="var(--monosuite-color-surface-sunken)"
                    >
                      <Text size="xs" fw={600}>
                        {a.author}
                      </Text>
                      <Text size="sm" fs="italic">
                        &ldquo;{a.text}&rdquo;
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              )}

              {q.status === 'open' && answering && (
                <Stack gap="xs">
                  <Textarea
                    placeholder="Add your answer…"
                    aria-label="Answer text"
                    minRows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.currentTarget.value)}
                    size="sm"
                  />
                  <Group gap="xs">
                    <Button
                      size="xs"
                      onClick={() => {
                        onSubmitAnswer(draft);
                        setDraft('');
                      }}
                    >
                      Submit answer
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setDraft('');
                        onCancelAnswer();
                      }}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              )}

              {discussionOpen && q.discussion && (
                <Stack gap={4}>
                  {q.discussion.map((d, i) => (
                    <Text key={i} size="xs">
                      <strong>{d.author}:</strong> {d.text}
                    </Text>
                  ))}
                </Stack>
              )}

              {q.status === 'open' && !answering && (
                <Group gap="xs">
                  <Button size="xs" variant="default" onClick={onStartAnswer}>
                    Add answer
                  </Button>
                  <Button size="xs" variant="subtle" onClick={onToggleDiscussion}>
                    View discussion
                  </Button>
                </Group>
              )}
            </>
          )}
        </Stack>
      )}
    </Paper>
  );
}
