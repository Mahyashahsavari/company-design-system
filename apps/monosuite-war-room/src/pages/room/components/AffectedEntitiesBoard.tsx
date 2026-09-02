import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconApps,
  IconBinaryTree,
  IconBug,
  IconDatabase,
  IconDeviceDesktop,
  IconInfoCircle,
  IconNetwork,
  IconServer,
  IconShieldCheck,
} from '@tabler/icons-react';
import { ASSETS, SEVERITY_COLOR } from '../data';

const ASSET_ICONS = {
  server: IconServer,
  database: IconDatabase,
  desktop: IconDeviceDesktop,
} as const;

const ASSET_DETAILS = {
  'srv-prod-01': {
    vulnerabilities: [
      ['CVE-2026-38142', 'Critical', 'Exploitable · patch available'],
      ['CVE-2026-22810', 'High', 'Observed software match'],
      ['CVE-2025-49718', 'Medium', 'Compensating control present'],
    ],
    compliance: [['CIS Windows Server', '86%'], ['Password policy', 'Pass'], ['Audit policy', '2 gaps']],
    software: [['Microsoft SQL Server', '16.0.4175'], ['CrowdStrike Sensor', '7.24'], ['Splunk UF', '9.4.1']],
    network: [['TCP 443', 'Open · IIS'], ['TCP 1433', 'Open · SQL Server'], ['TCP 3389', 'Restricted']],
  },
  'db-prod-02': {
    vulnerabilities: [
      ['CVE-2026-29103', 'High', 'Patch pending'],
      ['CVE-2025-44201', 'Medium', 'Configuration dependent'],
    ],
    compliance: [['CIS Database Benchmark', '78%'], ['Encryption at rest', 'Pass'], ['Privileged access', '3 gaps']],
    software: [['PostgreSQL', '16.4'], ['Qualys Cloud Agent', '6.3'], ['Splunk UF', '9.4.1']],
    network: [['TCP 5432', 'Open · PostgreSQL'], ['TCP 22', 'Admin subnet only'], ['TCP 9100', 'Monitoring']],
  },
  'workstation-114': {
    vulnerabilities: [['CVE-2026-10331', 'Medium', 'Manual verification required']],
    compliance: [['Endpoint baseline', '91%'], ['Disk encryption', 'Pass'], ['Local admin', 'Review']],
    software: [['Microsoft 365 Apps', 'Current Channel'], ['Defender for Endpoint', '4.18'], ['7-Zip', '24.08']],
    network: [['TCP 445', 'Observed'], ['UDP 53', 'DNS'], ['Outbound 443', 'Allowed']],
  },
} as const;

interface AffectedEntitiesBoardProps {
  opened: boolean;
  onClose: () => void;
}

