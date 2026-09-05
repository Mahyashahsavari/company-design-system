import { Box } from '@mantine/core';
import { IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import { ROOM_SEVERITY_COLOR, type RoomSeverity } from './data';

export function severityColor(severity: RoomSeverity) {
  return ROOM_SEVERITY_COLOR[severity];
}

export function severityFill(severity: RoomSeverity) {
  return `var(--mantine-color-${ROOM_SEVERITY_COLOR[severity]}-filled)`;
}

/** Subtle wash + left severity rail — colour is support, not the only signal. */
export function severityCardStyle(severity: RoomSeverity): CSSProperties {
  const token = ROOM_SEVERITY_COLOR[severity];
  return {
    background: `linear-gradient(
      145deg,
      color-mix(in srgb, var(--mantine-color-${token}-filled) 14%, var(--monosuite-color-surface)),
      var(--monosuite-color-surface)
    )`,
    border: `1px solid color-mix(in srgb, var(--mantine-color-${token}-filled) 32%, var(--monosuite-color-border))`,
    boxShadow: `inset 3px 0 0 var(--mantine-color-${token}-filled), var(--mantine-shadow-xs)`,
  };
}

export function SeverityIcon({
  severity,
  size = 13,
}: {
  severity: RoomSeverity;
  size?: number;
}) {
  const color = severityFill(severity);
  if (severity === 'Critical' || severity === 'High') {
    return <IconAlertTriangle size={size} color={color} aria-hidden style={{ display: 'block' }} />;
  }
  if (severity === 'Medium') {
    return <IconAlertTriangle size={size} color={color} aria-hidden style={{ display: 'block' }} />;
  }
  return <IconShieldCheck size={size} color={color} aria-hidden style={{ display: 'block' }} />;
}

export function SeverityMark({
  severity,
  children,
}: {
  severity: RoomSeverity;
  children?: ReactNode;
}) {
  const token = ROOM_SEVERITY_COLOR[severity];
  return (
    <Box
      aria-hidden
      style={{
        width: 24,
        height: 24,
        borderRadius: 'var(--mantine-radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `color-mix(in srgb, var(--mantine-color-${token}-filled) 18%, transparent)`,
        flexShrink: 0,
      }}
    >
      {children ?? <SeverityIcon severity={severity} />}
    </Box>
  );
}

export function SeverityPip({ severity }: { severity: RoomSeverity }) {
  return (
    <Box
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        flexShrink: 0,
        background: severityFill(severity),
      }}
    />
  );
}
