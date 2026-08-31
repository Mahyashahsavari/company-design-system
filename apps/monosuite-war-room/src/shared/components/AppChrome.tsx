import { AppShell } from '@mantine/core';
import type { ReactNode } from 'react';
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
}: AppChromeProps) {
  return (
    <AppShell
      className="monosuite-war-room-shell"
      header={{ height: 52 }}
      navbar={{ width: 52, breakpoint: 'sm' }}
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
        <GlobalHeader />
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
        />
      </AppShell.Navbar>

      {children}
      {aside}
      {footer}
    </AppShell>
  );
}
