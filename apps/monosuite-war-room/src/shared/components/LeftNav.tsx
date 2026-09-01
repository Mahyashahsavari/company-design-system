import { ActionIcon, Group, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconDoorEnter,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconPackage,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { routes } from '../routes';

interface LeftNavProps {
  asideCollapsed?: boolean;
  onToggleAside?: () => void;
  showAsideToggle?: boolean;
  showLabels?: boolean;
  onNavigate?: () => void;
}

export function LeftNav({
  asideCollapsed = false,
  onToggleAside,
  showAsideToggle = false,
  showLabels = false,
  onNavigate,
}: LeftNavProps) {
  return (
    <Stack
      h="100%"
      justify="space-between"
      align={showLabels ? 'stretch' : 'center'}
      py="sm"
      px={showLabels ? 'sm' : 0}
      gap="xs"
    >
      <Stack gap={4} align={showLabels ? 'stretch' : 'center'}>
        <NavIcon to={routes.rooms} label="Rooms" end showLabel={showLabels} onNavigate={onNavigate}>
          <IconDoorEnter size={18} />
        </NavIcon>
        <NavIcon to={routes.createRoom} label="Create Room" showLabel={showLabels} onNavigate={onNavigate}>
          <IconPlus size={18} />
        </NavIcon>
        <NavIcon to={routes.resources} label="Resources" showLabel={showLabels} onNavigate={onNavigate}>
          <IconPackage size={18} />
        </NavIcon>
        <NavIcon to={routes.settings} label="Settings" showLabel={showLabels} onNavigate={onNavigate}>
          <IconSettings size={18} />
        </NavIcon>
      </Stack>
      {showAsideToggle && onToggleAside && (
        <Tooltip label={asideCollapsed ? 'Expand utility panel' : 'Collapse utility panel'} position="right">
          <ActionIcon
            variant="subtle"
            color="neutral"
            size="lg"
            aria-label={asideCollapsed ? 'Expand utility panel' : 'Collapse utility panel'}
            onClick={onToggleAside}
          >
            {asideCollapsed ? (
              <IconLayoutSidebarRightExpand size={18} />
            ) : (
              <IconLayoutSidebarRightCollapse size={18} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </Stack>
  );
}

function NavIcon({
  to,
  label,
  end,
  children,
  showLabel = false,
  onNavigate,
}: {
  to: string;
  label: string;
  end?: boolean;
  children: ReactNode;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Tooltip label={label} position="right" disabled={showLabel}>
      <NavLink
        to={to}
        end={end}
        aria-label={label}
        onClick={onNavigate}
        style={{ textDecoration: 'none' }}
      >
        {({ isActive }) =>
          showLabel ? (
            <Group
              gap="sm"
              wrap="nowrap"
              px="xs"
              py={6}
              style={{
                borderRadius: 'var(--mantine-radius-sm)',
                background: isActive
                  ? 'color-mix(in srgb, var(--mantine-color-teal-filled) 16%, transparent)'
                  : undefined,
              }}
            >
              <ActionIcon
                variant={isActive ? 'filled' : 'subtle'}
                color={isActive ? 'teal' : 'gray'}
                size="lg"
                component="span"
              >
                {children}
              </ActionIcon>
              <Text size="sm" fw={isActive ? 700 : 500} c={isActive ? 'teal' : undefined}>
                {label}
              </Text>
            </Group>
          ) : (
            <ActionIcon
              variant={isActive ? 'filled' : 'subtle'}
              color={isActive ? 'teal' : 'gray'}
              size="lg"
              component="span"
            >
              {children}
            </ActionIcon>
          )
        }
      </NavLink>
    </Tooltip>
  );
}
