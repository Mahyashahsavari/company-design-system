import { describe, expect, it } from 'vitest';
import {
  FALLBACK_ROOM_POLICY,
  formatPapLabel,
  formatTlpLabel,
  resolveRoomSharingPolicy,
  toStoredTlp,
} from './roomPolicy';

describe('Room TLP/PAP policy', () => {
  it('stores AMBER+STRICT as AMBER plus the STRICT modifier', () => {
    expect(toStoredTlp('AMBER', true)).toEqual({ level: 'AMBER', strict: true });
    expect(formatTlpLabel({ level: 'AMBER', strict: true })).toBe('TLP:AMBER+STRICT');
  });

  it('does not treat AMBER+STRICT as a fifth TLP value', () => {
    expect(toStoredTlp('AMBER', false)).toEqual({ level: 'AMBER', strict: false });
    expect(toStoredTlp('RED', true)).toEqual({ level: 'RED', strict: false });
    expect(toStoredTlp('GREEN', true)).toEqual({ level: 'GREEN', strict: false });
    expect(toStoredTlp('CLEAR', true)).toEqual({ level: 'CLEAR', strict: false });
  });

  it('uses scenario, then organisation, then built-in fallback', () => {
    expect(
      resolveRoomSharingPolicy({
        scenario: { pap: 'GREEN' },
        organisation: { pap: 'AMBER', tlp: { level: 'RED', strict: false } },
      }),
    ).toEqual({
      visibility: FALLBACK_ROOM_POLICY.visibility,
      tlp: { level: 'RED', strict: false },
      pap: 'GREEN',
    });

    expect(resolveRoomSharingPolicy({})).toEqual(FALLBACK_ROOM_POLICY);
    expect(formatPapLabel(FALLBACK_ROOM_POLICY.pap)).toBe('PAP:RED');
  });

  it('does not derive TLP or PAP from severity', () => {
    expect(
      resolveRoomSharingPolicy({
        severity: 'Critical',
        organisation: FALLBACK_ROOM_POLICY,
      }),
    ).toEqual(FALLBACK_ROOM_POLICY);
  });
});
