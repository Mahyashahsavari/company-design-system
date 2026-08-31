import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { MediaPermission } from '../data';
import type { MediaDevices } from '../hooks/useRoomState';

interface MediaSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  devices: MediaDevices;
  permission: MediaPermission;
  onApply: (devices: MediaDevices, permission: MediaPermission) => void;
}

export function MediaSettingsModal({
  opened,
  onClose,
  devices,
  permission,
  onApply,
}: MediaSettingsModalProps) {
  const [draft, setDraft] = useState(devices);
  const [perm, setPerm] = useState<MediaPermission>(permission);

  useEffect(() => {
    if (opened) {
      setDraft(devices);
      setPerm(permission);
    }
  }, [opened, devices, permission]);

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
          label="Your camera device"
          data={[
            { value: 'integrated', label: 'Integrated Camera' },
            { value: 'studio', label: 'Studio Camera' },
            { value: 'virtual', label: 'Virtual Camera' },
          ]}
          value={draft.camera}
          onChange={(v) => v && setDraft((d) => ({ ...d, camera: v }))}
        />
        <Select
          label="Camera permission (local)"
          description="Does not affect remote participant cameras."
          data={[
            { value: 'granted', label: 'Granted' },
            { value: 'denied', label: 'Denied' },
            { value: 'unavailable', label: 'Unavailable' },
          ]}
          value={perm}
          onChange={(v) => v && setPerm(v as MediaPermission)}
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
          <Button onClick={() => onApply(draft, perm)}>Apply</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
