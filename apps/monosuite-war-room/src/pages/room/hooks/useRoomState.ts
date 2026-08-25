import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONNECTION_CYCLE,
  CURRENT_USER,
  INITIAL_HISTORY,
  INITIAL_QUESTIONS,
  ROOM_START_MINUTES,
  type ConnectionState,
  type ContextTab,
  type HistoryEntry,
  type Question,
  type ShareLayout,
  type WorkspaceTab,
  formatRoomDuration,
  formatRoomDurationShort,
  getQuestionsForTab,
} from '../data';

export interface MediaState {
  joined: boolean;
  mic: boolean;
  camera: boolean;
  speaker: boolean;
  share: boolean;
  remoteShareBy: string | null;
  shareLayout: ShareLayout;
  connection: ConnectionState;
  speakingId: string;
}

export interface MediaDevices {
  microphone: string;
  speaker: string;
  camera: string;
  connection: string;
}

const INITIAL_MEDIA: MediaState = {
  joined: false,
  mic: true,
  camera: false,
  speaker: true,
  share: false,
  remoteShareBy: null,
  shareLayout: 'split',
  connection: 'idle',
  speakingId: 'sarah',
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

export function useRoomState() {
  const [sidebarTab, setSidebarTab] = useState<ContextTab>('participants');
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('questions');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);
  const [answeringQuestion, setAnsweringQuestion] = useState<number | null>(null);
  const [discussionOpen, setDiscussionOpen] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>(() =>
    structuredClone(INITIAL_QUESTIONS),
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => [...INITIAL_HISTORY]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaState>(INITIAL_MEDIA);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>(INITIAL_DEVICES);
  const [toast, setToast] = useState<string | null>(null);
  const [manualIncidentOpen, setManualIncidentOpen] = useState(false);
  const [mediaSettingsOpen, setMediaSettingsOpen] = useState(false);
  const [typingVisible] = useState(true);
  const [roomStartTime] = useState(() => Date.now() - ROOM_START_MINUTES * 60 * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [selectedDecision, setSelectedDecision] = useState<Record<number, string>>({
    2: 'Disable account',
  });

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

  const elapsedMs = now - roomStartTime;
  const durationLabel = formatRoomDuration(elapsedMs);
  const durationShort = formatRoomDurationShort(elapsedMs);

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

  const presenting = Boolean(
    (media.share || media.remoteShareBy) && media.shareLayout !== 'minimized',
  );

  const toggleAside = useCallback(() => {
    setAsideCollapsed((v) => !v);
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
          const answers = [...(q.answers ?? []), { author: CURRENT_USER.name, text: trimmed }];
          return {
            ...q,
            answers,
            answerCount: q.answerCount + 1,
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

  const toggleDiscussion = useCallback((id: number) => {
    setDiscussionOpen((prev) => (prev === id ? null : id));
    setExpandedQuestion(id);
  }, []);

  const recordDecision = useCallback(
    (id: number) => {
      const choice = selectedDecision[id];
      if (!choice) return;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                decision: { choice, by: CURRENT_USER.name, at: nowTime() },
                status: 'answered' as const,
              }
            : q,
        ),
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
    [selectedDecision, showToast],
  );

  const joinLive = useCallback(() => {
    setMedia((m) => ({
      ...m,
      joined: true,
      connection: 'connected',
    }));
    showToast('Joined live room');
  }, [showToast]);

  const toggleMedia = useCallback(
    (key: 'mic' | 'camera' | 'speaker') => {
      setMedia((m) => {
        if (!m.joined && key !== 'speaker') return m;
        return { ...m, [key]: !m[key] };
      });
    },
    [],
  );

  const startShare = useCallback(() => {
    setMedia((m) => {
      if (!m.joined) return m;
      if (m.share) {
        return { ...m, share: false, shareLayout: 'split' };
      }
      return {
        ...m,
        share: true,
        remoteShareBy: null,
        shareLayout: 'split',
        camera: false,
      };
    });
    showToast('Screen share started');
  }, [showToast]);

  const stopShare = useCallback(() => {
    setMedia((m) => ({
      ...m,
      share: false,
      remoteShareBy: null,
      shareLayout: 'split',
    }));
    showToast('Screen share stopped');
  }, [showToast]);

  const setShareLayout = useCallback((layout: ShareLayout) => {
    setMedia((m) => ({ ...m, shareLayout: layout }));
  }, []);

  /** Demo: Mike shares when user is not already sharing */
  const simulateRemoteShare = useCallback(() => {
    setMedia((m) => ({
      ...m,
      remoteShareBy: m.share ? null : 'Mike Chen',
      shareLayout: 'split',
    }));
  }, []);

  const retryConnection = useCallback(() => {
    setMedia((m) => ({ ...m, connection: 'connected' }));
    showToast('Connection restored');
  }, [showToast]);

  const closeRoom = useCallback(() => {
    showToast('Room closed');
  }, [showToast]);

  const roomAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'invite':
          showToast('Invite participants');
          break;
        case 'add-evidence':
          showToast('Add evidence');
          break;
        case 'export':
          showToast('Exporting room summary…');
          break;
        case 'room-settings':
          showToast('Room settings');
          break;
        case 'close-room':
          closeRoom();
          break;
        case 'view-incident':
          setManualIncidentOpen(true);
          break;
        default:
          showToast(action);
      }
    },
    [closeRoom, showToast],
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
    (next: MediaDevices) => {
      setMediaDevices(next);
      setMediaSettingsOpen(false);
      showToast('Media settings applied');
    },
    [showToast],
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
    presenting,
    toast,
    showToast,
    clearToast,
    manualIncidentOpen,
    setManualIncidentOpen,
    mediaSettingsOpen,
    setMediaSettingsOpen,
    typingVisible,
    durationLabel,
    durationShort,
    selectedDecision,
    setSelectedDecision,
    recordDecision,
    joinLive,
    toggleMedia,
    startShare,
    stopShare,
    setShareLayout,
    simulateRemoteShare,
    retryConnection,
    closeRoom,
    roomAction,
    syncAllSources,
    applyMediaSettings,
  };
}

export type RoomState = ReturnType<typeof useRoomState>;
