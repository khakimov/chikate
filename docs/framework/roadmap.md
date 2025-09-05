Title: TUI Framework Roadmap

Purpose
- Define an incremental plan to evolve the demo code into a small, reusable TUI framework with a stable core (buffer, scheduler, layout) and batteries-included widgets (Popup, InputField, Thinking, Logo).

Guiding Principles
- Minimal viable core: sharp boundaries between screen buffer, scheduler, widget tree, render objects.
- Deterministic rendering: diff per line; batch writes; throttle animations.
- Ergonomic APIs: predictable widget contracts; small, composable primitives.
- Testability first: headless renderer; injected clocks; snapshotable buffers.

Scope (Initial)
- Rendering: 2D cell buffer with 24-bit color and style flags.
- Scheduling: phased frame loop (build → layout → paint → render).
- Layout: Constraints, Flex (Row/Column), Stack (overlays), Padding/Align.
- Text: wrapping/clip/truncate; style runs; border drawing.
- Widgets: Box, Text, InputField, PopupOverlay, ThinkingIndicator, Logo.
- Input: key parsing, focus management, overlay interception, simple shortcuts.

Milestones
Status Summary (2025-09-04)
- v0: completed
- v1: completed (skeleton only; no full render-tree yet)
- v2: completed (minimal Row/Column/Stack + border/text helpers)
- v3: completed (interactive input + suggestions, multiline, auto-resize)
- v4: completed (popup + overlay stack + backdrop + scrolling)
- v5: completed (Thinking, Typing, Logo, StatusManager)
- v6: in progress (docs grow incrementally; example app available)

Where Things Live
- Screen: `src/screen/Screen.js` (double buffer, per-line diffs, 24‑bit colors)
- Scheduler: `src/scheduler/Scheduler.js` (phased loop: build/layout/paint/render)
- Layout: `src/layout/{Column,Row,Stack,Constraints}.js` (flexible sizes; simple rects)
- Widgets: `src/widgets/{Box,Text,InputField,PopupOverlay,Thinking,Logo}.js`
- Overlay: `src/overlay/OverlayStack.js` (topmost intercepts input; backdrop)
- Status: `src/status/StatusManager.js` (first‑class status entries)
- Theme: `src/theme/theme.js` (dark/light/legacy presets; runtime toggle)
- Demos: `examples/app_demo.js`, `examples/ticker.js`, `examples/input_*`, `examples/layout_demo.js`
- Utils: `src/util/{ansi.js,wrap.js}` (ANSI helpers, greedy wrapping)
v0 — Core Rendering Skeleton (1–2 days)
- Deliverables:
  - Screen buffer with double-buffering and per-line diffs.
  - ANSI renderer: hide/show cursor, home, write runs, cursor placement.
  - Headless renderer for tests (string snapshot).
- Acceptance:
  - Renders a static Box + Text scene; snapshots stable across frames.
  - Implemented: `examples/hello.js` (OK)

v1 — Scheduler + Widget/Render Model (1–2 days)
- Deliverables:
  - Frame Scheduler with phased callbacks and frame coalescing.
  - Widget base classes (Stateless/Stateful) and RenderObject tree.
  - Dirty marking for layout/paint; simple Context.
- Acceptance:
  - Counter widget that rebuilds on a timer; only dirty regions update.
  - Implemented: `examples/ticker.js` — phases exist; full render tree deferred.

v2 — Layout & Text Engine (2–3 days)
- Deliverables:
  - Constraints, Size, Offset utilities; Row/Column with flex; Stack overlays.
  - TextRenderer: wrap/clip/truncate; inline styles; border drawing helpers.
  - Box, Text, Padding, Align widgets.
- Acceptance:
  - Demo scene arranging boxes and wrapped text with precise sizing.
  - Implemented: `examples/layout_demo.js`, and used by `examples/app_demo.js`.

v3 — Interactive InputField + Suggestions (2–3 days)
- Deliverables:
  - InputField (interactive or read-only): cursor, selection, placeholder, formatting hooks.
  - Suggestion overlay (above input), provider API, item renderer, pick handler.
  - Focus manager, key routing; basic validators; hint line.
- Acceptance:
  - Bottom-anchored input with slash-command suggestions that do not move the input.
  - Implemented: `src/widgets/InputField.js` with:
    - Editing (insert/delete/backspace, Home/End, Ctrl+U/K/W/A/E), cursor, wrapping.
    - Suggestions: provider API, Up/Down or j/k, Enter/Tab accept, Esc close.
    - Bordered dropdown above input, aligned to input's left border; by default width ≈ 60% of terminal (configurable), optional use of full input width; invert selection in legacy theme.
    - Multiline via `allowNewlines` and Ctrl+J; Up/Down across wrapped lines.
    - Auto-resize via `autoResize`, `minRows`, `maxRows` (app recomputes layout each frame).

