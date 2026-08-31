import { Avatar, Badge, Box, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconMicrophone, IconVideo, IconVideoOff } from '@tabler/icons-react';
import { type LivePerson } from '../data';

/** Fixed Video Room roster — secondary presence, not a meeting grid. */
export const VIDEO_ROOM_IDS = ['sarah', 'mike', 'alex', 'you'] as const;

interface VideoPresenceStripProps {
  people: LivePerson[];
  /** Local camera from MediaState — independent of remote cameras. */
  localCamera: boolean;
  speakingId: string;
  /**
   * `pip` — compact strip under shared screen (secondary to share).
   * `workspace` — strip under investigation when no share is active.
   * `collaboration` — tiles inside the live/media float panel.
   */
  placement?: 'pip' | 'workspace' | 'collaboration';
  /** Omit outer chrome — parent float panel supplies the shell. */
  bare?: boolean;
}

/**
 * Compact live-video / presence strip.
 * Never larger than shared screen; never covers incident context.
 */
export function VideoPresenceStrip({
  people,
  localCamera,
  speakingId,
  placement = 'workspace',
  bare = false,
}: VideoPresenceStripProps) {
  const pip = placement === 'pip';
  const collaboration = placement === 'collaboration';
  const roster = VIDEO_ROOM_IDS.map((id) => {
    const person = people.find((p) => p.id === id);
    if (!person) return null;
    if (person.isLocal) {
      return { ...person, camera: localCamera };
    }
    return person;
  }).filter(Boolean) as LivePerson[];

  const tileW = collaboration ? 88 : pip ? 104 : 132;
  const tileH = collaboration ? 52 : pip ? 64 : 84;

  const tiles = (
    <Group
      gap={collaboration ? 6 : pip ? 6 : 8}
      wrap="nowrap"
      className={collaboration ? 'monosuite-thin-scroll-x' : undefined}
      style={{ overflowX: 'auto' }}
    >
      {roster.map((person) => (
        <PresenceTile
          key={person.id}
          person={person}
          speaking={person.id === speakingId}
          width={tileW}
          height={tileH}
          pip={pip || collaboration}
        />
      ))}
    </Group>
  );

  if (bare) {
    return (
      <Box data-testid="video-presence-strip" data-placement={placement}>
        {tiles}
      </Box>
    );
  }

  return (
    <Box
      data-testid="video-presence-strip"
      data-placement={placement}
      px="md"
      py={collaboration ? 6 : pip ? 6 : 8}
      style={{
        flexShrink: 0,
        borderTop: pip || collaboration
          ? '1px solid var(--monosuite-color-chrome-border)'
          : '1px solid var(--mantine-color-default-border)',
        background: pip || collaboration
          ? 'var(--monosuite-color-chrome)'
          : 'var(--monosuite-color-surface-sunken)',
      }}
    >
      {!collaboration && (
        <Group justify="space-between" mb={pip ? 4 : 6} wrap="nowrap">
          <Group gap={6}>
            <Text
              size="xs"
              fw={700}
              c={pip ? 'var(--monosuite-color-chrome-text-muted)' : 'dimmed'}
              tt="uppercase"
            >
              {pip ? 'Participants' : 'Live video'}
            </Text>
            <Badge size="xs" color="success" variant="dot">
              {pip ? 'Secondary' : 'Presence'}
            </Badge>
          </Group>
          <Text
            size="xs"
            c={pip ? 'var(--monosuite-color-chrome-text-muted)' : 'dimmed'}
          >
            {pip ? 'Below shared screen' : 'Secondary to investigation'}
          </Text>
        </Group>
      )}

      {tiles}
    </Box>
  );
}

function PresenceTile({
  person,
  speaking,
  width,
  height,
  pip,
}: {
  person: LivePerson;
  speaking: boolean;
  width: number;
  height: number;
  pip: boolean;
}) {
  const cameraOn = person.camera;
  const isLocal = Boolean(person.isLocal);
  const label = isLocal ? 'You' : person.name.split(' ')[0];

  return (
    <Box
      data-testid={`video-tile-${person.id}`}
      data-camera={cameraOn ? 'on' : 'off'}
      data-speaking={speaking ? 'true' : 'false'}
      style={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 'var(--mantine-radius-sm)',
        background: cameraOn
          ? 'var(--monosuite-color-chrome-raised)'
          : pip
            ? 'var(--monosuite-color-chrome-raised)'
            : 'var(--monosuite-color-surface)',
        border: speaking
          ? '2px solid var(--mantine-color-teal-filled)'
          : pip
            ? '1px solid var(--monosuite-color-chrome-border)'
            : '1px solid var(--mantine-color-default-border)',
        boxShadow: speaking
          ? '0 0 0 2px color-mix(in srgb, var(--mantine-color-teal-filled) 22%, transparent)'
          : undefined,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cameraOn ? (
        <Stack gap={2} align="center">
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--monosuite-color-chrome-raised)',
              backgroundImage:
                'linear-gradient(145deg, color-mix(in srgb, var(--mantine-color-teal-filled) 16%, transparent), transparent 55%)',
            }}
          />
          <ThemeIcon
            size={pip ? 26 : 34}
            radius="xl"
            color={person.color}
            variant="light"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <IconVideo size={pip ? 14 : 16} />
          </ThemeIcon>
        </Stack>
      ) : (
        <Stack gap={2} align="center" px={4}>
          <Avatar size={pip ? 24 : 32} radius="xl" color={person.color}>
            {person.initials}
          </Avatar>
          {!pip && (
            <Group gap={4}>
              <IconVideoOff size={12} />
              <Text size="xs" c="dimmed" fw={600}>
                Camera off
              </Text>
            </Group>
          )}
        </Stack>
      )}

      <Group
        gap={4}
        px={6}
        py={2}
        justify="space-between"
        wrap="nowrap"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          background: 'color-mix(in srgb, var(--monosuite-color-chrome) 82%, transparent)',
        }}
      >
        <Text
          size="xs"
          fw={700}
          lineClamp={1}
          c="var(--monosuite-color-chrome-text)"
          style={{ minWidth: 0 }}
        >
          {label}
        </Text>
        {speaking && (
          <IconMicrophone size={11} color="var(--mantine-color-teal-filled)" />
        )}
        {!speaking && !cameraOn && pip && (
          <IconVideoOff size={11} color="var(--monosuite-color-chrome-text-muted)" />
        )}
      </Group>
    </Box>
  );
}
