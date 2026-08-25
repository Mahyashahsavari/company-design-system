import { AppShell, Stack, Text, Title } from '@mantine/core';
import { AppChrome } from '../../shared/components/AppChrome';

export function ResourcesPage() {
  return (
    <AppChrome>
      <AppShell.Main
        style={{
          background: 'var(--monosuite-color-background)',
          minHeight: 'calc(100vh - 52px)',
        }}
      >
        <Stack gap="sm" p="xl" maw={640}>
          <Title order={2}>Resources</Title>
          <Text c="dimmed" size="sm">
            Manage shared evidence, playbooks, and room resources. Placeholder page.
          </Text>
        </Stack>
      </AppShell.Main>
    </AppChrome>
  );
}
