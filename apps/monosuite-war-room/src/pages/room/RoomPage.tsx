import { useEffect, useMemo, useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useElementSize, useMediaQuery } from '@mantine/hooks';
import { Navigate, useParams } from 'react-router';
import { AppChrome } from '../../shared/components/AppChrome';
import { Toast } from '../../shared';
import {
  ROOM_DENSE_HEIGHT_QUERY,
  ROOM_DENSE_WIDTH_QUERY,
  ROOM_MEDIA_DOCK_GUTTER,
  ROOM_MEDIA_DOCK_SAFE_ZONE,
  ROOM_MEDIA_DOCK_SAFE_ZONE_DENSE,
  ROOM_MOBILE_QUERY,
  ROOM_PAGE_HEADER_GUTTER,
  ROOM_UTILITY_COMPACT_MAX,
} from '../../shared/constants';
import { routes } from '../../shared/routes';
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
import { TransferCommandModal } from './components/TransferCommandModal';
import { RoomSettingsModal } from './components/RoomSettingsModal';
import { ResizableRoomSidePanel } from './components/ResizableRoomSidePanel';
import { ResizableSplitPane } from './components/ResizableSplitPane';
import { ResponseWorkflow } from './components/response-workflow';
import type { WorkflowViewMode } from './components/response-workflow';
import { nistPhaseSelectOptions } from './components/response-workflow/workflowCanvasData';
import { RoomCommandHeader } from './components/RoomCommandHeader';
import { PARTICIPANTS } from './data';
import { useRoomState } from './hooks/useRoomState';
import { useRoomSidePanelWidths } from './hooks/useRoomSidePanelWidths';
import { RoomScenarioProvider } from './RoomScenarioContext';
import { getRoomScenario, type RoomScenarioPack } from './scenarios';

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

/** Room page — loads scenario pack from `/rooms/:roomId`. */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const pack = useMemo(() => getRoomScenario(roomId), [roomId]);

  if (!pack) {
    return <Navigate to={routes.rooms} replace />;
  }

  return (
    <RoomScenarioProvider value={pack}>
      <RoomPageContent pack={pack} />
    </RoomScenarioProvider>
  );
}

