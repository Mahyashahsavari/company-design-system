import { useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import type { LinkedIncidentAlert } from '../data';
import type { RoomState } from '../hooks/useRoomState';
import { ContextSidebar } from './ContextSidebar';
import { IncidentContextColumn } from './IncidentContextColumn';
import { InvestigationWorkspace } from './InvestigationWorkspace';
import { ResponseWorkflow, type WorkflowViewMode } from './response-workflow';
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
  onOpenAffectedEntities: () => void;
  onOpenAttackMap: () => void;
  onOpenEvidence: () => void;
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
  onOpenAffectedEntities,
  onOpenAttackMap,
  onOpenEvidence,
}: MobileRoomViewProps) {
  const [tab, setTab] = useState<MobileRoomTab>('incident');
  const [workflowViewMode, setWorkflowViewMode] = useState<WorkflowViewMode>('canvas');
  const canvasMode = workflowViewMode === 'canvas';

  return (
    <Box className="monosuite-room-mobile" data-testid="mobile-room-view">
      <RoomCommandHeader
        compact
        roomTitle={room.roomSettings.title}
        roomDescription={room.roomSettings.description}
        roomTags={room.roomSettings.tags}
        roomSeverity={room.roomSettings.severity}
        onRoomAction={room.roomAction}
        onCloseRoom={room.closeRoom}
        canEditRoomSettings={room.canEditRoomSettings}
        showOperationalTime={room.showOperationalTime}
        startedAtLabel={room.startedAtLabel}
        elapsedLabel={room.elapsedLabel}
        roomSlaPolicy={room.roomSlaPolicy}
        commanderName={room.commanderParticipant?.name}
        canTransferCommand={room.canTransferCommand}
        onTransferCommand={room.openTransferCommand}
      />

      <Box
        px="xs"
        pt="md"
        pb="sm"
        style={{
          flexShrink: canvasMode ? 1 : 0,
          flex: canvasMode ? '1 1 0' : undefined,
          minHeight: canvasMode ? 0 : undefined,
          height: canvasMode ? '100%' : undefined,
          display: canvasMode ? 'flex' : undefined,
          flexDirection: 'column',
          overflow: canvasMode ? 'hidden' : undefined,
        }}
      >
        <ResponseWorkflow
          steps={room.roomWorkflow.steps}
          fetchStatus={room.roomWorkflow.status}
          workflowName={room.roomWorkflow.workflowName}
          workflowDescription={room.roomWorkflow.workflowDescription}
          errorMessage={room.roomWorkflow.errorMessage}
          onRetry={room.roomWorkflow.retry}
          onOpenSettings={
            room.canEditRoomSettings ? () => room.setRoomSettingsOpen(true) : undefined
          }
          density="focus"
          viewMode={workflowViewMode}
          onViewModeChange={setWorkflowViewMode}
          questions={room.questions}
          onSubmitCollabAnswer={room.submitAnswer}
          onRecordDecision={room.recordDecision}
        />
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
        {tab === 'investigate' && !canvasMode ? (
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
            onOpenAffectedEntities={onOpenAffectedEntities}
            onOpenAttackMap={onOpenAttackMap}
          />
        ) : null}
        {tab === 'room' ? (
          <Box
            className="monosuite-room-utility-panel monosuite-context-rail"
            style={{ width: '100%', height: '100%' }}
          >
            <ContextSidebar
              tab={room.sidebarTab}
              onTabChange={room.setSidebarTab}
              history={room.history}
              onInvite={() => room.roomAction('invite')}
              onOpenEvidence={onOpenEvidence}
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
              commanderParticipantId={room.commanderParticipantId}
              canTransferCommand={room.canTransferCommand}
              onTransferCommand={room.openTransferCommand}
            />
          </Box>
        ) : null}
      </Box>

      <Box className="monosuite-room-mobile-live">{livePanel}</Box>
    </Box>
  );
}
