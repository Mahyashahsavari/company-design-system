import { useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AppChrome } from '../../shared/components/AppChrome';
import { Toast } from '../../shared';
import {
  getRoomUtilityWidth,
  ROOM_ATTACK_CHAIN_WIDTH_DENSE,
  ROOM_DENSE_HEIGHT_QUERY,
  ROOM_DENSE_WIDTH_QUERY,
  ROOM_MEDIA_DOCK_GUTTER,
  ROOM_MEDIA_DOCK_SAFE_ZONE,
  ROOM_MEDIA_DOCK_SAFE_ZONE_DENSE,
  ROOM_MOBILE_QUERY,
  ROOM_PAGE_HEADER_GUTTER,
  ROOM_UTILITY_COMPACT_MAX,
} from '../../shared/constants';
import { CollaborationLayer } from './components/CollaborationLayer';
import { ContextSidebar } from './components/ContextSidebar';
import { IncidentContextColumn } from './components/IncidentContextColumn';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { LiveMediaFloatPanel } from './components/LiveMediaFloatPanel';
import { MobileRoomView } from './components/MobileRoomView';
import { InviteParticipantsModal } from './components/InviteParticipantsModal';
import { AddEvidenceModal } from './components/AddEvidenceModal';
import { AffectedEntitiesBoard } from './components/AffectedEntitiesBoard';
import { AttackMapModal } from './components/AttackMapModal';
import { EditIncidentDrawer } from './components/EditIncidentDrawer';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { MediaSettingsModal } from './components/MediaSettingsModal';
import { RoomSettingsModal } from './components/RoomSettingsModal';
import { ResizableSplitPane } from './components/ResizableSplitPane';
import { ResponseWorkflow } from './components/response-workflow';
import { RoomCommandHeader } from './components/RoomCommandHeader';
import {
  ATTACKER_ENTITIES,
  LINKED_INCIDENT_ALERTS,
  PARTICIPANTS,
  VICTIM_ENTITIES,
  WORKFLOW_STEPS,
} from './data';
import { useRoomState } from './hooks/useRoomState';

function handleMediaMore(action: string, room: ReturnType<typeof useRoomState>) {
  if (action === 'simulate-moderator-mute') {
    room.setLocalMediaFlags({ mutedByModerator: true, mic: false });
    room.showToast('Microphone muted by moderator');
    return;
  }
  if (action === 'simulate-mike-share') {
    room.simulateRemoteShare();
    room.showToast('Mike Chen is sharing his screen');
    return;
  }
  room.showToast(action === 'devices' ? 'Testing devices…' : 'Connection details');
}

