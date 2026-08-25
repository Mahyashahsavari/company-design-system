import {
  Avatar,
  Badge,
  Button,
  Group,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconDatabase,
  IconDeviceDesktop,
  IconList,
  IconPaperclip,
  IconServer,
  IconSend,
  IconUserPlus,
} from '@tabler/icons-react';
import {
  ASSETS,
  CHAT_MESSAGES,
  EVIDENCE_ITEMS,
  PARTICIPANTS,
  SEVERITY_COLOR,
  type ChatMessage,
  type ContextTab,
  type HistoryEntry,
} from '../data';

interface ContextSidebarProps {
  tab: ContextTab;
  onTabChange: (tab: ContextTab) => void;
  history: HistoryEntry[];
  onInvite: () => void;
  onAddEvidence: () => void;
}

const ASSET_ICONS = {
  server: IconServer,
  database: IconDatabase,
  desktop: IconDeviceDesktop,
} as const;

export function ContextSidebar({
  tab,
  onTabChange,
  history,
  onInvite,
  onAddEvidence,
}: ContextSidebarProps) {
  const [chatDraft, setChatDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);

  return (
    <Stack h="100%" gap={0}>
      <Tabs
        value={tab}
        onChange={(v) => v && onTabChange(v as ContextTab)}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Tabs.List px="xs" pt="xs" style={{ flexWrap: 'wrap' }}>
          <Tabs.Tab value="participants">Participants</Tabs.Tab>
          <Tabs.Tab value="chat">Chat</Tabs.Tab>
          <Tabs.Tab value="assets">Assets</Tabs.Tab>
          <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </Tabs.List>

        <ScrollArea style={{ flex: 1 }} px="md" py="sm">
          <Tabs.Panel value="participants">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Room Participants{' '}
                <Text span c="dimmed" fw={400}>
                  · {PARTICIPANTS.length}
                </Text>
              </Text>
              {PARTICIPANTS.map((p) => (
                <Group key={p.id} gap="sm" wrap="nowrap">
                  <Avatar size="sm" radius="xl" color={p.color}>
                    {p.initials}
                  </Avatar>
                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text size="sm" fw={600}>
                      {p.name}
                      {p.typing ? (
                        <Text span size="xs" c="dimmed" ml={6}>
                          typing…
                        </Text>
                      ) : null}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {p.role}
                    </Text>
                  </Stack>
                  <Badge size="sm" color={p.status === 'online' ? 'success' : 'warning'}>
                    {p.status === 'online' ? 'Online' : 'Away'}
                  </Badge>
                </Group>
              ))}
              <Button size="xs" variant="subtle" leftSection={<IconUserPlus size={14} />} onClick={onInvite}>
                Invite participant
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="chat">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Room Chat
              </Text>
              <Stack gap={8}>
                {messages.map((m) => (
                  <Stack
                    key={m.id}
                    gap={2}
                    p="xs"
                    style={{
                      borderRadius: 6,
                      background: 'var(--monosuite-color-surface-sunken)',
                    }}
                  >
                    <Group justify="space-between" gap="xs">
                      <Text size="xs" fw={700}>
                        {m.author}
                      </Text>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {m.time}
                      </Text>
                    </Group>
                    <Text size="sm">{m.text}</Text>
                  </Stack>
                ))}
              </Stack>
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="Message the room…"
                  aria-label="Chat message"
                  size="xs"
                  style={{ flex: 1 }}
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatDraft.trim()) {
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `c-${Date.now()}`,
                          author: 'You',
                          time: new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                          text: chatDraft.trim(),
                        },
                      ]);
                      setChatDraft('');
                    }
                  }}
                />
                <Button
                  size="xs"
                  leftSection={<IconSend size={14} />}
                  disabled={!chatDraft.trim()}
                  onClick={() => {
                    if (!chatDraft.trim()) return;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `c-${Date.now()}`,
                        author: 'You',
                        time: new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        text: chatDraft.trim(),
                      },
                    ]);
                    setChatDraft('');
                  }}
                >
                  Send
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="assets">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Affected Assets{' '}
                <Text span c="dimmed" fw={400}>
                  · {ASSETS.length}
                </Text>
              </Text>
              {ASSETS.map((a) => {
                const Icon = ASSET_ICONS[a.icon];
                return (
                  <Group
                    key={a.id}
                    gap="sm"
                    p="sm"
                    wrap="nowrap"
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 6,
                    }}
                  >
                    <ThemeIcon variant="light" color="neutral" size="lg">
                      <Icon size={16} />
                    </ThemeIcon>
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={600}>
                        {a.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {a.type}
                      </Text>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {a.ip}
                      </Text>
                    </Stack>
                    <Badge size="sm" color={SEVERITY_COLOR[a.severity]}>
                      {a.severity}
                    </Badge>
                  </Group>
                );
              })}
              <Button size="xs" variant="subtle" leftSection={<IconList size={14} />}>
                View all assets
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="evidence">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="sm">
                  Evidence
                </Text>
                <Button
                  size="compact-xs"
                  variant="light"
                  leftSection={<IconPaperclip size={12} />}
                  onClick={onAddEvidence}
                >
                  Add
                </Button>
              </Group>
              {EVIDENCE_ITEMS.map((item) => (
                <Stack
                  key={item.id}
                  gap={2}
                  p="sm"
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 6,
                  }}
                >
                  <Text size="sm" fw={600}>
                    {item.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.type} · {item.by} · {item.time}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Room History
              </Text>
              {history.map((h, i) => (
                <Group key={`${h.time}-${i}`} gap="sm" align="flex-start" wrap="nowrap">
                  <Text size="xs" c="dimmed" ff="monospace" w={40}>
                    {h.time}
                  </Text>
                  <Text size="xs" fw={h.highlight ? 700 : 400}>
                    <strong>{h.actor}</strong> {h.action}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Tabs.Panel>
        </ScrollArea>
      </Tabs>
    </Stack>
  );
}
