import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { IconMessage, IconSend } from '@tabler/icons-react';
import { CURRENT_USER, isOwnContribution } from '../../../shared/constants';
import { CHAT_MESSAGES, PARTICIPANTS, type ChatMessage } from '../data';
import { ContributionNote } from './ContributionNote';

function authorMeta(author: string) {
  if (isOwnContribution(author)) {
    return { name: CURRENT_USER.name, initials: CURRENT_USER.initials, color: 'brand' };
  }
  const person = PARTICIPANTS.find((item) => item.name === author);
  if (person) {
    return { name: person.name, initials: person.initials, color: person.color };
  }
  const parts = author.trim().split(/\s+/);
  const initials = `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`.toUpperCase() || '?';
  return { name: author, initials, color: 'neutral' };
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canSend = draft.trim().length > 0;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight });
  }, [messages, editingId]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      {
        id: `c-${crypto.randomUUID()}`,
        author: CURRENT_USER.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text,
      },
    ]);
    setDraft('');
  };

  return (
    <Box className="monosuite-context-chat-thread">
      <Box px="md" pt="sm" pb="xs" style={{ flexShrink: 0 }}>
        <Text fw={700} size="sm">
          Room chat{' '}
          <Text span c="dimmed" fw={400}>
            · {messages.length}
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          Visible to everyone in this room
        </Text>
      </Box>

      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        type="auto"
        viewportRef={viewportRef}
        px="md"
        pb="sm"
      >
        {messages.length === 0 ? (
          <Stack
            gap={6}
            align="center"
            py="xl"
            px="sm"
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              background: 'var(--monosuite-color-surface-sunken)',
            }}
          >
            <ThemeIcon variant="light" color="teal" size="lg">
              <IconMessage size={16} />
            </ThemeIcon>
            <Text size="sm" fw={600} ta="center">
              No messages yet
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Coordinate the response here. Investigation answers still belong on the question
              thread.
            </Text>
          </Stack>
        ) : (
          <Stack gap="sm">
            {messages.map((message) => {
              const own = isOwnContribution(message.author);
              const meta = authorMeta(message.author);
              return (
                <Group key={message.id} gap="sm" wrap="nowrap" align="flex-start">
                  <Avatar color={meta.color} radius="xl" size={28} style={{ flexShrink: 0 }}>
                    {meta.initials}
                  </Avatar>
                  <Box
                    p="xs"
                    className="monosuite-context-chat-bubble"
                    data-own={own ? 'true' : undefined}
                  >
                    <ContributionNote
                      author={own ? `${meta.name} · You` : meta.name}
                      text={message.text}
                      time={message.time}
                      edited={message.edited}
                      own={own}
                      editing={editingId === message.id}
                      draft={editDraft}
                      saveLabel="Save"
                      onDraftChange={setEditDraft}
                      onStartEdit={() => {
                        setEditingId(message.id);
                        setEditDraft(message.text);
                      }}
                      onCancelEdit={() => {
                        setEditingId(null);
                        setEditDraft('');
                      }}
                      onSaveEdit={() => {
                        const next = editDraft.trim();
                        if (!next || !editingId) return;
                        setMessages((current) =>
                          current.map((item) =>
                            item.id === editingId ? { ...item, text: next, edited: true } : item,
                          ),
                        );
                        setEditingId(null);
                        setEditDraft('');
                      }}
                      onRequestDelete={() => setDeleteId(message.id)}
                    />
                  </Box>
                </Group>
              );
            })}
          </Stack>
        )}
      </ScrollArea>

      <Box className="monosuite-context-chat-composer" px="md" py="sm">
        <Box className="monosuite-context-chat-composer-field">
          <Textarea
            aria-label="Chat message"
            placeholder="Message the room…"
            autosize
            minRows={1}
            maxRows={4}
            variant="unstyled"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          />
          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
            <Text size="xs" c="dimmed">
              Enter to send
            </Text>
            <Tooltip label="Send message">
              <ActionIcon
                variant="filled"
                color="teal"
                size="md"
                aria-label="Send message"
                disabled={!canSend}
                onClick={send}
              >
                <IconSend size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      </Box>

      <Modal
        opened={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete message?"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">This removes your message from the room chat.</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => {
                if (!deleteId) return;
                setMessages((current) => current.filter((item) => item.id !== deleteId));
                if (editingId === deleteId) {
                  setEditingId(null);
                  setEditDraft('');
                }
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
