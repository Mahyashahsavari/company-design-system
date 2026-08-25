import { useMemo, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Badge,
  Button,
  Burger,
  Group,
  Loader,
  NavLink,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBox,
  IconChartBar,
  IconFilter,
  IconInbox,
  IconMenu2,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconSun,
  IconUsers,
} from '@tabler/icons-react';
import { formatDate } from '@monosuite/utils';
import { ASSETS, STATUS_COLOR, STATUS_LABEL, type AssetStatus } from './data';

type ViewState = 'ready' | 'loading' | 'empty';

const PAGE_SIZE = 4;

export function App() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewState>('ready');

  const filtered = useMemo(() => {
    return ASSETS.filter((asset) => {
      const matchesQuery =
        !query ||
        asset.name.toLowerCase().includes(query.toLowerCase()) ||
        asset.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !status || asset.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 264, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" visibleFrom="sm">
              <IconMenu2 size={18} />
            </Group>
            <Title order={4}>Assets Management</Title>
          </Group>
          <Group>
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Toggle color scheme"
              onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Button leftSection={<IconPlus size={16} />}>Add asset</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          <NavLink label="Inventory" leftSection={<IconBox size={18} />} active />
          <NavLink label="Reports" leftSection={<IconChartBar size={18} />} />
          <NavLink label="Compliance" leftSection={<IconShieldCheck size={18} />} />
          <NavLink label="Team" leftSection={<IconUsers size={18} />} />
          <NavLink label="Settings" leftSection={<IconSettings size={18} />} />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="md">
          <div>
            <Title order={2}>Asset inventory</Title>
            <Text c="dimmed" size="sm">
              Reference consumer of `@monosuite/theme` + Mantine components.
            </Text>
          </div>

          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Group grow preventGrowOverflow={false} style={{ flex: 1 }} miw={240}>
              <TextInput
                label="Search"
                placeholder="Name or ID"
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setPage(1);
                  setView('ready');
                }}
              />
              <Select
                label="Status"
                placeholder="All statuses"
                leftSection={<IconFilter size={16} />}
                clearable
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'in_repair', label: 'In repair' },
                  { value: 'retired', label: 'Retired' },
                  { value: 'missing', label: 'Missing' },
                ]}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                  setView('ready');
                }}
              />
            </Group>
            <Group>
              <Button
                variant="default"
                onClick={() => {
                  setView('loading');
                  window.setTimeout(() => setView(filtered.length ? 'ready' : 'empty'), 700);
                }}
              >
                Simulate load
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setQuery('zzz-no-match');
                  setView('empty');
                }}
              >
                Show empty
              </Button>
            </Group>
          </Group>

          {view === 'loading' && (
            <Group justify="center" py="xl">
              <Loader />
              <Text c="dimmed">Loading assets…</Text>
            </Group>
          )}

          {view === 'empty' && (
            <Stack align="center" py="xl" gap="sm">
              <IconInbox size={40} />
              <Title order={4}>No assets found</Title>
              <Text c="dimmed" size="sm">
                Try clearing filters or adding a new asset.
              </Text>
              <Button
                variant="light"
                onClick={() => {
                  setQuery('');
                  setStatus(null);
                  setView('ready');
                }}
              >
                Reset filters
              </Button>
            </Stack>
          )}

          {view === 'ready' && (
            <>
              <Table.ScrollContainer minWidth={720}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Owner</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Updated</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((asset) => (
                      <Table.Tr key={asset.id}>
                        <Table.Td>
                          <Text size="sm" ff="monospace">
                            {asset.id}
                          </Text>
                        </Table.Td>
                        <Table.Td>{asset.name}</Table.Td>
                        <Table.Td>{asset.type}</Table.Td>
                        <Table.Td>{asset.location}</Table.Td>
                        <Table.Td>{asset.owner}</Table.Td>
                        <Table.Td>
                          <Badge color={STATUS_COLOR[asset.status as AssetStatus]}>
                            {STATUS_LABEL[asset.status as AssetStatus]}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {formatDate(asset.updatedAt, { locale: 'en-GB', timeZone: 'UTC' })}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {filtered.length} assets
                </Text>
                <Pagination total={totalPages} value={page} onChange={setPage} />
              </Group>
            </>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
