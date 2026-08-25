# Design System: Mantine + Tabler Icons

This monorepo's design system is **Mantine + `@monosuite/theme`**. Do not invent wrapper components around Mantine.

Products must support **light and dark** colour schemes. Prefer theme tokens and Mantine colour props — never hardcode static colours in apps.

## Do

- Import UI from `@mantine/core` and hooks from `@mantine/hooks`
- Wrap every app root with `MonosuiteProvider` from `@monosuite/ui`
- Import icons from `@tabler/icons-react` (e.g. `IconSearch`, `IconPlus`)
- Import tokens / theme helpers from `@monosuite/theme`
- Import shared formatters from `@monosuite/utils`
- Customize look via `@monosuite/theme` (`createTheme`, component defaults, CSS variables)
- Surfaces / text / borders: `var(--monosuite-color-background|surface|surface-raised|surface-sunken|border|…)` or `var(--mantine-color-body|default-border)` and `c="dimmed"`
- Always-dark product chrome (e.g. War Room header): `var(--monosuite-color-chrome|chrome-raised|chrome-border|chrome-text|chrome-text-muted)` — scheme-independent tokens from the dark semantic map
- Nested inset panels (answer quotes, side rails): prefer `var(--monosuite-color-surface-sunken)` over `var(--mantine-color-default)`
- Status / accent: Monosuite palette names on Mantine props (`color="success"|"warning"|"danger"|"teal"|"neutral"|"brand"|"accent"`) — prefer no fixed shade
- Washes: `variant="light"` or `var(--mantine-color-*-light)` / `*-filled`
- Hex only inside `@monosuite/theme` (`colors.ts`, semantic light/dark maps)

## Do not

- Create `@monosuite/ui` wrappers like `CompanyButton`, `CompanyCard`, etc.
- Re-export Mantine or Tabler through internal packages
- Duplicate design tokens (colors, spacing, radius) inside apps
- Hardcode hex / rem values that belong in `@monosuite/theme`
- Use `#hex` / `rgb()` / `rgba()` in apps
- Use `var(--mantine-color-gray-0|1)` (or fixed gray shades) for page/panel backgrounds — they stay light in dark mode
- Use `c="gray.N"` / `color="#…"` on icons when `c="dimmed"` or a semantic colour is enough
- Use `color="green"|"gray"|"violet"` when a Monosuite equivalent exists (`success` / `neutral` / `accent`)
- Add Storybook unless explicitly requested

## Examples

```tsx
// ✅ GOOD
import { Button, Card, TextInput } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { MonosuiteProvider } from '@monosuite/ui';
import '@monosuite/theme/styles.css';

<MonosuiteProvider>
  <Button leftSection={<IconPlus size={16} />}>Add</Button>
  <Box style={{ background: 'var(--monosuite-color-background)' }} />
  <Text c="dimmed">Secondary</Text>
  <Badge color="success">Live</Badge>
</MonosuiteProvider>

// ❌ BAD
import { Button } from '@monosuite/ui';

// ❌ BAD — static / scheme-blind colours
style={{ background: '#1a1d21' }}
style={{ background: 'var(--mantine-color-gray-1)' }}
c="gray.4"
color="green"
```

`@monosuite/ui` exists only for `MonosuiteProvider` (theme + CSS variable wiring).

---

*Mirror of [`.cursor/rules/mantine-direct-usage.mdc`](../.cursor/rules/mantine-direct-usage.mdc).*
