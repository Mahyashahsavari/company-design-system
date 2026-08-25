import { AppShell, Stack, Text, Title } from '@mantine/core';
import { AppChrome } from '../../shared/components/AppChrome';

export function SettingsPage() {
  return (
    <AppChrome>
      <AppShell.Main
        style={{
          background: 'var(--monosuite-color-background)',
          minHeight: 'calc(100vh - 52px)',
        }}
      >
        <Stack gap="sm" p="xl" maw={640}>
          <Title order={2}>Settings</Title>
          <Text c="dimmed" size="sm">
            Application and room defaults. Placeholder page.
          </Text>
        </Stack>
      </AppShell.Main>
    </AppChrome>
  );
}
