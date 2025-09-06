Title: Using the Framework — Quickstart

Who is this for
- Engineers who want to build small TUIs without fighting the terminal. This is a step‑by‑step guide.

Run the demos
- `npm run demo:app` — the full demo (history + input + popup + statuses)
- `npm run demo:fluent` — Englishy API layer
- `npm run demo:progress` — progress bar
- `npm run demo:keys-timer` — key parser + timer

The basics
- App shell
- Use `withApp(({ screen, sched, stdin, keys, timers }) => { ... }, { enableMouse: true })`.
- It sets alt‑screen, raw mode, cleanup, resize handling, and attaches a KeyParser.
- Mouse wheel is enabled by default; disable with `{ enableMouse: false }` for keyboard‑only apps.
- It does not loop by default. Request frames when state changes.
- Drawing
  - Call `screen.beginFrame()` in `sched.on('paint', ...)`.
  - Draw widgets. End with `screen.endFrame({ cursor, showCursor })`.
  - Only call `sched.requestFrame()` when state changes.
- Layout
  - Use `Page.full(screen).margin(2).column(1).add(...)` to split space.
  - `Row` and `Column` accept children with `flex` or `minWidth/minHeight`.
- Input
  - Use `KeyParser` for normalized keys, bracketed paste, and optional mouse wheel.
  - Use `FocusManager` to route keys. Tab switches focus; overlays intercept first.
  - Ownership: printable keys go to the focused widget (usually the input). Global shortcuts should be non‑printable (F‑keys, Ctrl combos) and `/commands` handled in `onSubmit`.
  - Exit: prefer Ctrl+C. The examples use a double‑press window (1s). If a history selection exists, Ctrl+C copies selection (OSC 52) and clears it; the next Ctrl+C can exit. Avoid binding a plain `q` to quit.
- Popups
  - Use `OverlayStack`. Topmost overlay blocks input below.
  - `Popup('Help').body(text).open(overlays)`. Default is non‑destructive: background stays visible; set `backdrop: true` to dim.
- Themes
  - `setTheme('legacy'|'dark'|'light')`, or `cycleTheme()`.
  - Use theme tokens for colors; prefer bold/dim/invert for the legacy look.
  - Animated status colors require a color theme (Dark/Light); Legacy renders a dim single‑color line.

Avoid flicker
- Don’t render in a tight loop. Only request frames when something changed.
- The screen renderer already skips redundant writes and cursor toggles.
- While animating, use a small timer (80–120ms). Stop it when idle.

Common patterns
  - Use `HistoryView` to draw scrollable logs: timestamps, role colors, PgUp/PgDn, mouse wheel.
  - Selection: enable `selectionEnabled` (default). Mouse down/drag/up selects only inside history. Show a tiny hint near the input when a selection exists (e.g., “Ctrl+C to copy selection”).
  - For a modern feed, set `border: 'none'`, `anchorBottom: true`, and `itemGap: 1`.
  - Status banners (Thinking/Typing) are transient UI; avoid logging them to history.
- Input field
  - `InputField` supports editing, wrap, and a suggestion dropdown above the input.
  - Suggestions can auto-submit: set `suggestionSubmitOnPick: 'auto' | true` to submit commands like `/help` immediately when picked.
  - Handle commands in `onSubmit` (e.g., `/help`, `/clear`) instead of binding printable keys globally.
- Progress
  - `ProgressBar` draws a solid fill bar. For logs, use `renderProgressLine(...)`.

Tips
- Keep your widgets pure: paint from state; don’t mutate inside paint.
- Keep your state small and obvious. Derive the rest during paint.
- Favor simple names and short functions. If a block is hard to read, split it.

What to try next
- Add a `HistoryView` to your app and wire scroll keys.
- Add a help popup with `OverlayStack`.
- Add a status indicator that starts/stops with a timer and requests frames while active.
