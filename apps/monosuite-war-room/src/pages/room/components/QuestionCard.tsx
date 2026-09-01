import {
  Avatar,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Radio,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCircleCheck,
  IconMessageCircle,
  IconMessages,
  IconUsers,
} from '@tabler/icons-react';
import { useClickOutside } from '@mantine/hooks';
import { useState } from 'react';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { isOwnContribution } from '../../../shared/constants';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import type { Question, WorkspaceTab } from '../data';
import { ContributionNote } from './ContributionNote';

type NoteKind = 'answer' | 'discussion';

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
  onUpdateAnswer: (answerId: string, text: string) => void;
  onDeleteAnswer: (answerId: string) => void;
  onToggleDiscussion: () => void;
  onSubmitComment: (text: string) => void;
  onUpdateComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onSelectDecision: (choice: string) => void;
  onRecordDecision: () => void;
}

function statusBadge(status: Question['status'], hasDecision: boolean) {
  if (hasDecision || status === 'answered') {
    return (
      <Badge color="success" size="xs" variant="light">
        Answered
      </Badge>
    );
  }
  if (status === 'decision') {
    return (
      <Badge color="warning" size="xs" variant="light">
        Decision
      </Badge>
    );
  }
  return (
    <Badge color="accent" size="xs" variant="light">
      Open
    </Badge>
  );
}

function idLabel(variant: WorkspaceTab, id: number) {
  if (variant === 'findings') return `F-${id}`;
  if (variant === 'decisions') return `D-${id}`;
  return `Q-${id}`;
}

