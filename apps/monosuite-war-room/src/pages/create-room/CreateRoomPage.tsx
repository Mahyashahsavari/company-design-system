import { AppShell, Stack, Text, Title } from '@mantine/core';
import { AppChrome } from '../../shared/components/AppChrome';

export function CreateRoomPage() {
  return (
    <AppChrome>
      <AppShell.Main
        style={{
          background: 'var(--monosuite-color-background)',
          minHeight: 'calc(100vh - 52px)',
        }}
      >
        <Stack gap="sm" p="xl" maw={640}>
          <Title order={2}>Create Room</Title>
          <Text c="dimmed" size="sm">
            Start a new incident response room. This page is a placeholder for the create-room
            flow.
          </Text>
        </Stack>
      </AppShell.Main>
    </AppChrome>
  );
}
