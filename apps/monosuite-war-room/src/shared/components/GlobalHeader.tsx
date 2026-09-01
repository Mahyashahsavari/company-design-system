import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  TextInput,
  Text,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconBell,
  IconMoon,
  IconSearch,
  IconSparkles,
  IconSun,
} from '@tabler/icons-react';
import { CURRENT_USER } from '../../shared/constants';
import { routes } from '../routes';
import warRoomLogoDark from '../../assets/war-room-logo-dark.png';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

interface GlobalHeaderProps {
  navBurger?: ReactNode;
}

export function GlobalHeader({ navBurger }: GlobalHeaderProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <Group
      h="100%"
      px="md"
      justify="space-between"
      wrap="nowrap"
      style={{
        background: 'var(--monosuite-color-chrome)',
        color: 'var(--monosuite-color-chrome-text)',
      }}
    >
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        {navBurger}
        <Box
          component={NavLink}
          to={routes.rooms}
          aria-label="Back to rooms list"
          style={{ display: 'flex', flexShrink: 0, lineHeight: 0 }}
        >
          <Box
            component="img"
            src={warRoomLogoDark}
            alt=""
            w={36}
            h={36}
            style={{
              display: 'block',
              objectFit: 'contain',
              mixBlendMode: 'screen',
            }}
          />
        </Box>
        <Text
          fw={700}
          size="sm"
          c="var(--monosuite-color-chrome-text)"
          visibleFrom="lg"
          style={{ whiteSpace: 'nowrap' }}
        >
          MonoSuite War Room
        </Text>
      </Group>

      <TextInput
        placeholder="Global Search..."
        leftSection={<IconSearch size={16} />}
        aria-label="Global Search"
        size="xs"
        radius="sm"
        visibleFrom="md"
        style={{ flex: 1, maxWidth: 420, minWidth: 0 }}
        styles={{
          input: {
            background: 'var(--monosuite-color-chrome-raised)',
            borderColor: 'var(--monosuite-color-chrome-border)',
            color: 'var(--monosuite-color-chrome-text)',
          },
        }}
      />

      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          c="var(--monosuite-color-chrome-text-muted)"
          size="lg"
          aria-label="Notifications"
        >
          <IconBell size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          c="var(--monosuite-color-chrome-text-muted)"
          size="lg"
          aria-label="Toggle theme"
          onClick={() => setColorScheme(dark ? 'light' : 'dark')}
        >
          {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
        <Button
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconSparkles size={14} />}
          aria-label="MonoAI"
          visibleFrom="sm"
        >
          <Text span visibleFrom="lg" inherit>
            MonoAI
          </Text>
        </Button>
        <Group gap={8} wrap="nowrap">
          <Avatar size={28} radius="xl" color="accent">
            {CURRENT_USER.initials}
          </Avatar>
          <Text
            c="var(--monosuite-color-chrome-text-muted)"
            size="sm"
            visibleFrom="md"
            style={{ whiteSpace: 'nowrap' }}
          >
            {CURRENT_USER.name}
          </Text>
        </Group>
      </Group>
    </Group>
  );
}