v4 — PopupOverlay + Scrolling + Shortcuts (1–2 days)
- Deliverables:
  - Modal PopupOverlay with small fixed size, scrollable body, footer hint.
  - Overlay stack with topmost input interception; close/cancel shortcuts.
  - Scroll keys: Up/Down, PgUp/PgDn, Home/End, j/k.
- Acceptance:
- `/help` opens the popup; scrolling works; input is blocked while open.
  - Implemented: `src/widgets/PopupOverlay.js`, `src/overlay/OverlayStack.js`:
    - Full-screen dim backdrop; interior fill masks underlying UI.
    - Border modes: `border: 'box' | 'none'`; borderless draws bold inline title.
    - Scroll keys: Up/Down, j/k, PgUp/PgDn, Home/End; Esc/q close.

v5 — Status Widgets: ThinkingIndicator + Logo (1–2 days)
- Deliverables:
  - ThinkingIndicator: animated; stops after first assistant message; toggle via F2/Ctrl+T and /think.
  - Logo: animated ASCII; hides after first user message; re-show API.
  - Status manager for future entries (Typing/Waiting), minimal API.
- Acceptance:
  - Example scene shows startup logo, thinking near input that later becomes a history-like entry and stops animating.
  - Implemented: `src/widgets/Thinking.js`, `src/widgets/Logo.js`, `src/status/StatusManager.js`:
    - StatusManager API: `add/open/close/toggle/remove/getActive`; onClose commits to history.
    - Demo: Thinking+Typing stack above input; lifecycle simulated with timeouts.
    - Logo: animated at start; hides after first user message.

v6 — Example App + Docs (1–2 days)
- Deliverables:
  - Example scene replicating current demo: logo + history area + thinking + bottom input + popup.
  - Docs: quickstart, APIs, examples, testing; migration notes from scripts/.
- Acceptance:
  - One command runs the example; docs cover the architecture and components.
  - Implemented: `npm run demo:app` (Shift+T theme cycle; Shift+B popup border toggle).
  - Docs: this roadmap; additional API references to follow.

APIs (Targets)
- Screen: beginFrame(), endFrame({cursor, showCursor}), setCell(x,y,ch,fg,bg,attrs), clear(), size(), writeText().
- Scheduler: requestFrame(), setFps(fps), now(), on(name, cb), off(name, cb).
- RenderObject: layout(constraints), paint(screen, ox, oy), markNeedsLayout(), markNeedsPaint().
- Layout: Constraints, Size, Offset; Row({children, gap}), Column(…), Stack({children}).
- TextRenderer: measure(text, width), wrap(text, width), draw(x,y,runs[], style).
- Widgets: Box({border, title, style, child}), Text({runs|string, style, wrap}),
  InputField({…config…}), PopupOverlay({title, body, footer, onClose}),
  ThinkingIndicator({style, spinner, open}), Logo({mode, palette}).
- Input routing: FocusManager, setFocus(node), onKey(event), overlay intercept.
  Theme: getTheme(), setTheme('legacy'|'dark'|'light'|overrides)

InputField Configuration (Starter)
- Size: width, maxWidth, height (lines), maxLines, padding.
- Colors: fg, bg, borderFg, cursorColor, selectionBg.
- Border: style (none/light/heavy/double), rounded, title.
- Behavior: placeholder, initialValue, readOnly, secure, wrap (soft/hard/none), maxLength.
- Interactions: onChange, onSubmit, onCancel, onFocus, validator, formatter.
- Suggestions: provider(prefix)=>items[], limit, position (above/overlay), itemRenderer, onPick.
  - Implemented: above-input bordered dropdown aligned to input's left; width ratio (default 0.6 of terminal) with optional input-width mode; legacy invert selection.
- Extras: prefix/suffix text, hint line, scrollIntoView strategy, imePassthrough.

Testing Strategy
- Headless snapshots for Box/Text/Input/Popup.
- Injected clock for deterministic Thinking/Logo animations.
- Golden tests for layout (Row/Column/Stack) on known sizes.
  - TODO: add headless snapshots (Screen.toString) for demos; deterministic clock for Thinking/Logo.