/** Room page — investigation + separate collaboration/media layer. */
export function RoomPage() {
  const room = useRoomState();
  const [attackerId, setAttackerId] = useState(ATTACKER_ENTITIES[0].id);
  const [victimId, setVictimId] = useState(VICTIM_ENTITIES[0].id);
  const [linkedAlerts, setLinkedAlerts] = useState(LINKED_INCIDENT_ALERTS);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [affectedEntitiesOpen, setAffectedEntitiesOpen] = useState(false);
  const [attackMapOpen, setAttackMapOpen] = useState(false);
  const compactDesktop = useMediaQuery(`(max-width: ${ROOM_UTILITY_COMPACT_MAX})`, true, {
    getInitialValueInEffect: false,
  });
  const denseWidth = useMediaQuery(ROOM_DENSE_WIDTH_QUERY, true, {
    getInitialValueInEffect: false,
  });
  const denseHeight = useMediaQuery(ROOM_DENSE_HEIGHT_QUERY, true, {
    getInitialValueInEffect: false,
  });
  const denseRoom = denseWidth || denseHeight;
  const isMobile = useMediaQuery(ROOM_MOBILE_QUERY, false, {
    getInitialValueInEffect: false,
  });
  const utilityExpandedWidth = getRoomUtilityWidth({ compact: compactDesktop, collapsed: false });
  const utilityWidth = getRoomUtilityWidth({
    compact: compactDesktop,
    collapsed: room.asideCollapsed,
  });
  const collabFullscreen = room.collaborationFullscreen;
  const collabSplit = room.collaborationSplit && room.media.joined && !collabFullscreen;
  const showDockedFloat = !collabSplit && !collabFullscreen;

  const collaboration = (
    <CollaborationLayer
      media={room.media}
      livePeople={room.livePeople}
      participants={room.participants}
      pinnedTarget={room.pinnedTarget}
      viewerCount={PARTICIPANTS.length}
      fullscreen={collabFullscreen}
      split={collabSplit}
      durationLabel={room.durationLabel}
      participantCount={room.participants.length}
      onJoin={room.joinLive}
      onToggleMedia={room.toggleMedia}
      onShare={room.startShare}
      onStopShare={room.stopShare}
      onSettings={() => room.setMediaSettingsOpen(true)}
      onRetry={room.retryConnection}
      onMore={(action) => handleMediaMore(action, room)}
      onSplitToggle={room.toggleCollaborationSplit}
      onShareLayoutChange={room.setShareLayout}
      onPinParticipant={room.pinParticipant}
      onUnpin={room.unpin}
      onFullscreenChange={room.setCollaborationFullscreenActive}
      onExitFullscreen={room.exitCollaborationFullscreen}
      canManageParticipants={room.canManageParticipants}
      onToggleParticipantMic={room.toggleParticipantMic}
      onToggleParticipantCamera={room.toggleParticipantCamera}
      onRemoveParticipant={room.removeParticipant}
      onSetParticipantRole={room.setParticipantRole}
      onViewParticipantDetails={room.viewParticipantDetails}
    />
  );

  const splitUtilityWidth = getRoomUtilityWidth({
    compact: compactDesktop,
    collapsed: room.asideCollapsed,
    split: true,
  });
  const activeUtilityWidth = collabSplit ? splitUtilityWidth : utilityWidth;
  const minCollabWidth = compactDesktop ? 240 : 260;

  const utilitySidebar = (
    <Box
      className="monosuite-room-utility-panel monosuite-context-rail"
      style={{
        width: activeUtilityWidth,
        marginRight: 4,
        transition: 'width 160ms ease',
      }}
    >
      <ContextSidebar
        tab={room.sidebarTab}
        onTabChange={room.setSidebarTab}
        history={room.history}
        onInvite={() => room.roomAction('invite')}
        onOpenEvidence={() => setEvidenceDrawerOpen(true)}
        evidence={room.evidence}
        collapsed={room.asideCollapsed}
        onExpand={() => {
          if (room.asideCollapsed) room.toggleAside();
        }}
        onToggleCollapse={room.toggleAside}
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
  );

  const liveMediaFloatPanel = (
    <LiveMediaFloatPanel
      media={room.media}
      livePeople={room.livePeople}
      participants={room.participants}
      pinnedTarget={room.pinnedTarget}
      durationLabel={room.durationLabel}
      participantCount={room.participants.length}
      dense={denseRoom || isMobile}
      mobile={isMobile}
      onJoin={room.joinLive}
      onLeave={room.leaveLive}
      onToggleMedia={room.toggleMedia}
      onShare={room.startShare}
      onStopShare={room.stopShare}
      onSettings={() => room.setMediaSettingsOpen(true)}
      onRetry={room.retryConnection}
      onMore={(action) => handleMediaMore(action, room)}
      onSplitToggle={room.toggleCollaborationSplit}
      onFullscreenChange={room.setCollaborationFullscreenActive}
      fullscreenActive={collabFullscreen}
      onExitFullscreen={room.exitCollaborationFullscreen}
      canManageParticipants={room.canManageParticipants}
      onPinParticipant={room.pinParticipant}
      onUnpin={room.unpin}
      onToggleParticipantMic={room.toggleParticipantMic}
      onToggleParticipantCamera={room.toggleParticipantCamera}
      onRemoveParticipant={room.removeParticipant}
      onSetParticipantRole={room.setParticipantRole}
      onViewParticipantDetails={room.viewParticipantDetails}
    />
  );

  const roomBody = (
    <Box
      className="monosuite-room-row"
      data-density={denseRoom ? 'dense' : 'default'}
      px={ROOM_PAGE_HEADER_GUTTER}
      pt={denseRoom ? 6 : ROOM_PAGE_HEADER_GUTTER}
      pb={denseRoom ? 6 : ROOM_PAGE_HEADER_GUTTER}
    >
      <IncidentContextColumn
        attackerId={attackerId}
        victimId={victimId}
        onAttackerChange={setAttackerId}
        onVictimChange={setVictimId}
        onEditIncident={() => room.roomAction('view-incident')}
        linkedAlerts={linkedAlerts}
        defaultWidth={denseWidth ? ROOM_ATTACK_CHAIN_WIDTH_DENSE : utilityExpandedWidth}
        collapsed={contextCollapsed}
        onToggleCollapse={() => setContextCollapsed((value) => !value)}
        onOpenAffectedEntities={() => setAffectedEntitiesOpen(true)}
        onOpenAttackMap={() => setAttackMapOpen(true)}
      />

      <Box
        className="monosuite-room-column"
        style={{
          paddingRight: collabSplit ? 8 : 12,
          gap: denseRoom ? 6 : 10,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <Box style={{ flexShrink: 0 }}>
          <ResponseWorkflow
            steps={WORKFLOW_STEPS}
            protocol="NIST SP 800-61"
            density={denseRoom ? 'strip' : 'cards'}
          />
        </Box>
        <InvestigationWorkspace
          room={room}
          dockSafeZone={showDockedFloat}
          dockSafeZoneHeight={
            denseRoom ? ROOM_MEDIA_DOCK_SAFE_ZONE_DENSE : ROOM_MEDIA_DOCK_SAFE_ZONE
          }
        />
        {showDockedFloat ? (
          <Box
            className="monosuite-live-float-anchor"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: ROOM_MEDIA_DOCK_GUTTER + 8,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <Box style={{ pointerEvents: 'auto', width: '100%' }}>{liveMediaFloatPanel}</Box>
          </Box>
        ) : null}
      </Box>

      {utilitySidebar}
    </Box>
  );

  const splitRightPane = <Box className="monosuite-room-panel">{collaboration}</Box>;

  const splitLeftPane = <Box className="monosuite-room-panel">{roomBody}</Box>;

  const roomWorkspace = (
    <Box className="monosuite-room-panel" style={{ position: 'relative' }}>
      {roomBody}
    </Box>
  );

  return (
    <>
      <AppChrome
        showAsideToggle={false}
        asideCollapsed={room.asideCollapsed}
        onToggleAside={room.toggleAside}
        hideHeader={collabFullscreen && isMobile}
      >
        <AppShell.Main
          className="monosuite-room-main"
          style={{
            background: 'var(--monosuite-color-background)',
            position: 'relative',
          }}
        >
          {collabFullscreen ? (
            <Box className="monosuite-room-body">{collaboration}</Box>
          ) : isMobile ? (
            <Box className="monosuite-room-body">
              <MobileRoomView
                room={room}
                attackerId={attackerId}
                victimId={victimId}
                onAttackerChange={setAttackerId}
                onVictimChange={setVictimId}
                onEditIncident={() => room.roomAction('view-incident')}
                linkedAlerts={linkedAlerts}
                livePanel={liveMediaFloatPanel}
                onOpenAffectedEntities={() => setAffectedEntitiesOpen(true)}
                onOpenAttackMap={() => setAttackMapOpen(true)}
                onOpenEvidence={() => setEvidenceDrawerOpen(true)}
              />
            </Box>
          ) : (
            <Box className="monosuite-room-body">
              <RoomCommandHeader
                roomTitle={room.roomSettings.title}
                roomSeverity={room.roomSettings.severity}
                onRoomAction={room.roomAction}
                onCloseRoom={room.closeRoom}
              />
              <Box className="monosuite-room-workspace">
                {collabSplit ? (
                  <ResizableSplitPane
                    left={splitLeftPane}
                    right={splitRightPane}
                    rightWidth={room.collaborationSplitWidth}
                    onRightWidthChange={(width) => {
                      room.setCollaborationSplitWidth(Math.max(minCollabWidth, width));
                    }}
                    minLeft={compactDesktop ? 400 : 480}
                    minRight={minCollabWidth}
                  />
                ) : (
                  roomWorkspace
                )}
              </Box>
            </Box>
          )}
        </AppShell.Main>
      </AppChrome>

      <EditIncidentDrawer
        opened={room.manualIncidentOpen}
        onClose={() => room.setManualIncidentOpen(false)}
        linkedAlerts={linkedAlerts}
        onSave={(next) => {
          setLinkedAlerts(next);
          room.showToast('Incident saved');
        }}
      />

      <MediaSettingsModal
        opened={room.mediaSettingsOpen}
        onClose={() => room.setMediaSettingsOpen(false)}
        devices={room.mediaDevices}
        permission={room.media.permission}
        onApply={room.applyMediaSettings}
      />

      <RoomSettingsModal
        opened={room.roomSettingsOpen}
        initial={room.roomSettings}
        onClose={() => room.setRoomSettingsOpen(false)}
        onSave={room.saveRoomSettings}
      />

      <InviteParticipantsModal
        opened={room.inviteOpen}
        participants={room.participants}
        onClose={() => room.setInviteOpen(false)}
        onSend={room.invitePeople}
      />

      <AddEvidenceModal
        opened={room.evidenceOpen}
        initialKind={room.evidenceKind}
        onClose={() => room.setEvidenceOpen(false)}
        onAdd={room.addEvidence}
      />

      <EvidenceDrawer
        opened={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        items={room.evidence}
        onAdd={(kind) => room.openAddEvidence(kind)}
      />

      <AffectedEntitiesBoard
        opened={affectedEntitiesOpen}
        onClose={() => setAffectedEntitiesOpen(false)}
      />

      <AttackMapModal
        opened={attackMapOpen}
        onClose={() => setAttackMapOpen(false)}
        attacker={ATTACKER_ENTITIES.find((entity) => entity.id === attackerId) ?? ATTACKER_ENTITIES[0]}
        victim={VICTIM_ENTITIES.find((entity) => entity.id === victimId) ?? VICTIM_ENTITIES[0]}
      />

      <Toast message={room.toast} onClose={room.clearToast} />
    </>
  );
}
