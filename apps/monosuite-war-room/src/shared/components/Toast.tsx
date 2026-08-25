import { Notification } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  title?: string;
}

export function Toast({ message, onClose, title = 'War Room' }: ToastProps) {
  if (!message) return null;

  return (
    <Notification
      icon={<IconCheck size={16} />}
      color="teal"
      title={title}
      onClose={onClose}
      style={{
        position: 'fixed',
        bottom: 72,
        right: 24,
        zIndex: 400,
        minWidth: 260,
        maxWidth: 360,
      }}
    >
      {message}
    </Notification>
  );
}
