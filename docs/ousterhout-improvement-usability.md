Title: Usability Plan — Ousterhout + Ruby‑like APIs

Intent
- Make the framework feel obvious, friendly, and hard to misuse. Favor Englishy, discoverable APIs with sensible defaults and deep modules that do more per unit of surface area.

Guiding Principles (Ousterhout)
- Deep modules: small APIs with big functionality; hide policy and mechanism where possible.
- General‑purpose over special‑case: build primitives that compose; avoid tunnel APIs.
- Define contracts and invariants: document edge cases; validate inputs early; fail fast with helpful messages.
- Eliminate information leakage: keep private details private; keep modules independent.
- Temporal decoupling: avoid APIs that require strict call sequences; make single calls do the right thing.
- Comments explain design/decision, not the “what”; choose names that remove the need to comment.

Naming & Grammar
- Nouns are concepts: `Screen`, `Page`, `Overlay`, `History`, `Theme`, `Timer`.
- Verbs are clear actions: `draw`, `show`, `hide`, `open`, `close`, `toggle`, `focus`, `scroll`, `wrap`, `layout`.
- Englishy builders: prefer `page.column(...).stack(...)` and `box.titled('Help').rounded()` over parameter soup.
- Defaults first: `Input()` equals a sensible prompt; override by named options or fluent methods.

API Shape (Friendly Surface)
- Creation helpers
  - `createScreen({ alt=true })` — creates `Screen` and switches to alt screen if requested; auto‑restore on exit.
  - `withApp(fn)` — setup/teardown around a loop; catches errors and restores terminal.
- Key routing
  - `onKey('Ctrl+C', quit)` — string keys normalized; multiple bindings are supported if desired.
  - `Focus.next()`/`Focus.prev()`; `Focus.on(node)`; `Focus.route(key)`; returns boolean consumed.
- Layout
  - `page = Page.at(2,2).size('100%','100%');`
  - `page.column(gap=1).add(history.flex(1), input.autoHeight());`
  - `row(gap=2).add(left.minWidth(20), right.flex(1))` — chainable rect builders returning plain rects.
- Widgets
  - `Box().titled('History').rounded().draw(rect)` — attributes as fluent chain; no required args.
  - `Input().placeholder('Type…').multiline().suggestions(provider)` — chain config.
  - `Popup('Help').borderless().body(text).footer(hint).open()` — reads like English.
- Status
  - `Status.add('thinking', Thinking('Thinking')).open()`; `Status.toggle('typing')`.
- Theme
  - `Theme.use('legacy')`; `Theme.cycle()`; `Theme.override({ fg: … })`.
- Time & animation
  - `Timer.every(80, spin)`; `Timer.after(500, fn)` with auto‑cancel on teardown.

Englishy Helpers (Ruby‑ish Flavor)
- Repetition
  - `times(5, i => log(i))` — functional helper; avoids monkey‑patching Number.
- Collections
  - `each(items, (item, i) => …)`; `mapToText(items, row => row.label)` where useful for rendering.
- Declarative input bindings
  - `Keys.map({ 'Ctrl+C': quit, 'F2|Ctrl+T': toggleThinking })`.

Examples (Sketches)
- Startup
  - `withApp(({ screen, sched, Keys, Page, Theme }) => { Theme.use('legacy'); const page = Page.full().margin(2); … })`
- Layout + widgets
  - `const [histR, inputR] = page.column(1).add(history.flex(1), input.autoHeight());`
  - `Box().titled('History').style({ style: 'rounded' }).draw(histR)`
  - `Input().placeholder('Type /help').onSubmit(handle).draw(inputR)`
- Popup
  - `Popup('Help').border('box').size(60,14).open()`
- Progress
  - `Progress('Update plan').value(5,5).solid().draw({ x: 2, y: 2, width: 40 })`

Defaulting & Safety
- Reasonable defaults for size, style, and behavior (e.g., `Input` shows cursor, supports Esc to cancel, Enter to submit).
- Validate early: clear error messages if a required constraint or child is missing.
- Hard‑to‑misuse: guard against writing outside screen bounds; clamp sizes.

Docs & Discoverability
- Keep every module’s README short with “90‑second quickstart” and “Try this next”.
- Provide consistent method ordering in docs: construction → configuration → actions → events.
- Show recipes over reference when introducing features (e.g., “Popup + overlay + focus capture” in 10 lines).

Refactors Aligned With Philosophy
- Deepen `Page` abstraction: owns margins, background clear, and layout splits; fewer places for callers to compute rects.
- Consolidate key handling: one `Keys` module translating strings ↔ codes; layered over raw stdin.
- Make timers a first‑class module: `Timer` tracks disposables tied to the app lifecycle.
- Elevate history to a widget: `HistoryView` owns wrapping, timestamps, scrollback, virtualization.

Phase Plan (Low → High Effort)
- L1 (low)
  - Add `times(n, fn)` and `Keys.map({...})` helpers.
  - Introduce `Page` with `full()/at().size().margin().column().row()` returning rects.
  - Fluent builders for `Box`, `Input`, `Popup`, `Progress` (sugar over existing config).
- L2 (medium)
  - `HistoryView` with scrollback and role styling from theme.
  - `createScreen` and `withApp` wrappers; central teardown and alt‑screen management.
  - `Theme.cycle()` and `Theme.override()` sugar.
- L3 (higher)
  - Key parser with bracketed paste and named combos; mouse SGR 1006 opt‑in.
  - `Timer` module with `every/after` and auto‑dispose on teardown.
  - Optional render tree with `RenderObject` and dirty flags; keep helpers for easy mode.

Naming Conventions
- Methods as verbs (`open`, `close`, `toggle`, `draw`).
- Builder setters read naturally (`titled`, `rounded`, `borderless`, `placeholder`).
- No abbreviations unless ubiquitous (`fg`, `bg` acceptable); prefer whole words elsewhere.

Testing & DX
- Headless snapshots for every widget example; include Englishy snippets in docs.
- Deterministic clock injection visible in examples (`Timer.withClock(clock)`).
- `npm run demo:*` remains the quickest path; `demo:list` prints available demos and controls.

Open Questions
- Should the fluent builders be separate from the minimal helpers, or layered as thin wrappers? (Leaning wrappers.)
- How far to push DSL vs. plain JS objects? Aim for tasteful minimalism: readable, not magical.
