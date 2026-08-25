import { AppShell, Breadcrumbs, Group, Stack, Text } from '@mantine/core';
import { AppChrome } from '../../shared/components/AppChrome';
import { Toast } from '../../shared';
import { ContextSidebar } from './components/ContextSidebar';
import { IncidentContextColumn } from './components/IncidentContextColumn';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { ManualIncidentDrawer } from './components/ManualIncidentDrawer';
import { MediaDock } from './components/MediaDock';
import { MediaSettingsModal } from './components/MediaSettingsModal';
import { ResponseWorkflow } from './components/response-workflow';
import { RoomCommandHeader } from './components/RoomCommandHeader';
import { INCIDENT, WORKFLOW_STEPS } from './data';
import { useRoomState } from './hooks/useRoomState';

export function RoomPage() {
  const room = useRoomState();
  const roomPhase = room.media.joined ? INCIDENT.id : 'Pre-Join-Ready';

  return (
    <>
      <AppChrome
        showAsideToggle
        asideCollapsed={room.asideCollapsed}
        onToggleAside={room.toggleAside}
        footerHeight={room.media.joined ? 72 : 56}
        aside={
          <AppShell.Aside
            style={{
              borderLeft: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-body)',
            }}
          >
            <ContextSidebar
              tab={room.sidebarTab}
              onTabChange={room.setSidebarTab}
              history={room.history}
              onInvite={() => room.roomAction('invite')}
              onAddEvidence={() => room.roomAction('add-evidence')}
            />
          </AppShell.Aside>
        }
        footer={
          <AppShell.Footer
            style={{
              background: 'var(--monosuite-color-chrome)',
              borderTop: '1px solid var(--monosuite-color-chrome-border)',
            }}
          >
            <MediaDock
              media={room.media}
              durationLabel={room.durationLabel}
              onJoin={room.joinLive}
              onToggleMedia={room.toggleMedia}
              onShare={room.startShare}
              onStopShare={room.stopShare}
              onSettings={() => room.setMediaSettingsOpen(true)}
              onRetry={room.retryConnection}
              onMore={(action) =>
                room.showToast(action === 'devices' ? 'Testing devices…' : 'Connection details')
              }
            />
          </AppShell.Footer>
        }
      >
        <AppShell.Main
          style={{
            background: 'var(--monosuite-color-background)',
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          <Stack gap="sm" p="md" pb="lg">
            <Breadcrumbs>
              <Text size="xs" c="dimmed">
                Incident Room
              </Text>
              <Text size="xs" fw={600}>
                {roomPhase}
              </Text>
            </Breadcrumbs>

            <Group align="flex-start" gap="md" wrap="nowrap">
              <IncidentContextColumn />

              <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
                <RoomCommandHeader
                  durationShort={room.durationShort}
                  onRoomAction={room.roomAction}
                  onCloseRoom={room.closeRoom}
                />

                <ResponseWorkflow protocol="NIC800" steps={WORKFLOW_STEPS} />

                <InvestigationWorkspace room={room} />
              </Stack>
            </Group>
          </Stack>
        </AppShell.Main>
      </AppChrome>

      <ManualIncidentDrawer
        opened={room.manualIncidentOpen}
        onClose={() => room.setManualIncidentOpen(false)}
        onSave={() => room.showToast('Incident saved')}
      />

      <MediaSettingsModal
        opened={room.mediaSettingsOpen}
        onClose={() => room.setMediaSettingsOpen(false)}
        devices={room.mediaDevices}
        onApply={room.applyMediaSettings}
      />

      <Toast message={room.toast} onClose={room.clearToast} />
    </>
  );
}
