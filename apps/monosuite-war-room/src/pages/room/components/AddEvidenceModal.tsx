import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  FileButton,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconLink,
  IconNotes,
  IconPaperclip,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { formatBytes } from '@monosuite/utils';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import {
  evidenceFileType,
  hostnameFromUrl,
  isValidHttpUrl,
  type EvidenceDraft,
  type EvidenceKind,
} from '../data';

interface AddEvidenceModalProps {
  opened: boolean;
  initialKind?: EvidenceKind;
  onClose: () => void;
  onAdd: (drafts: EvidenceDraft[]) => void;
}

interface PickedFile {
  id: string;
  name: string;
  size: number;
}

export function AddEvidenceModal({
  opened,
  initialKind = 'file',
  onClose,
  onAdd,
}: AddEvidenceModalProps) {
  const [tab, setTab] = useState<EvidenceKind>(initialKind);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [url, setUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const resetRef = useRef<() => void>(null);

  useEffect(() => {
    if (!opened) return;
    setTab(initialKind);
    setFiles([]);
    setUrl('');
    setLinkTitle('');
    setNoteTitle('');
    setNoteBody('');
    setAttempted(false);
    setDropActive(false);
    resetRef.current?.();
  }, [opened, initialKind]);

  const addFiles = (picked: File[] | File | null) => {
    const next = Array.isArray(picked) ? picked : picked ? [picked] : [];
    if (next.length === 0) return;
    setFiles((current) => {
      const names = new Set(current.map((file) => file.name));
      const extra = next
        .filter((file) => !names.has(file.name))
        .map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
        }));
      return [...current, ...extra];
    });
  };

  const urlError =
    attempted && url.trim()
      ? isValidHttpUrl(url)
        ? undefined
        : 'Enter a valid http(s) URL'
      : attempted && !url.trim()
        ? 'Required'
        : undefined;
  const noteError = attempted && !noteBody.trim() ? 'Required' : undefined;

  const dirty =
    files.length > 0 ||
    Boolean(url.trim() || linkTitle.trim() || noteTitle.trim() || noteBody.trim());

  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(opened, dirty, onClose);

  const submit = () => {
    setAttempted(true);
    if (tab === 'file' && files.length > 0) {
      onAdd(
        files.map((file) => ({
          kind: 'file' as const,
          name: file.name,
          type: evidenceFileType(file.name),
          sizeBytes: file.size,
        })),
      );
      return;
    }
    if (tab === 'link' && isValidHttpUrl(url)) {
      const trimmed = url.trim();
      onAdd([
        {
          kind: 'link',
          name: linkTitle.trim() || hostnameFromUrl(trimmed),
          url: trimmed,
        },
      ]);
      return;
    }
    if (tab === 'note' && noteBody.trim()) {
      const body = noteBody.trim();
      onAdd([
        {
          kind: 'note',
          name: noteTitle.trim() || body.slice(0, 48),
          note: body,
        },
      ]);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={requestClose}
        size="lg"
        centered
        data-testid="add-evidence-modal"
        title={
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Add evidence
            </Text>
            <Text size="sm" c="dimmed" fw={400}>
              Attach a file, point to a source, or record an investigator note
            </Text>
          </Stack>
        }
      >
        <Stack gap="md">
          <Tabs value={tab} onChange={(value) => value && setTab(value as EvidenceKind)}>
            <Tabs.List>
              <Tabs.Tab value="file" leftSection={<IconUpload size={16} />}>
                Upload file
              </Tabs.Tab>
              <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
                Reference link
              </Tabs.Tab>
              <Tabs.Tab value="note" leftSection={<IconNotes size={16} />}>
                Evidence note
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="file" pt="md">
              <Stack gap="sm">
                <FileButton resetRef={resetRef} onChange={addFiles} multiple>
                  {(props) => (
                    <Box
                      {...props}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload evidence files"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          props.onClick();
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropActive(true);
                      }}
                      onDragLeave={() => setDropActive(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDropActive(false);
                        addFiles(Array.from(event.dataTransfer.files));
                      }}
                      p="lg"
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        border: `1px dashed ${
                          dropActive
                            ? 'var(--mantine-color-teal-filled)'
                            : 'var(--monosuite-color-border)'
                        }`,
                        background: dropActive
                          ? 'var(--mantine-color-teal-light)'
                          : 'var(--monosuite-color-surface-sunken)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <Stack gap={6} align="center">
                        <ThemeIcon variant="light" color="teal" size="lg">
                          <IconPaperclip size={18} />
                        </ThemeIcon>
                        <Text size="sm" fw={600}>
                          Drop files here or browse
                        </Text>
                        <Text size="xs" c="dimmed">
                          Logs, captures, screenshots, and exports from this incident
                        </Text>
                      </Stack>
                    </Box>
                  )}
                </FileButton>

                {files.length > 0 ? (
                  <Stack gap={6}>
                    {files.map((file) => (
                      <Group
                        key={file.id}
                        wrap="nowrap"
                        p="sm"
                        style={{
                          borderRadius: 'var(--mantine-radius-sm)',
                          background: 'var(--monosuite-color-surface)',
                          border: '1px solid var(--monosuite-color-border)',
                        }}
                      >
                        <ThemeIcon variant="light" color="teal" size="md">
                          <IconPaperclip size={14} />
                        </ThemeIcon>
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={600} truncate>
                            {file.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {evidenceFileType(file.name)} · {formatBytes(file.size)}
                          </Text>
                        </Stack>
                        <Tooltip label="Remove file">
                          <ActionIcon
                            variant="subtle"
                            color="danger"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ))}
                  </Stack>
                ) : attempted ? (
                  <Text size="xs" c="danger">
                    Choose at least one file
                  </Text>
                ) : null}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="link" pt="md">
              <Stack gap="sm">
                <Text size="sm" c="dimmed">
                  Point the room at an external source such as a ticket, TI report, or vendor
                  advisory. The link stays viewable in the evidence list.
                </Text>
                <TextInput
                  label="URL"
                  placeholder="https://"
                  required
                  value={url}
                  error={urlError}
                  onChange={(event) => setUrl(event.currentTarget.value)}
                />
                <TextInput
                  label="Title"
                  placeholder="Optional — hostname is used if empty"
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.currentTarget.value)}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="note" pt="md">
              <Stack gap="sm">
                <Text size="sm" c="dimmed">
                  Capture an observation that is not a file or a URL — timing, rationale, or a
                  finding that should stay with the room.
                </Text>
                <TextInput
                  label="Title"
                  placeholder="Optional — first line of the note is used if empty"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.currentTarget.value)}
                />
                <Textarea
                  label="Note"
                  placeholder="What was observed, why it matters, and what to check next"
                  required
                  minRows={4}
                  autosize
                  value={noteBody}
                  error={noteError}
                  onChange={(event) => setNoteBody(event.currentTarget.value)}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={requestClose}>
              Cancel
            </Button>
            <Button leftSection={<IconPaperclip size={16} />} disabled={!dirty} onClick={submit}>
              Add to room
            </Button>
          </Group>
        </Stack>
      </Modal>
      <DiscardChangesModal opened={confirming} onKeepEditing={keepEditing} onDiscard={discard} />
    </>
  );
}
