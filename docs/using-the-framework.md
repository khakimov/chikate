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
- Use `withApp(({ screen, sched, stdin, keys, timers }) => { ... })`.
- It sets alt‑screen, raw mode, cleanup, resize handling, and attaches a KeyParser.
- It does not loop by default. Request frames when state changes.
- Drawing
  - Call `screen.beginFrame()` in `sched.on('paint', ...)`.
  - Draw widgets. End with `screen.endFrame({ cursor, showCursor })`.
  - Only call `sched.requestFrame()` when state changes.
- Layout
  - Use `Page.full(screen).margin(2).column(1).add(...)` to split space.
  - `Row` and `Column` accept children with `flex` or `minWidth/minHeight`.
- Input
  - Use `KeyParser` for normalized keys and bracketed paste.
  - Use `FocusManager` to route keys. Tab switches focus; overlays intercept first.
- Popups
  - Use `OverlayStack`. Topmost overlay blocks input below.
  - `Popup('Help').borderless().body(text).open(overlays)`.
- Themes
  - `setTheme('legacy'|'dark'|'light')`, or `cycleTheme()`.
  - Use theme tokens for colors; prefer bold/dim/invert for the legacy look.

Avoid flicker
- Don’t render in a tight loop. Only request frames when something changed.
- The screen renderer already skips redundant writes and cursor toggles.
- While animating, use a small timer (80–120ms). Stop it when idle.

Common patterns
- History
  - Use `HistoryView` to draw scrollable logs: timestamps, role colors, PgUp/PgDn.
- Input field
  - `InputField` supports editing, wrap, and a suggestion dropdown above the input.
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
