import { ActionIcon, Stack, Tooltip } from '@mantine/core';
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
}

export function LeftNav({
  asideCollapsed = false,
  onToggleAside,
  showAsideToggle = false,
}: LeftNavProps) {
  return (
    <Stack h="100%" justify="space-between" align="center" py="sm" gap="xs">
      <Stack gap={4} align="center">
        <NavIcon to={routes.room} label="War Room" end>
          <IconDoorEnter size={18} />
        </NavIcon>
        <NavIcon to={routes.createRoom} label="Create Room">
          <IconPlus size={18} />
        </NavIcon>
        <NavIcon to={routes.resources} label="Resources">
          <IconPackage size={18} />
        </NavIcon>
        <NavIcon to={routes.settings} label="Settings">
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
}: {
  to: string;
  label: string;
  end?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label} position="right">
      <NavLink to={to} end={end} aria-label={label} style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <ActionIcon
            variant={isActive ? 'filled' : 'subtle'}
            color={isActive ? 'teal' : 'gray'}
            size="lg"
            component="span"
          >
            {children}
          </ActionIcon>
        )}
      </NavLink>
    </Tooltip>
  );
}