/** Compact investigation item — operational, not a generic discussion card. */
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
  onUpdateAnswer,
  onDeleteAnswer,
  onToggleDiscussion,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onSelectDecision,
  onRecordDecision,
}: QuestionCardProps) {
  const [draft, setDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [editing, setEditing] = useState<{ kind: NoteKind; id: string } | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ kind: NoteKind; id: string } | null>(null);
  const recent = q.answers?.[q.answers.length - 1];
  const hasDiscussion = Boolean(q.discussion && q.discussion.length > 0);
  const effectiveStatus = q.decision ? 'answered' : q.status;
  const canComment = q.status === 'open' || q.status === 'answered';
  const answeringDirty = answering && draft.trim().length > 0;
  const commentDirty = commentDraft.trim().length > 0;
  const composerDirty = answeringDirty || commentDirty;

  const resetComposers = () => {
    setDraft('');
    setCommentDraft('');
    onCancelAnswer();
  };

  const { requestClose: requestLeaveComposer, confirming: confirmComposer, discard: discardComposer, keepEditing: keepComposer } =
    useDiscardGuard(answering || commentDirty, composerDirty, resetComposers);

  const answerFormRef = useClickOutside<HTMLDivElement>(
    () => {
      if (answering && !confirmComposer) requestLeaveComposer();
    },
    undefined,
    undefined,
    answering && !confirmComposer,
  );
  const commentFormRef = useClickOutside<HTMLDivElement>(
    () => {
      if (commentDirty && !confirmComposer) requestLeaveComposer();
    },
    undefined,
    undefined,
    commentDirty && !confirmComposer,
  );

  const startEdit = (kind: NoteKind, id: string, text: string) => {
    setEditing({ kind, id });
    setEditDraft(text);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditDraft('');
  };

  const saveEdit = () => {
    if (!editing || !editDraft.trim()) return;
    if (editing.kind === 'answer') onUpdateAnswer(editing.id, editDraft);
    else onUpdateComment(editing.id, editDraft);
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'answer') onDeleteAnswer(deleteTarget.id);
    else onDeleteComment(deleteTarget.id);
    if (editing?.id === deleteTarget.id) cancelEdit();
    setDeleteTarget(null);
  };

  return (
    <Paper
      withBorder={false}
      p="sm"
      radius="md"
      shadow="none"
      className="monosuite-investigation-item"
      style={{
        background: 'var(--monosuite-color-surface)',
        border: `1px solid ${expanded ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 45%, var(--monosuite-color-border))' : 'var(--monosuite-color-border)'}`,
        boxShadow: expanded ? 'var(--mantine-shadow-xs)' : undefined,
        borderLeft:
          variant === 'findings'
            ? '3px solid var(--mantine-color-accent-filled)'
            : variant === 'decisions'
              ? '3px solid var(--mantine-color-warning-filled)'
              : expanded
                ? '3px solid var(--mantine-color-teal-filled)'
                : '3px solid color-mix(in srgb, var(--monosuite-color-border) 80%, transparent)',
      }}
    >
      <UnstyledButton
        onClick={() => {
          if (composerDirty) requestLeaveComposer();
          else onToggle();
        }}
        w="100%"
        style={{ textAlign: 'left' }}
      >
        <Group align="flex-start" wrap="nowrap" gap="sm">
          <Badge
            variant="light"
            color={variant === 'findings' ? 'accent' : variant === 'decisions' ? 'warning' : 'teal'}
            size="sm"
            radius="sm"
            style={{ flexShrink: 0, fontFamily: 'monospace', letterSpacing: '0.04em' }}
          >
            {idLabel(variant, q.id)}
          </Badge>
          <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
              <Text size="sm" fw={600} style={{ flex: 1, minWidth: 0 }}>
                {q.text}
              </Text>
              {statusBadge(effectiveStatus, Boolean(q.decision))}
            </Group>

            <Group gap="md" wrap="wrap">
              <Text size="xs" c="dimmed">
                {q.answerCount} answer{q.answerCount !== 1 ? 's' : ''}
              </Text>
              <Group gap={4}>
                <IconUsers size={12} style={{ opacity: 0.65 }} />
                <Text size="xs" c="dimmed">
                  {q.participantCount}
                </Text>
              </Group>
              <Group gap={4}>
                {hasDiscussion ? (
                  <IconMessages size={12} style={{ opacity: 0.65 }} />
                ) : (
                  <IconMessageCircle size={12} style={{ opacity: 0.4 }} />
                )}
                <Text size="xs" c="dimmed">
                  {hasDiscussion ? 'Discussion available' : 'No discussion'}
                </Text>
              </Group>
            </Group>

            {!expanded && recent && (
              <Group gap={6} wrap="nowrap" align="flex-start">
                <Avatar size={18} radius="xl" color="teal">
                  {recent.author
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </Avatar>
                <Text size="xs" c="dimmed" lineClamp={1} style={{ minWidth: 0 }}>
                  <Text span fw={600} c="dimmed">
                    {recent.author}:
                  </Text>{' '}
                  {recent.text}
                </Text>
              </Group>
            )}
          </Stack>
        </Group>
      </UnstyledButton>

      {expanded && (
        <Stack gap="sm" mt="sm" pl={52}>
          {(q.status === 'decision' || q.decision) &&
            (q.decision ? (
              <Paper
                withBorder={false}
                shadow="none"
                p="sm"
                radius="sm"
                bg="var(--mantine-color-success-light)"
              >
                <Group gap={6} mb={4}>
                  <IconCircleCheck size={16} />
                  <Text size="sm" fw={600}>
                    Decision recorded
                  </Text>
                </Group>
                <Text size="xs">
                  <Text span fw={700}>
                    {q.decision.choice}
                  </Text>
                  {' · '}
                  {q.decision.by} · {q.decision.at}
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
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    {variant === 'findings' ? 'Evidence trail' : 'Recent answers'}
                  </Text>
                  {q.answers.map((a) => (
                    <Paper
                      key={a.id}
                      withBorder={false}
                      shadow="none"
                      p="xs"
                      radius="sm"
                      bg="var(--monosuite-color-surface-sunken)"
                    >
                      <ContributionNote
                        author={a.author}
                        text={a.text}
                        edited={a.edited}
                        own={isOwnContribution(a.author)}
                        editing={editing?.kind === 'answer' && editing.id === a.id}
                        draft={editDraft}
                        onDraftChange={setEditDraft}
                        onStartEdit={() => startEdit('answer', a.id, a.text)}
                        onCancelEdit={cancelEdit}
                        onSaveEdit={saveEdit}
                        onRequestDelete={() => setDeleteTarget({ kind: 'answer', id: a.id })}
                      />
                    </Paper>
                  ))}
                </Stack>
              )}

              {q.status === 'open' && answering && (
                <Stack gap="xs" ref={answerFormRef}>
                  <Textarea
                    placeholder="Add your answer…"
                    aria-label="Answer text"
                    minRows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        requestLeaveComposer();
                      }
                    }}
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
                      onClick={requestLeaveComposer}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              )}

              {discussionOpen && canComment && (
                <Stack gap={6}>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Discussion
                  </Text>
                  {(q.discussion ?? []).length === 0 ? (
                    <Text size="xs" c="dimmed">
                      No comments yet. Add one to keep the thread with this question.
                    </Text>
                  ) : (
                    (q.discussion ?? []).map((d) => (
                      <Paper
                        key={d.id}
                        withBorder={false}
                        shadow="none"
                        p="xs"
                        radius="sm"
                        bg="var(--monosuite-color-surface-sunken)"
                      >
                        <ContributionNote
                          author={d.author}
                          text={d.text}
                          edited={d.edited}
                          own={isOwnContribution(d.author)}
                          editing={editing?.kind === 'discussion' && editing.id === d.id}
                          draft={editDraft}
                          saveLabel="Save comment"
                          onDraftChange={setEditDraft}
                          onStartEdit={() => startEdit('discussion', d.id, d.text)}
                          onCancelEdit={cancelEdit}
                          onSaveEdit={saveEdit}
                          onRequestDelete={() => setDeleteTarget({ kind: 'discussion', id: d.id })}
                        />
                      </Paper>
                    ))
                  )}
                  <Stack gap="xs" ref={commentFormRef}>
                    <Textarea
                      placeholder="Add a comment…"
                      aria-label="Comment text"
                      minRows={2}
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          requestLeaveComposer();
                        }
                      }}
                      size="sm"
                    />
                    <Button
                      size="xs"
                      w="fit-content"
                      variant="default"
                      disabled={!commentDraft.trim()}
                      onClick={() => {
                        onSubmitComment(commentDraft);
                        setCommentDraft('');
                      }}
                    >
                      Post comment
                    </Button>
                  </Stack>
                </Stack>
              )}

              {q.status === 'open' && !answering && (
                <Group gap="xs">
                  <Button size="xs" variant="default" onClick={onStartAnswer}>
                    Add answer
                  </Button>
                  <Button size="xs" variant="subtle" onClick={onToggleDiscussion}>
                    {discussionOpen ? 'Hide discussion' : hasDiscussion ? 'View discussion' : 'Add comment'}
                  </Button>
                </Group>
              )}
              {q.status === 'answered' && canComment && !answering && (
                <Button size="xs" variant="subtle" w="fit-content" onClick={onToggleDiscussion}>
                  {discussionOpen ? 'Hide discussion' : hasDiscussion ? 'View discussion' : 'Add comment'}
                </Button>
              )}
            </>
          )}
        </Stack>
      )}

      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.kind === 'discussion' ? 'Delete comment?' : 'Delete answer?'}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            {deleteTarget?.kind === 'discussion'
              ? 'This removes your comment from the discussion thread.'
              : 'This removes your answer from the investigation thread.'}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <DiscardChangesModal
        opened={confirmComposer}
        onKeepEditing={keepComposer}
        onDiscard={discardComposer}
        title="Discard draft?"
        description="Your unpublished answer or comment will be discarded."
      />
    </Paper>
  );
}
