# Monorepo Architecture

## Packages

| Package | Owns |
| --- | --- |
| `@monosuite/theme` | Tokens, `monosuiteTheme`, `createMonosuiteTheme`, CSS variables, `@monosuite/theme/styles.css` |
| `@monosuite/ui` | `MonosuiteProvider` only |
| `@monosuite/utils` | Shared formatters (no React / no UI) |

## Apps

- `apps/monosuite-assets-management` — asset inventory reference app
- `apps/monosuite-war-room` — operations dashboard reference app

## External libraries (used directly in apps)

- `@mantine/core`, `@mantine/hooks` — UI components and hooks
- `@tabler/icons-react` — icons (`Icon*` naming)

## Rules

1. Shared visual language lives in `@monosuite/theme`, never copied into apps.
2. Product UI is built with Mantine components under `MonosuiteProvider`.
3. Icons come from `@tabler/icons-react`; import only the icons you need (tree-shakeable).
4. npm workspaces + Turborepo only (no Nx, yarn, pnpm).
5. No Storybook in this repo.
6. Apps must support light and dark schemes via semantic CSS variables and Mantine colour props — no static hex/rgba in product UI.

---

*Mirror of [`.cursor/rules/architecture.mdc`](../.cursor/rules/architecture.mdc).*
