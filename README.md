# Monosuite Design System

Centralized visual language and tooling for Monosuite React products.

Mantine is the UI library. Tabler Icons is the icon library. This repository owns the **theme**, **provider**, and **utils** so every product looks consistent.

## Architecture

```
@monosuite/theme   → tokens + monosuiteTheme + CSS variables + styles.css
@monosuite/ui      → MonosuiteProvider only
@monosuite/utils   → shared formatters

@mantine/core      → UI (used directly in apps)
@tabler/icons-react → icons (used directly in apps)

apps/monosuite-assets-management  → reference consumer (5173)
apps/monosuite-war-room           → reference consumer (5174)
```

**Rules (docs):** see [`docs/`](./docs/) — human-readable copies of the project conventions.

**Rules (Cursor):** see [`.cursor/rules/`](.cursor/rules/) — same conventions for the agent.

## Install

Node 22+ (Node 24 LTS recommended).

```bash
npm install
```

## Run apps

```bash
npm run dev:assets      # http://localhost:5173
npm run dev:war-room    # http://localhost:5174
npm run dev             # both via Turborepo
```

## Build / quality

```bash
npm run build
npm run lint
npm run test
npm run typecheck
npm run format:check
```

## Usage in an app

```tsx
import '@monosuite/theme/styles.css';
import { Button, Card } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { MonosuiteProvider } from '@monosuite/ui';
import { formatBytes } from '@monosuite/utils';

createRoot(el).render(
  <MonosuiteProvider>
    <Card withBorder>
      <Button leftSection={<IconSearch size={16} />}>Search</Button>
      <span>{formatBytes(2048)}</span>
    </Card>
  </MonosuiteProvider>,
);
```

## Package responsibilities

| Package | Responsibility |
| --- | --- |
| `@monosuite/theme` | Design tokens, `monosuiteTheme`, `createMonosuiteTheme()`, semantic CSS variables |
| `@monosuite/ui` | `MonosuiteProvider` — applies theme to Mantine |
| `@monosuite/utils` | Framework-agnostic formatters |

## Principles

1. Mantine components are used **directly** — no `@monosuite/ui` wrappers.
2. Tabler icons are used **directly** from `@tabler/icons-react`.
3. Visual language lives in `@monosuite/theme` only.
4. npm workspaces + Turborepo (not pnpm/yarn/Nx).
5. No Storybook in this repository.