/** Overlay master-detail view; the room remains visible behind it and keeps its working state. */
export function AffectedEntitiesBoard({ opened, onClose }: AffectedEntitiesBoardProps) {
  const [selectedId, setSelectedId] = useState(ASSETS[0].id);
  const selected = useMemo(
    () => ASSETS.find((asset) => asset.id === selectedId) ?? ASSETS[0],
    [selectedId],
  );
  const detail = ASSET_DETAILS[selected.id as keyof typeof ASSET_DETAILS];
  const SelectedIcon = ASSET_ICONS[selected.icon];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" wrap="nowrap">
          <Text fw={800}>Affected entities</Text>
          <Badge variant="light" color="teal">{ASSETS.length}</Badge>
        </Group>
      }
      size="min(1180px, calc(100vw - 32px))"
      centered
      overlayProps={{ backgroundOpacity: 0.38, blur: 2 }}
      styles={{
        content: { height: 'min(760px, calc(100dvh - 48px))', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, display: 'flex', padding: 0 },
      }}
    >
      <Box className="monosuite-entity-modal-layout">
        <Stack gap={0} className="monosuite-entity-modal-list">
          <Box px="md" py="sm">
            <Text size="xs" c="dimmed">
              Assets are listed without imposing an unapproved containment or recovery order.
            </Text>
          </Box>
          <Divider />
          <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
            <Stack gap={6} p="sm">
              {ASSETS.map((asset) => {
                const Icon = ASSET_ICONS[asset.icon];
                const active = asset.id === selected.id;
                return (
                  <UnstyledButton
                    key={asset.id}
                    onClick={() => setSelectedId(asset.id)}
                    aria-current={active ? 'true' : undefined}
                    className="monosuite-entity-list-item"
                    data-active={active ? 'true' : undefined}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon variant="light" color="teal" size="lg">
                        <Icon size={17} />
                      </ThemeIcon>
                      <Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
                        <Text size="sm" fw={700} ff="monospace" truncate>{asset.name}</Text>
                        <Text size="xs" c="dimmed" truncate>{asset.type} · {asset.ip}</Text>
                      </Stack>
                      <Badge size="xs" variant="light" color={SEVERITY_COLOR[asset.severity]}>
                        {asset.severity}
                      </Badge>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </ScrollArea>
        </Stack>

        <Stack gap={0} className="monosuite-entity-modal-detail">
          <Group px="lg" py="md" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <ThemeIcon variant="light" color="teal" size={42} radius="md">
                <SelectedIcon size={21} />
              </ThemeIcon>
              <Stack gap={1} style={{ minWidth: 0 }}>
                <Text fw={800} ff="monospace" truncate>{selected.name}</Text>
                <Text size="xs" c="dimmed">{selected.type} · {selected.ip}</Text>
              </Stack>
            </Group>
            <Badge variant="light" color={SEVERITY_COLOR[selected.severity]} size="lg">
              {selected.severity}
            </Badge>
          </Group>
          <Divider />

          <Tabs defaultValue="overview" className="monosuite-entity-detail-tabs">
            <Tabs.List px="md">
              <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={14} />}>Overview</Tabs.Tab>
              <Tabs.Tab value="vulnerabilities" leftSection={<IconBug size={14} />}>Vulnerabilities</Tabs.Tab>
              <Tabs.Tab value="compliance" leftSection={<IconShieldCheck size={14} />}>Compliance</Tabs.Tab>
              <Tabs.Tab value="software" leftSection={<IconApps size={14} />}>Software</Tabs.Tab>
              <Tabs.Tab value="network" leftSection={<IconNetwork size={14} />}>Network</Tabs.Tab>
              <Tabs.Tab value="context" leftSection={<IconBinaryTree size={14} />}>Adapter context</Tabs.Tab>
            </Tabs.List>
            <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
              <Box p="lg">
                <Tabs.Panel value="overview">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <MetadataCard label="Owner" value={selected.owner} />
                    <MetadataCard label="Administrator" value={selected.admin} />
                    <MetadataCard label="Entity type" value="Asset" />
                    <MetadataCard label="Business criticality" value={selected.severity} />
                    <MetadataCard label="Primary source" value={selected.source} />
                    <MetadataCard label="Editability" value={selected.source === 'Manual' ? 'Editable' : 'Read only · synced'} />
                  </SimpleGrid>
                </Tabs.Panel>
                <Tabs.Panel value="vulnerabilities"><DetailRows rows={detail.vulnerabilities} /></Tabs.Panel>
                <Tabs.Panel value="compliance"><DetailRows rows={detail.compliance} /></Tabs.Panel>
                <Tabs.Panel value="software"><DetailRows rows={detail.software} /></Tabs.Panel>
                <Tabs.Panel value="network"><DetailRows rows={detail.network} /></Tabs.Panel>
                <Tabs.Panel value="context">
                  <Stack gap="sm">
                    <MetadataCard label="MonoSuite" value={selected.source === 'MonoSuite' ? 'Synced · read only · 2 min ago' : 'No linked response'} />
                    <MetadataCard label="Splunk" value="Partial context · read only · 5 min ago" />
                    <MetadataCard label="Manual fields" value={selected.source === 'Manual' ? 'Present · editable' : 'None'} />
                    <Paper withBorder radius="sm" p="sm" bg="var(--monosuite-color-surface-sunken)">
                      <Text size="xs" c="dimmed">
                        Adapter responses retain provenance and remain immutable. Normalised room fields are shown separately.
                      </Text>
                    </Paper>
                  </Stack>
                </Tabs.Panel>
              </Box>
            </ScrollArea>
          </Tabs>
        </Stack>
      </Box>
    </Modal>
  );
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder radius="sm" p="sm">
      <Text size="10px" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }}>{label}</Text>
      <Text size="sm" fw={650} mt={3}>{value}</Text>
    </Paper>
  );
}

function DetailRows({ rows }: { rows: readonly (readonly string[])[] }) {
  return (
    <Stack gap="xs">
      {rows.map(([name, state, detail]) => (
        <Paper key={name} withBorder radius="sm" p="sm">
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" fw={700}>{name}</Text>
              {detail ? <Text size="xs" c="dimmed">{detail}</Text> : null}
            </Stack>
            <Badge variant="light" color={state === 'Critical' ? 'danger' : state === 'High' ? 'warning' : 'teal'}>
              {state}
            </Badge>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
