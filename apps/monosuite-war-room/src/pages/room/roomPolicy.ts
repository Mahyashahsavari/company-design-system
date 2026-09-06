/** TLP 2.0 standard labels — AMBER+STRICT is AMBER plus a modifier, not a fifth value. */
export type TlpLevel = 'RED' | 'AMBER' | 'GREEN' | 'CLEAR';

export type PapLevel = 'RED' | 'AMBER' | 'GREEN' | 'CLEAR';

export type RoomVisibility = 'organization' | 'restricted';

export interface RoomTlpPolicy {
  level: TlpLevel;
  /** Only meaningful when `level` is AMBER. Maps to TLP:AMBER+STRICT. */
  strict: boolean;
}

export interface RoomSharingPolicy {
  visibility: RoomVisibility;
  tlp: RoomTlpPolicy;
  pap: PapLevel;
}

export const TLP_LEVELS: TlpLevel[] = ['RED', 'AMBER', 'GREEN', 'CLEAR'];
export const PAP_LEVELS: PapLevel[] = ['RED', 'AMBER', 'GREEN', 'CLEAR'];

export const FALLBACK_ROOM_POLICY: RoomSharingPolicy = {
  visibility: 'organization',
  tlp: { level: 'AMBER', strict: true },
  pap: 'RED',
};

export const ORGANISATION_DEFAULT_ROOM_POLICY: RoomSharingPolicy = {
  visibility: 'organization',
  tlp: { level: 'AMBER', strict: true },
  pap: 'RED',
};

export const ROOM_VISIBILITY_OPTIONS: {
  value: RoomVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: 'organization',
    label: 'Organization',
    description:
      'Everyone in the organization can see that this Room exists. They cannot see its content.',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    description: 'Only Room members can see that this Room exists.',
  },
];

export const TLP_OPTIONS: { value: TlpLevel; label: string; description: string }[] = [
  {
    value: 'RED',
    label: 'TLP:RED',
    description: 'Individual recipients only. No further disclosure.',
  },
  {
    value: 'AMBER',
    label: 'TLP:AMBER',
    description:
      'Need-to-know sharing within this organisation and with external customer organisations receiving cybersecurity services.',
  },
  {
    value: 'GREEN',
    label: 'TLP:GREEN',
    description: 'Sharing within the defined community; no public disclosure.',
  },
  {
    value: 'CLEAR',
    label: 'TLP:CLEAR',
    description: 'No disclosure restriction.',
  },
];

export const PAP_OPTIONS: { value: PapLevel; label: string; description: string }[] = [
  {
    value: 'RED',
    label: 'PAP:RED',
    description: 'Non-detectable actions only. Passive analysis of internal logs is allowed.',
  },
  {
    value: 'AMBER',
    label: 'PAP:AMBER',
    description: 'Passive online checks and monitoring are allowed.',
  },
  {
    value: 'GREEN',
    label: 'PAP:GREEN',
    description: 'Active actions such as pinging or blocking are allowed.',
  },
  {
    value: 'CLEAR',
    label: 'PAP:CLEAR',
    description: 'No restriction on actions.',
  },
];

export const TLP_FIELD_DESCRIPTION = 'Traffic Light Protocol';
export const TLP_FIELD_HELP =
  'Default sharing restriction for new information created in this Room. Individual records may be made more restrictive.';

export const PAP_FIELD_DESCRIPTION = 'Permissible Actions Protocol';
export const PAP_FIELD_HELP =
  'Maximum externally detectable action level permitted in this Room. Actions exceeding this level require explicit authorization.';

export const TLP_STRICT_CHECKBOX_LABEL = 'Limit sharing to this organisation';
export const TLP_STRICT_CHECKBOX_DESCRIPTION =
  'Share only with people in this organisation who need to know. Do not share with external customer organisations or other external recipients.';

export function isTlpLevel(value: string | null): value is TlpLevel {
  return TLP_LEVELS.includes(value as TlpLevel);
}

export function isPapLevel(value: string | null): value is PapLevel {
  return PAP_LEVELS.includes(value as PapLevel);
}

export function isRoomVisibility(value: string | null): value is RoomVisibility {
  return value === 'organization' || value === 'restricted';
}

/** Persist AMBER+STRICT as AMBER plus the STRICT modifier, never as a fifth TLP value. */
export function toStoredTlp(level: TlpLevel, strict: boolean): RoomTlpPolicy {
  return {
    level,
    strict: level === 'AMBER' ? strict : false,
  };
}

export function formatTlpLabel(policy: RoomTlpPolicy): string {
  if (policy.level === 'AMBER' && policy.strict) return 'TLP:AMBER+STRICT';
  return `TLP:${policy.level}`;
}

export function formatPapLabel(level: PapLevel): string {
  return `PAP:${level}`;
}

export function tlpColorVar(level: TlpLevel | PapLevel): string {
  const tone = level?.toLowerCase() ?? 'amber';
  return `var(--monosuite-color-tlp-${tone})`;
}

/**
 * Default precedence for TLP and PAP (applied independently).
 * Room Severity is ignored and must not influence either value.
 */
export function resolveRoomSharingPolicy(input: {
  scenario?: Partial<RoomSharingPolicy> | null;
  organisation?: Partial<RoomSharingPolicy> | null;
  severity?: string | null;
}): RoomSharingPolicy {
  void input.severity;
  return {
    visibility:
      input.scenario?.visibility ??
      input.organisation?.visibility ??
      FALLBACK_ROOM_POLICY.visibility,
    tlp: input.scenario?.tlp ?? input.organisation?.tlp ?? FALLBACK_ROOM_POLICY.tlp,
    pap: input.scenario?.pap ?? input.organisation?.pap ?? FALLBACK_ROOM_POLICY.pap,
  };
}

export function visibilityOption(value: RoomVisibility) {
  return ROOM_VISIBILITY_OPTIONS.find((option) => option.value === value) ?? ROOM_VISIBILITY_OPTIONS[0];
}

export function tlpOption(level: TlpLevel) {
  return TLP_OPTIONS.find((option) => option.value === level) ?? TLP_OPTIONS[0];
}

export function papOption(level: PapLevel) {
  return PAP_OPTIONS.find((option) => option.value === level) ?? PAP_OPTIONS[0];
}
