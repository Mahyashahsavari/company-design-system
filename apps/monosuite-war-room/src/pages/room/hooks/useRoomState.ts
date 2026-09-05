import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoomWorkflow } from './useRoomWorkflow';
import { CURRENT_USER, ROOM_WIDE_PANELS_COLLAPSE_QUERY } from '../../../shared/constants';
import {
  CONNECTION_CYCLE,
  DEFAULT_COMMANDER_PARTICIPANT_ID,
  DEFAULT_ROOM_SETTINGS,
  DIRECTORY_USERS,
  EVIDENCE_ITEMS,
  INITIAL_HISTORY,
  INITIAL_QUESTIONS,
  linkedSourceFromPreview,
  LIVE_PEOPLE,
  PARTICIPANTS,
  PARTICIPANT_COLOR_CYCLE,
  ROOM_ELAPSED_SEED_MS,
  formatRoomElapsedHms,
  formatStartedAtTime,
  type RoomLifecycle,
  type RoomSlaPolicy,
  initialsFromParts,
  type ConnectionState,
  type ContextTab,
  type EvidenceDraft,
  type EvidenceItem,
  type EvidenceKind,
  type CommanderAssignee,
  type CommanderQuestion,
  type ExternalGuestInvite,
  type HistoryEntry,
  type LivePerson,
  type LocalCameraState,
  type LocalMicState,
  type LocalShareState,
  type LocalSpeakerState,
  type MediaPermission,
  type MemberInvite,
  type Participant,
  type Question,
  type ShareLayout,
  type WorkspaceTab,
  type PinTarget,
  type RoomSettingsDraft,
  getQuestionsForTab,
  getRemoteCamerasOn,
} from '../data';
import type { RoomScenarioPack } from '../scenarios';
import {
  formatTaskAnswerDisplay,
  makePersonAnswer,
  peopleForTaskRole,
  TASK_ROLE_LABEL,
  taskQuorumStatus,
  upsertPersonAnswer,
} from '../taskQuorum';

/** Mock — active room with elapsed seed; scheduled rooms hide operational time. */
const MOCK_ROOM_LIFECYCLE: RoomLifecycle = 'active';
/** Mock — null until backend policy provides SLA. */
const MOCK_ROOM_SLA_POLICY: RoomSlaPolicy | null = null;

export interface MediaState {
  joined: boolean;
  /** Local user microphone only. */
  mic: boolean;
  /** Local user camera only — never controls remote participant cameras. */
  camera: boolean;
  speaker: boolean;
  share: boolean;
  remoteShareBy: string | null;
  shareLayout: ShareLayout;
  connection: ConnectionState;
  speakingId: string;
  /** Camera/mic permission for the local device. */
  permission: MediaPermission;
  micPermission: MediaPermission;
  sharePermission: MediaPermission;
  mutedByModerator: boolean;
  micConnecting: boolean;
  cameraConnecting: boolean;
  speakerUnavailable: boolean;
}

export interface MediaDevices {
  microphone: string;
  speaker: string;
  camera: string;
  connection: string;
}

const INITIAL_MEDIA: MediaState = {
  joined: true,
  mic: true,
  camera: false,
  speaker: true,
  share: false,
  remoteShareBy: null,
  shareLayout: 'split',
  connection: 'connected',
  speakingId: 'sarah',
  permission: 'granted',
  micPermission: 'granted',
  sharePermission: 'granted',
  mutedByModerator: false,
  micConnecting: false,
  cameraConnecting: false,
  speakerUnavailable: false,
};

const INITIAL_DEVICES: MediaDevices = {
  microphone: 'default-mic',
  speaker: 'default-speaker',
  camera: 'integrated',
  connection: 'good',
};

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function resolveLocalMicState(media: MediaState): LocalMicState {
  if (media.micConnecting) return 'connecting';
  if (media.micPermission === 'denied') return 'permission-denied';
  if (media.mutedByModerator) return 'muted-by-moderator';
  return media.mic ? 'on' : 'off';
}

export function resolveLocalCameraState(media: MediaState): LocalCameraState {
  if (media.cameraConnecting) return 'connecting';
  if (media.permission === 'denied') return 'permission-denied';
  return media.camera ? 'on' : 'off';
}

export function resolveLocalSpeakerState(media: MediaState): LocalSpeakerState {
  if (media.speakerUnavailable) return 'unavailable';
  return media.speaker ? 'on' : 'off';
}

export function resolveLocalShareState(media: MediaState): LocalShareState {
  if (media.sharePermission === 'denied') return 'permission-denied';
  if (media.share) return 'sharing';
  if (media.remoteShareBy) return 'remote-sharing';
  return 'available';
}

