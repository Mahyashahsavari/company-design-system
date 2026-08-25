import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { MediaDevices } from '../hooks/useRoomState';

interface MediaSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  devices: MediaDevices;
  onApply: (devices: MediaDevices) => void;
}

export function MediaSettingsModal({
  opened,
  onClose,
  devices,
  onApply,
}: MediaSettingsModalProps) {
  const [draft, setDraft] = useState(devices);

  useEffect(() => {
    if (opened) setDraft(devices);
  }, [opened, devices]);

  return (
    <Modal opened={opened} onClose={onClose} title="Media Settings" centered>

      <Stack gap="md">
        <Select
          label="Microphone"
          data={[
            { value: 'default-mic', label: 'Default Microphone' },
            { value: 'headset-mic', label: 'Headset Microphone (USB)' },
            { value: 'comm-mic', label: 'Communications Headset' },
          ]}
          value={draft.microphone}
          onChange={(v) => v && setDraft((d) => ({ ...d, microphone: v }))}
        />
        <Select
          label="Speaker"
          data={[
            { value: 'default-speaker', label: 'Default Speaker' },
            { value: 'external-speakers', label: 'External Speakers' },
            { value: 'headset-audio', label: 'Headset Earphone' },
          ]}
          value={draft.speaker}
          onChange={(v) => v && setDraft((d) => ({ ...d, speaker: v }))}
        />
        <Select
          label="Camera"
          data={[
            { value: 'integrated', label: 'Integrated Camera' },
            { value: 'studio', label: 'Studio Camera' },
            { value: 'virtual', label: 'Virtual Camera' },
          ]}
          value={draft.camera}
          onChange={(v) => v && setDraft((d) => ({ ...d, camera: v }))}
        />
        <div>
          <Select
            label="Connection"
            data={[
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' },
            ]}
            value={draft.connection}
            onChange={(v) => v && setDraft((d) => ({ ...d, connection: v }))}
          />
          <Text size="xs" c="dimmed" mt={4}>
            Reported quality for this session.
          </Text>
        </div>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onApply(draft)}>Apply</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
