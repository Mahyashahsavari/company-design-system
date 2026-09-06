import { Text } from '@mantine/core';
import { formatPapLabel, formatTlpLabel, tlpColorVar, type PapLevel, type RoomTlpPolicy, type TlpLevel } from '../roomPolicy';

interface ProtocolMarkProps {
  protocol: 'TLP' | 'PAP';
  level: TlpLevel | PapLevel;
  strict?: boolean;
  size?: 'xs' | 'sm';
}

/** FIRST TLP 2.0 coloured label — text stays visible; colour is never the only signal. */
export function ProtocolMark({ protocol, level, strict = false, size = 'xs' }: ProtocolMarkProps) {
  const label =
    protocol === 'TLP'
      ? formatTlpLabel({ level: level as TlpLevel, strict })
      : formatPapLabel(level as PapLevel);

  return (
    <Text
      component="span"
      fw={800}
      size={size}
      ff="monospace"
      style={{
        display: 'inline-block',
        background: 'var(--monosuite-color-tlp-bg)',
        color: tlpColorVar(level),
        padding: '2px 8px',
        borderRadius: 'var(--mantine-radius-xs)',
        lineHeight: 1.45,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Text>
  );
}

export function TlpMark({ policy, size }: { policy: RoomTlpPolicy; size?: 'xs' | 'sm' }) {
  if (!policy?.level) return null;
  return <ProtocolMark protocol="TLP" level={policy.level} strict={Boolean(policy.strict)} size={size} />;
}

export function PapMark({ level, size }: { level: PapLevel; size?: 'xs' | 'sm' }) {
  return <ProtocolMark protocol="PAP" level={level} size={size} />;
}