Risks & Mitigations
- Terminal variability: prefer basic SGR; provide feature flags; document fallbacks.
- Performance in small terminals: keep wrapping and diff O(n) per line; throttle animations.
- Key parsing across platforms: ship a conservative default map; allow overrides.

Timeline (Rough)
- Week 1: v0–v2
- Week 2: v3–v5
- Week 3: v6 + polish, docs, examples

Next Steps
- Add concise API docs (screen/scheduler/layout/widgets/overlay/status/theme).
- Focus manager (centralized); current routing is manual per demo.
- Mouse input (SGR 1006) for clickable status toggles and popup close.
- History polish: wrapping + timestamps; role styling from theme.
- Theme menu + persistence; document legacy mapping to tokens.

Open Questions
- Theming: legacy fidelity vs. colorized statuses (we support both via tokens).
- Mouse support: SGR 1006 early or post-MVP?
- History model: keep StatusManager separate (current) or unify with history entries with special renderers?

Usage Notes (Demos)
- App: `npm run demo:app` — `/help` opens PopupOverlay; Shift+B toggles popup border; Shift+T cycles themes (legacy/dark/light); F2/Ctrl+T and F3/Ctrl+Y toggle statuses.
- Ticker: `npm run demo:ticker` — Shift+T toggles themes; `/help` opens help in demos that support it.
- Input: `npm run demo:input` (read‑only), `npm run demo:input:interactive`, `npm run demo:input:multiline`.

Changelog
- 2025-09-04: Suggestions dropdown refined to align with legacy styling (left-aligned to input, default width ratio 60% of terminal; configurable alignment and input-width mode). Popup overlay now fully masks underlying UI (backdrop + interior fill). Theme system includes a legacy preset with dim borders and invert selection; added runtime theme cycling in the demo.

Legacy‑Inspired Additions
Low‑Hanging Fruit
- Key Parser: normalized key names (Ctrl/Alt/Meta/F‑keys), bracketed paste, and newline variants; module `keymap` for reuse.
- Focus Manager: central `FocusManager` with `setFocus`, Tab/Shift+Tab traversal, and overlay focus capture.
- SIGWINCH Resize: listen for terminal resizes; call `screen.resize(columns, rows)`; reflow layout.
- Scheduler Helpers: `setIntervalFrame(fn, ms)` built on Scheduler to simplify spinners/tickers; injectable `now()` already present.
- Text Wrap API: expose `measure(text,width)` and `wrap(text,width)` in a `TextRenderer` util; reuse in InputField/Popup.
- More Borders: add `heavy`, `rounded`, and `double` border styles; title alignment (left/center/right).
- Progress Utilities: ship `ProgressBar` (done) and `renderProgressLine` (done); add percentage formatting option.
- Theme Tokens: document token mapping to legacy attrs; add `highContrast` preset.
- Demo Flags: first‑run help hint; optional FPS counter overlay.

Shipped (Usability L1)
- Page builder: `src/facade/Page.js` with `Page.full(screen).margin(n).row()/column()`.
- Fluent builders: `src/fluent/{Box,Input,Popup,Progress}.js` for Englishy chaining.
- Keys mapper: `src/input/Keys.js` → `Keys.map({ 'F2|Ctrl+T': fn, '?': fn })`.
- Helpers: `src/util/lang.js` → `times(n, fn)`.

Good to Have
- Mouse (SGR 1006): enable/disable; clicks to toggle statuses, close popups; scroll wheel for history and popup body.
- Grapheme/WCWidth: proper string width for Unicode (emoji, combining marks); replace greedy wrap with `wcwidth` + grapheme segmentation.
- Bracketed Paste: detect `CSI 2004h/l`; treat pasted content as a single edit; optional sanitize/newline policy.
- InputField Enhancements: selection, Ctrl+Left/Right word nav, history recall (Up/Down when empty), validators/formatters, prefix/suffix adornments.
- History View: scrollback with PgUp/PgDn, timestamps, role styling from theme, virtualization for large logs.
- Render Tree (Optional): formalize `RenderObject` with dirty layout/paint flags and parent/child relationships for fine‑grained invalidation.
- Color Fallbacks: detect 24‑bit support; degrade to 256/16‑color; theme provides fallback palettes.
- Diagnostics Overlay: draw layout bounds, z‑order, and a mini log; toggle with a key.
- Idle Phase: optional `idle` scheduler phase for low‑priority work (precompute wraps, measure text).
- Snapshot Tests: headless golden tests for demos; deterministic clock for animations.
