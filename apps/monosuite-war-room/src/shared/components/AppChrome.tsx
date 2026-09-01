import { AppShell, Burger } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { ROOM_MOBILE_QUERY } from '../constants';
import { GlobalHeader } from './GlobalHeader';
import { LeftNav } from './LeftNav';

interface AppChromeProps {
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  asideCollapsed?: boolean;
  onToggleAside?: () => void;
  showAsideToggle?: boolean;
  footerHeight?: number;
  asideWidth?: number;
  /** Hide product chrome so collaboration can use the full viewport (mobile fullscreen). */
  hideHeader?: boolean;
}

export function AppChrome({
  children,
  aside,
  footer,
  asideCollapsed = false,
  onToggleAside,
  showAsideToggle = false,
  footerHeight,
  asideWidth = 340,
  hideHeader = false,
}: AppChromeProps) {
  const isMobile = useMediaQuery(ROOM_MOBILE_QUERY, false, { getInitialValueInEffect: false });
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);

  return (
    <AppShell
      className="monosuite-war-room-shell"
      disabled={hideHeader}
      header={{
        height: 52,
        collapsed: hideHeader,
      }}
      navbar={{
        width: isMobile ? 220 : 52,
        breakpoint: 'sm',
        collapsed: { mobile: !navOpened, desktop: false },
      }}
      aside={
        aside
          ? {
              width: asideWidth,
              breakpoint: 'md',
              collapsed: { desktop: asideCollapsed, mobile: true },
            }
          : undefined
      }
      footer={footer ? { height: footerHeight ?? 56 } : undefined}
      padding={0}
    >
      <AppShell.Header
        style={{
          background: 'var(--monosuite-color-chrome)',
          borderBottom: '1px solid var(--monosuite-color-chrome-border)',
        }}
      >
        <GlobalHeader
          navBurger={
            <Burger
              opened={navOpened}
              onClick={toggleNav}
              hiddenFrom="sm"
              size="sm"
              color="var(--monosuite-color-chrome-text)"
              aria-label={navOpened ? 'Close navigation' : 'Open navigation'}
            />
          }
        />
      </AppShell.Header>

      <AppShell.Navbar
        className="monosuite-war-room-navbar"
        style={{
          borderRight: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-body)',
        }}
      >
        <LeftNav
          showAsideToggle={showAsideToggle}
          asideCollapsed={asideCollapsed}
          onToggleAside={onToggleAside}
          showLabels={Boolean(isMobile)}
          onNavigate={closeNav}
        />
      </AppShell.Navbar>

      {children}
      {aside}
      {footer}
    </AppShell>
  );
}