export function useRoomState(pack?: RoomScenarioPack | null) {
  const canManageParticipants = CURRENT_USER.canManageParticipants;
  const canEditRoomSettings = CURRENT_USER.canEditRoomSettings;

  const [sidebarTab, setSidebarTab] = useState<ContextTab>('participants');
  const [asideCollapsed, setAsideCollapsed] = useState(true);
  const asidePinnedByUser = useRef(true);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('questions');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(
    () => pack?.questions[0]?.id ?? 1,
  );
  const [answeringQuestion, setAnsweringQuestion] = useState<number | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>(() =>
    structuredClone(pack?.questions ?? INITIAL_QUESTIONS),
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => [
    ...(pack?.history ?? INITIAL_HISTORY),
  ]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaState>(INITIAL_MEDIA);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>(INITIAL_DEVICES);
  const [livePeople, setLivePeople] = useState<LivePerson[]>(() =>
    structuredClone(LIVE_PEOPLE),
  );
  const [participants, setParticipants] = useState<Participant[]>(() =>
    structuredClone(pack?.participants ?? PARTICIPANTS),
  );
  const [commanderParticipantId, setCommanderParticipantId] = useState(
    pack?.commanderParticipantId ?? DEFAULT_COMMANDER_PARTICIPANT_ID,
  );
  const [transferCommandOpen, setTransferCommandOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [manualIncidentOpen, setManualIncidentOpen] = useState(false);
  const [mediaSettingsOpen, setMediaSettingsOpen] = useState(false);
  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(() =>
    structuredClone(pack?.evidence ?? EVIDENCE_ITEMS),
  );
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>('file');
  const [evidencePhaseId, setEvidencePhaseId] = useState<string | null>(null);
  const [commanderQuestions, setCommanderQuestions] = useState<CommanderQuestion[]>([]);
  const [phaseSkippable, setPhaseSkippable] = useState<Record<string, boolean>>({});
  const [skippedPhases, setSkippedPhases] = useState<string[]>([]);
  const [triageNotes, setTriageNotes] = useState('');
  const [roomSettings, setRoomSettings] = useState<RoomSettingsDraft>(
    () => structuredClone(pack?.roomSettings ?? DEFAULT_ROOM_SETTINGS),
  );
  const roomWorkflow = useRoomWorkflow(roomSettings.workflow, pack?.id);
  const [typingVisible] = useState(true);
  const [pinnedTarget, setPinnedTarget] = useState<PinTarget | null>(null);
  const [collaborationFullscreen, setCollaborationFullscreen] = useState(false);
  const [collaborationSplit, setCollaborationSplit] = useState(false);
  const [collaborationSplitWidth, setCollaborationSplitWidth] = useState(280);
  const splitBeforeFullscreenRef = useRef(false);
  const [startedAt] = useState(() => Date.now() - ROOM_ELAPSED_SEED_MS);
  const [now, setNow] = useState(() => Date.now());
  const [selectedDecision, setSelectedDecision] = useState<Record<number, string>>({});
  const [completedPhaseIds, setCompletedPhaseIds] = useState<string[]>([]);
  const scenarioWorkItems = pack?.workItems;
  const scenarioCollabThreads = pack?.collabThreads;
  const scenarioIncident = pack?.incident;
  const scenarioAttackers = pack?.attackerEntities;
  const scenarioVictims = pack?.victimEntities;
  const scenarioLinkedAlerts = pack?.linkedAlerts;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!media.joined) return;
    const id = window.setInterval(() => {
      setMedia((prev) => {
        if (!prev.joined) return prev;
        const idx = CONNECTION_CYCLE.indexOf(
          prev.connection === 'idle' ? 'connected' : prev.connection,
        );
        const safeIdx = idx < 0 ? 0 : idx;
        const next = CONNECTION_CYCLE[(safeIdx + 1) % CONNECTION_CYCLE.length];
        return { ...prev, connection: next };
      });
    }, 12000);
    return () => window.clearInterval(id);
  }, [media.joined]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const roomLifecycle = MOCK_ROOM_LIFECYCLE;
  const roomSlaPolicy = MOCK_ROOM_SLA_POLICY;
  const showOperationalTime = roomLifecycle === 'active';
  const elapsedMs = showOperationalTime ? now - startedAt : 0;
  const startedAtLabel = formatStartedAtTime(startedAt);
  const elapsedLabel = formatRoomElapsedHms(elapsedMs);

  const tabCounts = useMemo(
    () => ({
      questions: getQuestionsForTab(questions, 'questions').length,
      findings: getQuestionsForTab(questions, 'findings').length,
      decisions: getQuestionsForTab(questions, 'decisions').length,
    }),
    [questions],
  );

  const workspaceItems = useMemo(
    () => getQuestionsForTab(questions, workspaceTab),
    [questions, workspaceTab],
  );

  const shareActive = Boolean(media.share || media.remoteShareBy);
  const shareMinimized = media.shareLayout === 'minimized';
  const presenting = Boolean(shareActive && !shareMinimized);
  const remoteCamerasOn = useMemo(() => getRemoteCamerasOn(livePeople), [livePeople]);
  const mediaSurfaceActive = Boolean(
    media.joined &&
    (presenting ||
      remoteCamerasOn.length > 0 ||
      media.camera ||
      media.permission !== 'granted' ||
      media.connection === 'reconnecting' ||
      media.connection === 'lost'),
  );

  const toggleAside = useCallback(() => {
    asidePinnedByUser.current = true;
    setAsideCollapsed((v) => !v);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(ROOM_WIDE_PANELS_COLLAPSE_QUERY);
    const sync = () => {
      if (asidePinnedByUser.current) return;
      setAsideCollapsed(mediaQuery.matches);
    };
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  const toggleQuestion = useCallback((id: number) => {
    setExpandedQuestion((prev) => (prev === id ? null : id));
  }, []);

  const startAddAnswer = useCallback((id: number) => {
    setExpandedQuestion(id);
    setAnsweringQuestion(id);
  }, []);

  const cancelAddAnswer = useCallback(() => {
    setAnsweringQuestion(null);
  }, []);

  const submitAnswer = useCallback(
    (id: number, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          const answers = [
            ...(q.answers ?? []),
            { id: `a-${id}-${Date.now().toString(36)}`, author: CURRENT_USER.name, text: trimmed },
          ];
          const roleAnswers = q.assigneeRole
            ? upsertPersonAnswer(
                q.roleAnswers,
                makePersonAnswer({
                  participantId: CURRENT_USER.id,
                  participantName: CURRENT_USER.name,
                  values: [trimmed],
                }),
              )
            : q.roleAnswers;
          return {
            ...q,
            answers,
            answerCount: q.answerCount + 1,
            roleAnswers,
          };
        }),
      );
      setHistory((h) => [
        { time: nowTime(), actor: CURRENT_USER.name, action: 'added an answer', highlight: false },
        ...h,
      ]);
      setAnsweringQuestion(null);
      showToast('Answer submitted');
    },
    [showToast],
  );

  const updateAnswer = useCallback(
    (questionId: number, answerId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: (q.answers ?? []).map((answer) =>
                  answer.id === answerId ? { ...answer, text: trimmed, edited: true } : answer,
                ),
              }
            : q,
        ),
      );
      showToast('Answer updated');
    },
    [showToast],
  );

  const deleteAnswer = useCallback(
    (questionId: number, answerId: string) => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          const answers = (q.answers ?? []).filter((answer) => answer.id !== answerId);
          return {
            ...q,
            answers,
            answerCount: Math.max(0, answers.length),
          };
        }),
      );
      setHistory((h) => [
        { time: nowTime(), actor: CURRENT_USER.name, action: 'removed an answer', highlight: false },
        ...h,
      ]);
      showToast('Answer deleted');
    },
    [showToast],
  );

  const submitDiscussion = useCallback(
    (id: number, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          return {
            ...q,
            discussion: [
              ...(q.discussion ?? []),
              { id: `d-${id}-${Date.now().toString(36)}`, author: CURRENT_USER.name, text: trimmed },
            ],
          };
        }),
      );
      setDiscussionOpen(id);
      setExpandedQuestion(id);
      showToast('Comment posted');
    },
    [showToast],
  );

  const updateDiscussion = useCallback(
    (questionId: number, commentId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                discussion: (q.discussion ?? []).map((item) =>
                  item.id === commentId ? { ...item, text: trimmed, edited: true } : item,
                ),
              }
            : q,
        ),
      );
      showToast('Comment updated');
    },
    [showToast],
  );

  const deleteDiscussion = useCallback(
    (questionId: number, commentId: string) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                discussion: (q.discussion ?? []).filter((item) => item.id !== commentId),
              }
            : q,
        ),
      );
      showToast('Comment deleted');
    },
    [showToast],
  );

  const toggleDiscussion = useCallback((id: number) => {
    setDiscussionOpen((prev) => (prev === id ? null : id));
    setExpandedQuestion(id);
  }, []);

  const recordDecision = useCallback(
    (id: number, values: string[], otherText?: string) => {
      if (!values.length) return;
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          const personAnswer = makePersonAnswer({
            participantId: CURRENT_USER.id,
            participantName: CURRENT_USER.name,
            values,
            otherText,
          });
          const roleAnswers = upsertPersonAnswer(q.roleAnswers, personAnswer);
          const people = q.assigneeRole
            ? peopleForTaskRole(q.assigneeRole, participants, commanderParticipantId)
            : [];
          const quorum = taskQuorumStatus(roleAnswers, people);
          const summary = formatTaskAnswerDisplay(personAnswer);
          return {
            ...q,
            roleAnswers,
            decision: { choice: summary, by: CURRENT_USER.name, at: nowTime() },
            status: quorum.isComplete || people.length === 0 ? ('answered' as const) : ('decision' as const),
          };
        }),
      );
      setHistory((h) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: 'Decision recorded',
          highlight: true,
        },
        ...h,
      ]);
      showToast('Decision recorded');
    },
    [commanderParticipantId, participants, showToast],
  );

  const joinLive = useCallback(() => {
    setMedia((m) => ({
      ...m,
      joined: true,
      connection: 'connected',
    }));
    setLivePeople((prev) =>
      prev.map((p) => {
        const remote = PARTICIPANTS.find((x) => x.id === p.id);
        if (p.isLocal || !remote) return p;
        return { ...p, camera: remote.camera };
      }),
    );
    showToast('Joined live communication');
  }, [showToast]);

  const leaveLive = useCallback(() => {
    setMedia((m) => ({
      ...m,
      joined: false,
      mic: false,
      camera: false,
      share: false,
      remoteShareBy: null,
      connection: 'idle',
    }));
    setPinnedTarget(null);
    setCollaborationSplit(false);
    setCollaborationFullscreen(false);
    showToast('Left live communication');
  }, [showToast]);

  const toggleMedia = useCallback(
    (key: 'mic' | 'camera' | 'speaker') => {
      setMedia((m) => {
        if (!m.joined && key !== 'speaker') return m;

        if (key === 'mic') {
          if (m.mutedByModerator) {
            showToast('Microphone muted by moderator');
            return m;
          }
          if (m.micPermission === 'denied') {
            showToast('Microphone permission denied');
            return m;
          }
          if (m.micConnecting) return m;
          return { ...m, mic: !m.mic };
        }

        if (key === 'camera') {
          const turningOn = !m.camera;
          if (turningOn && m.permission === 'denied') {
            showToast('Camera permission denied');
            return m;
          }
          if (turningOn && m.permission === 'unavailable') {
            showToast('Camera unavailable');
            return m;
          }
          if (m.cameraConnecting) return m;
          const nextCamera = turningOn;
          setLivePeople((prev) =>
            prev.map((p) => (p.isLocal ? { ...p, camera: nextCamera } : p)),
          );
          return { ...m, camera: nextCamera };
        }

        if (m.speakerUnavailable) {
          showToast('Speaker device unavailable');
          return m;
        }
        return { ...m, speaker: !m.speaker };
      });
    },
    [showToast],
  );

  const startShare = useCallback(() => {
    let nextSharing: boolean | null = null;
    setMedia((m) => {
      if (!m.joined) return m;
      if (m.sharePermission === 'denied') {
        showToast('Screen share permission denied');
        return m;
      }
      if (m.remoteShareBy && !m.share) {
        showToast(`${m.remoteShareBy} is already sharing`);
        return m;
      }
      if (m.share) {
        nextSharing = false;
        return { ...m, share: false, shareLayout: 'split' };
      }
      nextSharing = true;
      return {
        ...m,
        share: true,
        remoteShareBy: null,
        shareLayout: 'split',
        camera: false,
      };
    });
    if (nextSharing != null) {
      if (nextSharing) setPinnedTarget({ kind: 'share' });
      else setPinnedTarget(null);
      showToast(nextSharing ? 'Screen share started' : 'Screen share stopped');
    }
  }, [showToast]);

  const stopShare = useCallback(() => {
    setMedia((m) => ({
      ...m,
      share: false,
      remoteShareBy: null,
      shareLayout: 'split',
    }));
    setPinnedTarget((prev) => (prev?.kind === 'share' ? null : prev));
    setCollaborationFullscreen(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    showToast('Screen share stopped');
  }, [showToast]);

  const setShareLayout = useCallback((layout: ShareLayout) => {
    setMedia((m) => ({ ...m, shareLayout: layout }));
  }, []);

  /** Demo: Mike shares while video room is active */
  const simulateRemoteShare = useCallback(() => {
    setMedia((m) => ({
      ...m,
      joined: true,
      connection: m.connection === 'idle' ? 'connected' : m.connection,
      share: false,
      remoteShareBy: 'Mike Chen',
      shareLayout: 'split',
    }));
    setPinnedTarget({ kind: 'share' });
  }, []);

  const pinParticipant = useCallback((id: string) => {
    setPinnedTarget({ kind: 'participant', id });
  }, []);

  const pinShare = useCallback(() => {
    if (!shareActive) return;
    setPinnedTarget({ kind: 'share' });
  }, [shareActive]);

  const unpin = useCallback(() => {
    setPinnedTarget(null);
  }, []);

  const setCollaborationFullscreenActive = useCallback((active: boolean) => {
    if (active) {
      setCollaborationSplit((split) => {
        splitBeforeFullscreenRef.current = split;
        return false;
      });
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      }
    }
    setCollaborationFullscreen(active);
  }, []);

  const exitCollaborationFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    setCollaborationFullscreen(false);
    if (splitBeforeFullscreenRef.current) {
      setCollaborationSplit(true);
      splitBeforeFullscreenRef.current = false;
    }
  }, []);

  const toggleCollaborationSplit = useCallback(() => {
    setCollaborationSplit((split) => {
      const next = !split;
      if (next) {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        }
        setCollaborationFullscreen(false);
      }
      return next;
    });
  }, []);

  const setMediaPermission = useCallback((permission: MediaPermission) => {
    setMedia((m) => ({
      ...m,
      permission,
      camera: permission === 'granted' ? m.camera : false,
    }));
  }, []);

  const saveRoomSettings = useCallback(
    (next: RoomSettingsDraft) => {
      setRoomSettings(next);
      showToast('Room settings saved');
    },
    [showToast],
  );

  const retryConnection = useCallback(() => {
    setMedia((m) => ({ ...m, connection: 'connected' }));
    showToast('Connection restored');
  }, [showToast]);

  const closeRoom = useCallback(() => {
    if (commanderParticipantId === CURRENT_USER.id) {
      showToast('Transfer command before closing the room');
      return;
    }
    showToast('Room closed');
  }, [commanderParticipantId, showToast]);

  const roomAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'invite':
          setInviteOpen(true);
          break;
        case 'add-evidence':
          setEvidenceKind('file');
          setEvidenceOpen(true);
          break;
        case 'export':
          showToast('Exporting room summary…');
          break;
        case 'room-settings':
          if (!canEditRoomSettings) {
            showToast('You do not have permission to edit room settings');
            break;
          }
          setRoomSettingsOpen(true);
          break;
        case 'close-room':
          closeRoom();
          break;
        case 'transfer-command':
          if (canManageParticipants || commanderParticipantId === CURRENT_USER.id) {
            setTransferCommandOpen(true);
          }
          break;
        case 'view-incident':
          setManualIncidentOpen(true);
          break;
        case 'rooms':
          break;
        default:
          showToast(action);
      }
    },
    [canEditRoomSettings, canManageParticipants, commanderParticipantId, closeRoom, showToast],
  );

  const openAddEvidence = useCallback((kind: EvidenceKind = 'file', phaseId?: string | null) => {
    setEvidenceKind(kind);
    setEvidencePhaseId(phaseId ?? null);
    setEvidenceOpen(true);
  }, []);

  const addEvidence = useCallback(
    (drafts: EvidenceDraft[]) => {
      if (drafts.length === 0) return;

      const historyEntries: HistoryEntry[] = [];
      const items: EvidenceItem[] = [];

      for (const draft of drafts) {
        const base = {
          id: `e-${crypto.randomUUID()}`,
          by: CURRENT_USER.name,
          time: nowTime(),
          phaseId: draft.phaseId,
        };

        if (draft.kind === 'source') {
          const preview = draft.preview;
          const duplicate = evidence.some(
            (item) =>
              item.kind === 'source' &&
              item.source?.adapterId === preview.adapterId &&
              item.source.recordId === preview.recordId,
          );
          if (duplicate) {
            showToast(`Already linked · ${preview.recordId}`);
            continue;
          }
          const item: EvidenceItem = {
            ...base,
            kind: 'source',
            name: preview.title,
            type: preview.recordTypeLabel.toUpperCase(),
            source: linkedSourceFromPreview(preview),
          };
          items.push(item);
          historyEntries.push({
            time: base.time,
            actor: CURRENT_USER.name,
            action: `linked source record · ${preview.adapter} · ${preview.recordId} · ${preview.title}`,
            highlight: true,
          });
          continue;
        }

        if (draft.kind === 'file') {
          items.push({
            ...base,
            kind: 'file',
            name: draft.name,
            type: draft.type,
            sizeBytes: draft.sizeBytes,
          });
          continue;
        }

        if (draft.kind === 'link') {
          items.push({
            ...base,
            kind: 'link',
            name: draft.name,
            type: 'LINK',
            url: draft.url,
          });
          continue;
        }

        items.push({
          ...base,
          kind: 'note',
          name: draft.name,
          type: 'NOTE',
          note: draft.note,
        });
      }

      if (items.length === 0) return;

      const nonSourceItems = items.filter((item) => item.kind !== 'source');
      if (nonSourceItems.length > 0) {
        historyEntries.push({
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `added evidence · ${nonSourceItems.map((item) => item.name).join(', ')}`,
          highlight: true,
        });
      }

      setEvidence((current) => [...items, ...current]);
      const summary = items.length === 1 ? items[0].name : `${items.length} items`;
      const linkedCount = items.filter((item) => item.kind === 'source').length;
      showToast(
        linkedCount === items.length
          ? `Source record linked · ${summary}`
          : `Evidence added · ${summary}`,
      );
      if (historyEntries.length > 0) {
        setHistory((entries) => [...historyEntries, ...entries]);
      }
      setEvidenceOpen(false);
      setEvidencePhaseId(null);
    },
    [evidence, showToast],
  );

  const resolveCommanderAssigneeDisplay = useCallback((assignee: CommanderAssignee) => {
    if (assignee.type === 'role') {
      return {
        assigneeId: `role:${assignee.role}`,
        assigneeName: TASK_ROLE_LABEL[assignee.role],
      };
    }
    return { assigneeId: assignee.id, assigneeName: assignee.name };
  }, []);

  const addCommanderQuestion = useCallback(
    (input: {
      phaseId: string;
      title: string;
      assignee: CommanderAssignee;
      required: boolean;
    }) => {
      const { assigneeId, assigneeName } = resolveCommanderAssigneeDisplay(input.assignee);
      const question: CommanderQuestion = {
        id: `cq-${crypto.randomUUID()}`,
        phaseId: input.phaseId,
        title: input.title.trim(),
        assigneeId,
        assigneeName,
        assignee: input.assignee,
        required: input.required,
        answerType: 'textarea',
        roleAnswers: [],
        createdBy: CURRENT_USER.name,
      };
      setCommanderQuestions((current) => [...current, question]);
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `added custom question · ${question.title}`,
          highlight: true,
        },
        ...entries,
      ]);
      showToast('Custom question added');
    },
    [resolveCommanderAssigneeDisplay, showToast],
  );

  const updateCommanderQuestion = useCallback(
    (
      id: string,
      input: {
        title: string;
        assignee: CommanderAssignee;
        required: boolean;
      },
    ) => {
      const title = input.title.trim();
      if (!title) {
        showToast('Enter a question title');
        return;
      }
      const { assigneeId, assigneeName } = resolveCommanderAssigneeDisplay(input.assignee);
      setCommanderQuestions((current) => {
        const existing = current.find((question) => question.id === id);
        if (!existing) return current;
        return current.map((question) =>
          question.id === id
            ? {
                ...question,
                title,
                assigneeId,
                assigneeName,
                assignee: input.assignee,
                required: input.required,
              }
            : question,
        );
      });
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `edited custom question · ${title}`,
          highlight: true,
        },
        ...entries,
      ]);
      showToast('Custom question updated');
    },
    [resolveCommanderAssigneeDisplay, showToast],
  );

  const removeCommanderQuestion = useCallback(
    (id: string) => {
      const target = commanderQuestions.find((question) => question.id === id);
      if (!target) return;
      setCommanderQuestions((current) => current.filter((question) => question.id !== id));
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `removed custom question · ${target.title}`,
          highlight: true,
        },
        ...entries,
      ]);
      showToast('Custom question removed');
    },
    [commanderQuestions, showToast],
  );

  const answerCommanderQuestion = useCallback(
    (id: string, payload: { values: string[]; otherText?: string }) => {
      if (!payload.values.length) {
        showToast('Enter an answer first');
        return;
      }
      const personAnswer = makePersonAnswer({
        participantId: CURRENT_USER.id,
        participantName: CURRENT_USER.name,
        values: payload.values,
        otherText: payload.otherText,
      });
      const summary = formatTaskAnswerDisplay(personAnswer);
      const target = commanderQuestions.find((question) => question.id === id);
      setCommanderQuestions((current) =>
        current.map((question) =>
          question.id === id
            ? {
                ...question,
                roleAnswers: upsertPersonAnswer(question.roleAnswers, personAnswer),
                answer: summary,
              }
            : question,
        ),
      );
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `answered custom question · ${target?.title ?? id}`,
          highlight: false,
        },
        ...entries,
      ]);
      showToast('Answer recorded');
    },
    [commanderQuestions, showToast],
  );

  const setPhaseSkippableFlag = useCallback((phaseId: string, skippable: boolean) => {
    setPhaseSkippable((current) => ({ ...current, [phaseId]: skippable }));
    showToast(skippable ? 'Phase marked skippable' : 'Phase marked required');
  }, [showToast]);

  const skipPhase = useCallback(
    (phaseId: string) => {
      setSkippedPhases((current) => (current.includes(phaseId) ? current : [...current, phaseId]));
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `skipped phase · ${phaseId}`,
          highlight: false,
        },
        ...entries,
      ]);
      showToast('Phase skipped');
    },
    [showToast],
  );

  const completePhase = useCallback(
    (phaseId: string) => {
      setCompletedPhaseIds((current) =>
        current.includes(phaseId) ? current : [...current, phaseId],
      );
      roomWorkflow.setStepStatuses((steps) => {
        const index = steps.findIndex((step) => step.id === phaseId);
        if (index < 0) return steps;
        return steps.map((step, stepIndex) => {
          if (stepIndex <= index) return { ...step, status: 'completed' as const };
          if (stepIndex === index + 1) return { ...step, status: 'current' as const };
          return step;
        });
      });
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `completed phase · ${phaseId}`,
          highlight: true,
        },
        ...entries,
      ]);
      showToast('Phase completed');
    },
    [roomWorkflow, showToast],
  );

  const removeEvidence = useCallback(
    (id: string) => {
      setEvidence((current) => {
        const target = current.find((item) => item.id === id);
        if (!target) return current;

        const action =
          target.kind === 'source' && target.source
            ? `removed linked source record · ${target.source.adapter} · ${target.source.recordId}`
            : `removed evidence · ${target.name}`;

        setHistory((entries) => [
          {
            time: nowTime(),
            actor: CURRENT_USER.name,
            action,
            highlight: false,
          },
          ...entries,
        ]);
        showToast(
          target.kind === 'source' ? `Link removed · ${target.source?.recordId}` : `Removed · ${target.name}`,
        );
        return current.filter((item) => item.id !== id);
      });
    },
    [showToast],
  );

  const invitePeople = useCallback(
    (members: MemberInvite[], guests: ExternalGuestInvite[]) => {
      const memberPeople = members
        .map((member) => {
          const user = DIRECTORY_USERS.find((item) => item.id === member.userId);
          return user ? { user, role: member.role } : null;
        })
        .filter((item): item is { user: (typeof DIRECTORY_USERS)[number]; role: MemberInvite['role'] } =>
          Boolean(item),
        );
      const invitedNames = [
        ...memberPeople.map(({ user }) => user.name),
        ...guests.map((guest) => `${guest.firstName.trim()} ${guest.lastName.trim()}`),
      ];

      setParticipants((prev) => {
        const next = [...prev];
        const nextColor = () =>
          PARTICIPANT_COLOR_CYCLE[next.length % PARTICIPANT_COLOR_CYCLE.length];

        for (const { user, role } of memberPeople) {
          const existing = next.findIndex((person) => person.id === user.id);
          const asGuest = role === 'Guest';
          if (existing >= 0) {
            next[existing] = {
              ...next[existing],
              role,
              removed: false,
              guest: asGuest,
              email: user.email,
            };
            continue;
          }
          next.push({
            id: user.id,
            name: user.name,
            initials: user.initials,
            role,
            status: 'away',
            color: nextColor(),
            mic: false,
            camera: false,
            email: user.email,
            guest: asGuest,
          });
        }

        for (const guest of guests) {
          next.push({
            id: `guest-${crypto.randomUUID()}`,
            name: `${guest.firstName.trim()} ${guest.lastName.trim()}`,
            initials: initialsFromParts(guest.firstName, guest.lastName),
            role: 'Guest',
            status: 'away',
            color: nextColor(),
            mic: false,
            camera: false,
            email: guest.email.trim(),
            guest: true,
          });
        }

        return next;
      });

      const summary =
        invitedNames.length === 1 ? invitedNames[0] : `${invitedNames.length} people`;
      showToast(`Invitation sent to ${summary}`);
      setHistory((entries) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `invited ${invitedNames.join(', ')}`,
          highlight: true,
        },
        ...entries,
      ]);
      setInviteOpen(false);
    },
    [showToast],
  );

  const syncAllSources = useCallback(() => {
    showToast('All sources synced');
    setHistory((h) => [
      {
        time: nowTime(),
        actor: 'System',
        action: 'All sources synced',
        highlight: false,
      },
      ...h,
    ]);
  }, [showToast]);

  const applyMediaSettings = useCallback(
    (next: MediaDevices, permission?: MediaPermission) => {
      setMediaDevices(next);
      if (permission) {
        setMedia((m) => ({
          ...m,
          permission,
          camera: permission === 'granted' ? m.camera : false,
        }));
      }
      setMediaSettingsOpen(false);
      showToast('Media settings applied');
    },
    [showToast],
  );

  const activeParticipants = useMemo(
    () => participants.filter((p) => !p.removed),
    [participants],
  );

  const commanderParticipant = useMemo(() => {
    if (commanderParticipantId === CURRENT_USER.id) {
      return {
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        role: CURRENT_USER.roomRole,
      };
    }
    const remote = activeParticipants.find((p) => p.id === commanderParticipantId);
    return remote
      ? { id: remote.id, name: remote.name, role: remote.role }
      : null;
  }, [activeParticipants, commanderParticipantId]);

  const isLocalCommander = commanderParticipantId === CURRENT_USER.id;

  const canTransferCommand = canManageParticipants || isLocalCommander;

  const transferCommandCandidates = useMemo(
    () => [
      ...activeParticipants
        .filter((p) => p.id !== commanderParticipantId)
        .map((p) => ({ id: p.id, name: p.name, role: p.role })),
      ...(commanderParticipantId !== CURRENT_USER.id
        ? [{ id: CURRENT_USER.id, name: CURRENT_USER.name, role: CURRENT_USER.roomRole }]
        : []),
    ],
    [activeParticipants, commanderParticipantId],
  );

  const toggleParticipantMic = useCallback(
    (id: string) => {
      if (!canManageParticipants) return;
      let nextMic = false;
      let targetName = 'Participant';
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          nextMic = !p.mic;
          targetName = p.name;
          return { ...p, mic: nextMic, speaking: nextMic ? p.speaking : false };
        }),
      );
      if (!nextMic) {
        setMedia((m) => (m.speakingId === id ? { ...m, speakingId: '' } : m));
      }
      showToast(`${targetName} ${nextMic ? 'unmuted' : 'muted'}`);
      setHistory((h) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `${nextMic ? 'unmuted' : 'muted'} ${targetName}`,
          highlight: false,
        },
        ...h,
      ]);
    },
    [canManageParticipants, showToast],
  );

  const toggleParticipantCamera = useCallback(
    (id: string) => {
      if (!canManageParticipants) return;
      let nextCamera = false;
      let targetName = 'Participant';
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          nextCamera = !p.camera;
          targetName = p.name;
          return { ...p, camera: nextCamera };
        }),
      );
      setLivePeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, camera: nextCamera } : p)),
      );
      showToast(`${targetName} camera ${nextCamera ? 'enabled' : 'disabled'}`);
    },
    [canManageParticipants, showToast],
  );

  const removeParticipant = useCallback(
    (id: string) => {
      if (!canManageParticipants) return;
      if (id === commanderParticipantId) {
        showToast('Transfer command before removing the commander');
        return;
      }
      const target = participants.find((p) => p.id === id);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, removed: true, mic: false, camera: false } : p)),
      );
      setLivePeople((prev) => prev.filter((p) => p.id !== id));
      showToast(`${target?.name ?? 'Participant'} removed from room`);
      setHistory((h) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `removed ${target?.name ?? 'participant'}`,
          highlight: true,
        },
        ...h,
      ]);
    },
    [canManageParticipants, commanderParticipantId, participants, showToast],
  );

  const setParticipantRole = useCallback(
    (id: string, role: string) => {
      if (!canManageParticipants) return;
      if (role === 'Commander') return;
      setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
      showToast('Participant role updated');
    },
    [canManageParticipants, showToast],
  );

  const openTransferCommand = useCallback(() => {
    if (!canTransferCommand) return;
    setTransferCommandOpen(true);
  }, [canTransferCommand]);

  const transferCommand = useCallback(
    (nextCommanderId: string) => {
      if (!canTransferCommand) return;
      if (nextCommanderId === commanderParticipantId) return;

      const nextRemote = activeParticipants.find((p) => p.id === nextCommanderId);
      const nextName =
        nextCommanderId === CURRENT_USER.id
          ? CURRENT_USER.name
          : (nextRemote?.name ?? 'Participant');

      const previousName = commanderParticipant?.name ?? 'Commander';

      setCommanderParticipantId(nextCommanderId);
      setTransferCommandOpen(false);
      setHistory((h) => [
        {
          time: nowTime(),
          actor: CURRENT_USER.name,
          action: `transferred command from ${previousName} to ${nextName}`,
          highlight: true,
        },
        ...h,
      ]);
      showToast(`Command transferred to ${nextName}`);
    },
    [
      activeParticipants,
      canTransferCommand,
      commanderParticipant,
      commanderParticipantId,
      showToast,
    ],
  );

  const viewParticipantDetails = useCallback(
    (id: string) => {
      const target = participants.find((p) => p.id === id);
      showToast(`Details · ${target?.name ?? 'Participant'} · ${target?.role ?? ''}`);
    },
    [participants, showToast],
  );

  const setLocalMediaFlags = useCallback(
    (
      flags: Partial<
        Pick<
          MediaState,
          | 'mutedByModerator'
          | 'micConnecting'
          | 'cameraConnecting'
          | 'speakerUnavailable'
          | 'micPermission'
          | 'sharePermission'
          | 'mic'
          | 'camera'
          | 'speaker'
        >
      >,
    ) => {
      setMedia((m) => ({ ...m, ...flags }));
    },
    [],
  );

  return {
    sidebarTab,
    setSidebarTab,
    asideCollapsed,
    toggleAside,
    workspaceTab,
    setWorkspaceTab,
    expandedQuestion,
    toggleQuestion,
    answeringQuestion,
    startAddAnswer,
    cancelAddAnswer,
    submitAnswer,
    updateAnswer,
    deleteAnswer,
    submitDiscussion,
    updateDiscussion,
    deleteDiscussion,
    discussionOpen,
    toggleDiscussion,
    questions,
    workspaceItems,
    tabCounts,
    history,
    expandedSource,
    setExpandedSource,
    media,
    mediaDevices,
    livePeople,
    participants: activeParticipants,
    commanderParticipantId,
    commanderParticipant,
    isLocalCommander,
    canTransferCommand,
    transferCommandCandidates,
    transferCommandOpen,
    setTransferCommandOpen,
    openTransferCommand,
    transferCommand,
    canManageParticipants,
    canEditRoomSettings,
    remoteCamerasOn,
    mediaSurfaceActive,
    shareActive,
    shareMinimized,
    presenting,
    pinnedTarget,
    collaborationFullscreen,
    collaborationSplit,
    collaborationSplitWidth,
    setCollaborationSplitWidth,
    toggleCollaborationSplit,
    pinParticipant,
    pinShare,
    unpin,
    setCollaborationFullscreenActive,
    exitCollaborationFullscreen,
    toast,
    showToast,
    clearToast,
    manualIncidentOpen,
    setManualIncidentOpen,
    mediaSettingsOpen,
    setMediaSettingsOpen,
    roomSettingsOpen,
    setRoomSettingsOpen,
    inviteOpen,
    setInviteOpen,
    invitePeople,
    evidence,
    evidenceOpen,
    evidenceKind,
    evidencePhaseId,
    setEvidenceOpen,
    openAddEvidence,
    addEvidence,
    removeEvidence,
    commanderQuestions,
    addCommanderQuestion,
    updateCommanderQuestion,
    removeCommanderQuestion,
    answerCommanderQuestion,
    phaseSkippable,
    setPhaseSkippableFlag,
    skippedPhases,
    skipPhase,
    triageNotes,
    setTriageNotes,
    roomSettings,
    saveRoomSettings,
    roomWorkflow,
    typingVisible,
    roomLifecycle,
    startedAt,
    startedAtLabel,
    elapsedLabel,
    showOperationalTime,
    roomSlaPolicy,
    selectedDecision,
    setSelectedDecision,
    recordDecision,
    completedPhaseIds,
    completePhase,
    scenarioWorkItems,
    scenarioCollabThreads,
    scenarioIncident,
    scenarioAttackers,
    scenarioVictims,
    scenarioLinkedAlerts,
    joinLive,
    leaveLive,
    toggleMedia,
    startShare,
    stopShare,
    setShareLayout,
    simulateRemoteShare,
    setMediaPermission,
    setLivePeople,
    toggleParticipantMic,
    toggleParticipantCamera,
    /** @deprecated use toggleParticipantMic */
    muteParticipant: toggleParticipantMic,
    /** @deprecated use toggleParticipantCamera */
    disableParticipantCamera: toggleParticipantCamera,
    removeParticipant,
    setParticipantRole,
    viewParticipantDetails,
    setLocalMediaFlags,
    retryConnection,
    closeRoom,
    roomAction,
    syncAllSources,
    applyMediaSettings,
  };
}

export type RoomState = ReturnType<typeof useRoomState>;
