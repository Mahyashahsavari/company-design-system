import { useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import type { LinkedIncidentAlert } from '../data';
import { WORKFLOW_STEPS } from '../data';
import type { RoomState } from '../hooks/useRoomState';
import { ContextSidebar } from './ContextSidebar';
import { IncidentContextColumn } from './IncidentContextColumn';
import { InvestigationWorkspace } from './InvestigationWorkspace';
import { ResponseWorkflow } from './response-workflow';
import { RoomCommandHeader } from './RoomCommandHeader';
import type { ReactNode } from 'react';

type MobileRoomTab = 'incident' | 'investigate' | 'room';

const MOBILE_TABS: { value: MobileRoomTab; label: string }[] = [
  { value: 'incident', label: 'Incident' },
  { value: 'investigate', label: 'Investigation' },
  { value: 'room', label: 'Room' },
];

interface MobileRoomViewProps {
  room: RoomState;
  attackerId: string;
  victimId: string;
  onAttackerChange: (id: string) => void;
  onVictimChange: (id: string) => void;
  onEditIncident: () => void;
  linkedAlerts: LinkedIncidentAlert[];
  livePanel: ReactNode;
}

/** Phone layout: one pane at a time so the room stays reachable below 768px. */
export function MobileRoomView({
  room,
  attackerId,
  victimId,
  onAttackerChange,
  onVictimChange,
  onEditIncident,
  linkedAlerts,
  livePanel,
}: MobileRoomViewProps) {
  const [tab, setTab] = useState<MobileRoomTab>('incident');

  return (
    <Box className="monosuite-room-mobile" data-testid="mobile-room-view">
      <RoomCommandHeader
        compact
        roomTitle={room.roomSettings.title}
        roomSeverity={room.roomSettings.severity}
        onRoomAction={room.roomAction}
        onCloseRoom={room.closeRoom}
      />

      <Box px="xs" pt="md" pb="sm" style={{ flexShrink: 0 }}>
          <ResponseWorkflow steps={WORKFLOW_STEPS} protocol="NIST SP 800-61" density="focus" />
      </Box>

      <Box className="monosuite-room-mobile-tabs" role="tablist" aria-label="Room section">
        {MOBILE_TABS.map((item) => (
          <UnstyledButton
            key={item.value}
            role="tab"
            aria-selected={tab === item.value}
            className="monosuite-room-mobile-tab"
            data-active={tab === item.value ? 'true' : 'false'}
            onClick={() => setTab(item.value)}
            styles={{
              root: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              },
            }}
          >
            {item.label}
          </UnstyledButton>
        ))}
      </Box>

      <Box className="monosuite-room-mobile-body">
        {tab === 'investigate' ? (
          <InvestigationWorkspace room={room} dockSafeZone={false} />
        ) : null}
        {tab === 'incident' ? (
          <IncidentContextColumn
            fullWidth
            attackerId={attackerId}
            victimId={victimId}
            onAttackerChange={onAttackerChange}
            onVictimChange={onVictimChange}
            onEditIncident={onEditIncident}
            linkedAlerts={linkedAlerts}
          />
        ) : null}
        {tab === 'room' ? (
          <Box className="monosuite-room-utility-panel monosuite-context-rail" style={{ width: '100%', height: '100%' }}>
            <ContextSidebar
              tab={room.sidebarTab}
              onTabChange={room.setSidebarTab}
              history={room.history}
              onInvite={() => room.roomAction('invite')}
              onAddEvidence={(kind) => room.openAddEvidence(kind ?? 'file')}
              evidence={room.evidence}
              collapsed={false}
              participants={room.participants}
              media={room.media}
              canManageParticipants={room.canManageParticipants}
              onMuteParticipant={room.toggleParticipantMic}
              onDisableCamera={room.toggleParticipantCamera}
              onRemoveParticipant={room.removeParticipant}
              onSetRole={room.setParticipantRole}
              onViewDetails={room.viewParticipantDetails}
              onPinParticipant={room.pinParticipant}
            />
          </Box>
        ) : null}
      </Box>

      <Box className="monosuite-room-mobile-live">{livePanel}</Box>
    </Box>
  );
}
