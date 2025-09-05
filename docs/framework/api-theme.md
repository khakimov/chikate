Title: API — Theme

Overview
- Lightweight theming with presets and overridable tokens.

Module
- Path: `src/theme/theme.js`
- Exports: `getTheme()`, `setTheme(presetOrOverrides)`, presets `DARK`, `LIGHT` (legacy available via `setTheme('legacy')`).

API
- `getTheme(): Theme` — returns current token object.
- `setTheme('dark'|'light'|'legacy'|overrides): void` — switch preset or apply overrides.

Common Tokens
- `fg`, `bg` — default foreground/background.
- `border`, `borderAttrs` — border color and attributes (e.g., dim for legacy).
- `title`, `titleAttrs` — popup/box titles.
- `hint`, `placeholder` — secondary text colors.
- Suggestions: `suggest`, `suggestSelFg`, `suggestSelBg`, `useInvertSelection`.
- Status: `statusUseColors`, `statusThinking`, `statusTyping`.
- History: `historyUser`, `historyAssistant`, `historyStatus`.

Notes
- The demo cycles presets with Shift+T (legacy → dark → light).
- Widgets use `getTheme()` on construction; pass `style` overrides per instance as needed.

