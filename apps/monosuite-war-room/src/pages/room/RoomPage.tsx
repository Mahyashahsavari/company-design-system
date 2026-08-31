import { useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AppChrome } from '../../shared/components/AppChrome';
import { Toast } from '../../shared';
import {
  ROOM_MEDIA_DOCK_GUTTER,
  ROOM_MEDIA_DOCK_SAFE_ZONE,
  ROOM_PAGE_HEADER_GUTTER,
} from '../../shared/constants';
import { CollaborationLayer } from './components/CollaborationLayer';
import { ContextSidebar } from './components/ContextSidebar';
import { IncidentContextColumn } from './components/IncidentContextColumn';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { LiveMediaFloatPanel } from './components/LiveMediaFloatPanel';
import { ManualIncidentDrawer } from './components/ManualIncidentDrawer';
import { MediaSettingsModal } from './components/MediaSettingsModal';
import { ResizableSplitPane } from './components/ResizableSplitPane';
import { ResponseWorkflow } from './components/response-workflow';
import { RoomCommandHeader } from './components/RoomCommandHeader';
import {
  ATTACKER_ENTITIES,
  PARTICIPANTS,
  VICTIM_ENTITIES,
  WORKFLOW_STEPS,
} from './data';
import { useRoomState } from './hooks/useRoomState';

const RAIL_WIDTH = 52;

function handleMediaMore(
  action: string,
  room: ReturnType<typeof useRoomState>,
) {
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
  const compactDesktop = useMediaQuery('(max-width: 87.99em)', true, {
    getInitialValueInEffect: false,
  });
  const utilityWidth = room.asideCollapsed ? RAIL_WIDTH : compactDesktop ? 300 : 340;
  const collabFullscreen = room.collaborationFullscreen;
  const collabSplit =
    room.collaborationSplit && room.media.joined && !collabFullscreen;
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

  const splitUtilityWidth = room.asideCollapsed ? RAIL_WIDTH : compactDesktop ? 260 : 280;
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
        onAddEvidence={() => room.roomAction('add-evidence')}
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

  const roomBody = (
    <Box
      className="monosuite-room-row"
      px={ROOM_PAGE_HEADER_GUTTER}
      pt={ROOM_PAGE_HEADER_GUTTER}
      pb={ROOM_PAGE_HEADER_GUTTER}
    >
      <IncidentContextColumn
        attackerId={attackerId}
        victimId={victimId}
        onAttackerChange={setAttackerId}
        onVictimChange={setVictimId}
        onViewIncident={() => room.roomAction('view-incident')}
      />

      <Box
        className="monosuite-room-column"
        style={{ paddingRight: collabSplit ? 8 : 12, gap: 10, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Box style={{ flexShrink: 0 }}>
          <ResponseWorkflow steps={WORKFLOW_STEPS} />
        </Box>
        <InvestigationWorkspace
          room={room}
          dockSafeZone={showDockedFloat}
          dockSafeZoneHeight={ROOM_MEDIA_DOCK_SAFE_ZONE}
        />
      </Box>

      {utilitySidebar}
    </Box>
  );

  const splitRightPane = <Box className="monosuite-room-panel">{collaboration}</Box>;

  const liveMediaFloatPanel = (
    <LiveMediaFloatPanel
      media={room.media}
      livePeople={room.livePeople}
      participants={room.participants}
      pinnedTarget={room.pinnedTarget}
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

  const floatFixed = (
    <Box
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: ROOM_MEDIA_DOCK_GUTTER,
        width: 'max-content',
        maxWidth: 'calc(100% - 32px)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Box style={{ pointerEvents: 'auto' }}>{liveMediaFloatPanel}</Box>
    </Box>
  );

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
          ) : (
            <Box className="monosuite-room-body">
              <RoomCommandHeader onRoomAction={room.roomAction} onCloseRoom={room.closeRoom} />
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

          {showDockedFloat && floatFixed}
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
        permission={room.media.permission}
        onApply={room.applyMediaSettings}
      />

      <Toast message={room.toast} onClose={room.clearToast} />
    </>
  );
}