function RoomPageContent({ pack }: { pack: RoomScenarioPack }) {
  const room = useRoomState(pack);
  const attackers = pack.attackerEntities;
  const victims = pack.victimEntities;
  const [attackerId, setAttackerId] = useState(attackers[0]?.id ?? '');
  const [victimId, setVictimId] = useState(victims[0]?.id ?? '');
  const [linkedAlerts, setLinkedAlerts] = useState(() => structuredClone(pack.linkedAlerts));

  useEffect(() => {
    setAttackerId(pack.attackerEntities[0]?.id ?? '');
    setVictimId(pack.victimEntities[0]?.id ?? '');
    setLinkedAlerts(structuredClone(pack.linkedAlerts));
  }, [pack]);
  const [contextCollapsed, setContextCollapsed] = useState(true);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [affectedEntitiesOpen, setAffectedEntitiesOpen] = useState(false);
  const [attackMapOpen, setAttackMapOpen] = useState(false);
  const [workflowViewMode, setWorkflowViewMode] = useState<WorkflowViewMode>('canvas');
  const canvasMode = workflowViewMode === 'canvas';

  const workflowSteps = useMemo(
    () =>
      room.roomWorkflow.steps.map((step) => ({
        ...step,
        skippable: room.phaseSkippable[step.id] ?? step.skippable ?? false,
        status: room.skippedPhases.includes(step.id)
          ? ('completed' as const)
          : step.status,
      })),
    [room.phaseSkippable, room.roomWorkflow.steps, room.skippedPhases],
  );

  const phaseOptions = useMemo(
    () => nistPhaseSelectOptions(room.roomWorkflow.steps),
    [room.roomWorkflow.steps],
  );

  const assigneeOptions = useMemo(
    () =>
      room.participants.map((participant) => ({
        value: participant.id,
        label: participant.name,
      })),
    [room.participants],
  );

  const { ref: roomRowRef, width: roomRowWidth } = useElementSize();
  const {
    leftWidth,
    rightWidth,
    setLeftWidth,
    setRightWidth,
    minWidth: sidePanelMinWidth,
    maxWidth: sidePanelMaxWidth,
  } = useRoomSidePanelWidths(roomRowWidth);
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
  const collabFullscreen = room.collaborationFullscreen;
  const collabSplit = room.collaborationSplit && room.media.joined && !collabFullscreen;
  const showDockedFloat = !collabSplit && !collabFullscreen;

  const commanderProps = {
    commanderParticipantId: room.commanderParticipantId,
    canTransferCommand: room.canTransferCommand,
    onTransferCommand: room.openTransferCommand,
  };

  const collaboration = (
    <CollaborationLayer
      media={room.media}
      livePeople={room.livePeople}
      participants={room.participants}
      pinnedTarget={room.pinnedTarget}
      viewerCount={PARTICIPANTS.length}
      fullscreen={collabFullscreen}
      split={collabSplit}
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
      {...commanderProps}
    />
  );

  const minCollabWidth = compactDesktop ? 240 : 260;

  const utilitySidebar = (
    <ResizableRoomSidePanel
      className="monosuite-room-utility-panel"
      collapsed={room.asideCollapsed}
      width={rightWidth}
      onWidthChange={setRightWidth}
      minWidth={sidePanelMinWidth}
      maxWidth={sidePanelMaxWidth}
      resizeEdge="leading"
      onToggleCollapse={room.toggleAside}
      collapseLabel="Collapse collaboration panel"
      expandLabel="Expand collaboration panel"
      data-testid="utility-panel-resize"
    >
      <Box
        className="monosuite-context-rail"
        h="100%"
        style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
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
        {...commanderProps}
      />
      </Box>
    </ResizableRoomSidePanel>
  );

  const liveMediaFloatPanel = (
    <LiveMediaFloatPanel
      media={room.media}
      livePeople={room.livePeople}
      participants={room.participants}
      pinnedTarget={room.pinnedTarget}
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
      {...commanderProps}
    />
  );

  const roomBody = (
    <Box
      ref={roomRowRef}
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
        attackerEntities={attackers}
        victimEntities={victims}
        panelWidth={leftWidth}
        onPanelWidthChange={setLeftWidth}
        minPanelWidth={sidePanelMinWidth}
        maxPanelWidth={sidePanelMaxWidth}
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
        <Box
          className={canvasMode ? 'monosuite-room-canvas-host' : undefined}
          style={{
            flexShrink: canvasMode ? 1 : 0,
            flex: canvasMode ? '1 1 0%' : undefined,
            minHeight: canvasMode ? 0 : undefined,
            display: canvasMode ? 'flex' : undefined,
            flexDirection: canvasMode ? 'column' : undefined,
            overflow: canvasMode ? 'hidden' : undefined,
            ['--room-canvas-dock-safe' as string]:
              canvasMode && showDockedFloat ? `${ROOM_MEDIA_DOCK_SAFE_ZONE}px` : '0px',
          }}
        >
          <ResponseWorkflow
            steps={workflowSteps}
            fetchStatus={room.roomWorkflow.status}
            workflowName={room.roomWorkflow.workflowName}
            workflowDescription={room.roomWorkflow.workflowDescription}
            errorMessage={room.roomWorkflow.errorMessage}
            onRetry={room.roomWorkflow.retry}
            onOpenSettings={
              room.canEditRoomSettings ? () => room.setRoomSettingsOpen(true) : undefined
            }
            density={denseRoom ? 'strip' : 'cards'}
            viewMode={workflowViewMode}
            onViewModeChange={setWorkflowViewMode}
            questions={room.questions}
            onSubmitCollabAnswer={room.submitAnswer}
            onRecordDecision={room.recordDecision}
            isCommander={room.isLocalCommander}
            participants={room.participants}
            commanderParticipantId={room.commanderParticipantId}
            evidence={room.evidence}
            commanderQuestions={room.commanderQuestions}
            incidentTitle={room.roomSettings.title}
            incidentDescription={room.roomSettings.description}
            incidentSeverity={pack.incident.severity}
            triageNotes={room.triageNotes}
            onTriageNotesChange={room.setTriageNotes}
            onOpenIncidentContext={() => setContextCollapsed((value) => !value)}
            incidentContextOpen={!contextCollapsed}
            onAddEvidence={room.openAddEvidence}
            onRemoveEvidence={room.removeEvidence}
            onAddCommanderQuestion={room.addCommanderQuestion}
            onUpdateCommanderQuestion={room.updateCommanderQuestion}
            onRemoveCommanderQuestion={room.removeCommanderQuestion}
            onAnswerCommanderQuestion={room.answerCommanderQuestion}
            onSetPhaseSkippable={room.setPhaseSkippableFlag}
            onSkipPhase={room.skipPhase}
            skippedPhases={room.skippedPhases}
            assigneeOptions={assigneeOptions}
            workItems={room.scenarioWorkItems}
            collabThreads={room.scenarioCollabThreads}
            completedPhaseIds={room.completedPhaseIds}
            onCompletePhase={room.completePhase}
          />
        </Box>
        {canvasMode ? null : (
          <InvestigationWorkspace
            room={room}
            dockSafeZone={showDockedFloat}
            dockSafeZoneHeight={
              denseRoom ? ROOM_MEDIA_DOCK_SAFE_ZONE_DENSE : ROOM_MEDIA_DOCK_SAFE_ZONE
            }
          />
        )}
        {showDockedFloat ? (
          <Box
            className="monosuite-live-float-anchor"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: ROOM_MEDIA_DOCK_GUTTER + 8,
              zIndex: 30,
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
                pack={pack}
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
                roomDescription={room.roomSettings.description}
                roomTags={room.roomSettings.tags}
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
        incident={pack.incident}
        attackerEntities={attackers}
        victimEntities={victims}
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
        initialPhaseId={room.evidencePhaseId}
        phaseOptions={phaseOptions}
        onClose={() => room.setEvidenceOpen(false)}
        onAdd={room.addEvidence}
      />

      <EvidenceDrawer
        opened={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        items={room.evidence}
        onAdd={(kind) => room.openAddEvidence(kind)}
        onRemove={room.removeEvidence}
      />

      <AffectedEntitiesBoard
        opened={affectedEntitiesOpen}
        onClose={() => setAffectedEntitiesOpen(false)}
      />

      <AttackMapModal
        opened={attackMapOpen}
        onClose={() => setAttackMapOpen(false)}
        attacker={attackers.find((entity) => entity.id === attackerId) ?? attackers[0]}
        victim={victims.find((entity) => entity.id === victimId) ?? victims[0]}
      />

      <TransferCommandModal
        opened={room.transferCommandOpen}
        commanderName={room.commanderParticipant?.name ?? 'Commander'}
        candidates={room.transferCommandCandidates}
        onClose={() => room.setTransferCommandOpen(false)}
        onConfirm={room.transferCommand}
      />

      <Toast message={room.toast} onClose={room.clearToast} />
    </>
  );
}
