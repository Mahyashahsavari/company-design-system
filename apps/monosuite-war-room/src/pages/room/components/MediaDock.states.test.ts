import { describe, expect, it } from 'vitest';
import {
  resolveLocalCameraState,
  resolveLocalMicState,
  resolveLocalShareState,
  resolveLocalSpeakerState,
  type MediaState,
} from '../hooks/useRoomState';

const base: MediaState = {
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

describe('Media Control Dock local states', () => {
  it('resolves microphone ON and MUTED', () => {
    expect(resolveLocalMicState({ ...base, mic: true })).toBe('on');
    expect(resolveLocalMicState({ ...base, mic: false })).toBe('off');
  });

  it('resolves camera ON and OFF', () => {
    expect(resolveLocalCameraState({ ...base, camera: true })).toBe('on');
    expect(resolveLocalCameraState({ ...base, camera: false })).toBe('off');
  });

  it('resolves speaker ON and OFF', () => {
    expect(resolveLocalSpeakerState({ ...base, speaker: true })).toBe('on');
    expect(resolveLocalSpeakerState({ ...base, speaker: false })).toBe('off');
  });

  it('resolves screen share OFF and ON', () => {
    expect(resolveLocalShareState({ ...base, share: false })).toBe('available');
    expect(resolveLocalShareState({ ...base, share: true })).toBe('sharing');
  });
});
