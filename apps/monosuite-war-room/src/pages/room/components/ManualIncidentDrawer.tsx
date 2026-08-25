import {
  Accordion,
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { MITRE_MAP, PRESSURE_OPTIONS } from '../data';

interface ManualIncidentDrawerProps {
  opened: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ManualIncidentDrawer({ opened, onClose, onSave }: ManualIncidentDrawerProps) {
  const [tactic, setTactic] = useState<string | null>('credential-access');
  const [technique, setTechnique] = useState<string | null>('valid-accounts');
  const [subtechnique, setSubtechnique] = useState<string | null>('domain-accounts');
  const [pressure, setPressure] = useState<string | null>(null);
  const [victimTab, setVictimTab] = useState<string | null>('victim');

  const techniqueOptions = useMemo(() => {
    if (!tactic || !MITRE_MAP[tactic]) return [];
    return Object.entries(MITRE_MAP[tactic].techniques).map(([value, t]) => ({
      value,
      label: t.label,
    }));
  }, [tactic]);

  const subtechniqueOptions = useMemo(() => {
    if (!tactic || !technique || !MITRE_MAP[tactic]?.techniques[technique]) return [];
    return Object.entries(MITRE_MAP[tactic].techniques[technique].subtechniques).map(
      ([value, label]) => ({ value, label }),
    );
  }, [tactic, technique]);

  const mappingComplete = Boolean(tactic && technique && subtechnique);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Manual Incident"
      position="right"
      size="md"
      padding="md"
    >
      <Stack gap="md">
        <Select
          label="Incident Scenario"
          data={['Cyber Attack Kill Chain', 'Lateral Movement', 'Data Exfiltration']}
          defaultValue="Cyber Attack Kill Chain"
        />
        <Group grow align="flex-start">
          <Select
            label="Incident Severity"
            data={['Critical', 'High', 'Medium', 'Low']}
            defaultValue="Critical"
          />
          <Select
            label="Data Source"
            data={['CoreLog', 'SIEM', 'Manual Entry']}
            defaultValue="CoreLog"
          />
        </Group>

        <div>
          <Text fw={700} size="sm">
            MITRE ATT&CK Mapping
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            Identify the attack behavior using the MITRE ATT&CK framework. Start by selecting a
            tactic, then choose a related technique and sub-technique.
          </Text>
        </div>

        <Select
          label="Tactic"
          data={[
            { value: 'credential-access', label: 'Credential Access' },
            { value: 'initial-access', label: 'Initial Access' },
            { value: 'lateral-movement', label: 'Lateral Movement' },
          ]}
          value={tactic}
          onChange={(v) => {
            setTactic(v);
            setTechnique(null);
            setSubtechnique(null);
            setPressure(null);
          }}
        />
        <Select
          label="Technique"
          data={techniqueOptions}
          value={technique}
          onChange={(v) => {
            setTechnique(v);
            setSubtechnique(null);
            setPressure(null);
          }}
          disabled={!tactic}
        />
        <Select
          label="Sub-technique"
          data={subtechniqueOptions}
          value={subtechnique}
          onChange={(v) => {
            setSubtechnique(v);
            setPressure(null);
          }}
          disabled={!technique}
        />
        <Select
          label="MITRE Pressure"
          data={PRESSURE_OPTIONS}
          value={pressure}
          onChange={setPressure}
          disabled={!mappingComplete}
          placeholder="Select after MITRE mapping"
        />

        <Text fw={700} size="sm">
          Incident Timeline
        </Text>
        <Group grow>
          <TextInput label="Incident Occur Time" defaultValue="2026-08-24T21:42" type="datetime-local" />
          <TextInput
            label="Incident Detection Time"
            defaultValue="2026-08-24T21:47"
            type="datetime-local"
          />
        </Group>

        <Tabs value={victimTab} onChange={setVictimTab}>
          <Tabs.List>
            <Tabs.Tab value="victim">Victim</Tabs.Tab>
            <Tabs.Tab value="attacker">Attacker</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="victim" pt="sm">
            <Stack gap="sm">
              <TextInput label="Victim Address (IP / FQDN)" defaultValue="10.20.4.114" />
              <Accordion variant="contained">
                <Accordion.Item value="victim-fields">
                  <Accordion.Control>Victim Custom Fields</Accordion.Control>
                  <Accordion.Panel>
                    <Group grow>
                      <TextInput label="Key" placeholder="hostname" />
                      <Select label="Value Type" data={['String', 'IP']} defaultValue="String" />
                    </Group>
                    <TextInput label="Value" placeholder="workstation-114" mt="sm" />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="attacker" pt="sm">
            <Stack gap="sm">
              <TextInput label="Attacker Address (IP / FQDN)" defaultValue="185.23.45.10" />
              <Accordion variant="contained">
                <Accordion.Item value="attacker-fields">
                  <Accordion.Control>Attacker Custom Fields</Accordion.Control>
                  <Accordion.Panel>
                    <Group grow>
                      <TextInput label="Key" placeholder="threat_actor" />
                      <Select label="Value Type" data={['String']} defaultValue="String" />
                    </Group>
                    <TextInput
                      label="Value"
                      placeholder="APT29-linked infrastructure"
                      mt="sm"
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave();
              onClose();
            }}
          >
            Save Incident
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
