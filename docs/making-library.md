Title: Making “chikate” A Reusable Library

Goal
- Turn this repo into a small, stable TUI library you can depend on from other projects.

Name
- Library name: `chikate`
- NPM package: `chikate` (or scoped: `@chikate/tui` if the name is taken).

Scope (MVP)
- Export these modules as the public API:
  - Core: `Screen`, `Scheduler`.
  - Facades: `withApp`, `Page`.
  - Input: `FocusManager`, `KeyParser`, `Keys` mapper.
  - Time: `TimerRegistry`.
  - Theme: `getTheme`, `setTheme`, `cycleTheme`, `overrideTheme`, presets.
  - Overlay: `OverlayStack`.
  - Widgets: `Box`, `Text`, `InputField`, `PopupOverlay`, `HistoryView`, `ThinkingIndicator`, `Logo`, `ProgressBar`.
  - Utils: `wrapToWidth`, `measureWidth`, `times`.

Plan (Steps)
1) Prepare The Package
   - Set package name to `chikate` in `package.json`.
   - Add `exports` map so imports are clean and tree‑shakable:
     - `.` → `src/index.js` (entry that re‑exports public API).
     - Optional: subpath exports (e.g., `./theme`, `./widgets`), but only if we want them stable.
   - Add `files` list to publish only what we need: `src/**`, `docs/**`, `README.md`, `LICENSE`.
   - Decide on module format: keep CommonJS for now; optionally add ESM later (`"type": "module"`) with dual exports.

2) Create A Stable Entry
   - Add `src/index.js` that re‑exports the public API from internal paths:
     - `module.exports = { Screen, Scheduler, withApp, Page, FocusManager, KeyParser, Keys, TimerRegistry, OverlayStack, theme, widgets, utils }`.
   - Keep internal dirs (`examples/`, `artifacts/`) out of the public surface.

3) Document The API
   - Short README with a “90‑second quickstart”: withApp + Page + Input + History + Popup.
   - Link to API stubs in `docs/framework/*.md` (already added): Screen, Scheduler, Layout, Widgets, Theme, Input/Keys, Timer, History, withApp.
   - Add a small “Concepts” section: frames, overlays, focus routing, themes.

4) Versioning & Stability
   - Start at `0.1.0` for the first public release.
   - Use semantic versioning: breaking changes → major; additive → minor; fixes → patch.
   - Mark “fluent” builders as experimental for now; core widgets/APIs are stable.

5) Tests (Minimum Useful Set)
   - Headless snapshots for `Box`, `Text`, `HistoryView`, `InputField` wrapping.
   - Deterministic tests for `ThinkingIndicator`/`Logo` using a fake clock.
   - Resize test: `Screen.resize` clears and repaints without ghosts.

6) Build & Publish Flow
   - No compile step required (plain JS). If we add TypeScript later, emit `dist/` and map exports.
   - Add scripts:
     - `pack`: `npm pack` to test the tarball locally.
     - `prepublishOnly`: run lint/tests and ensure entry files exist.
   - First release: `npm publish --access public` (if scoped).

7) Consumption (How To Use)
   - Install: `npm i chikate`.
   - Minimal app:
     - `const { withApp, Page, widgets: { InputField, PopupOverlay }, OverlayStack } = require('chikate')`
     - Use `withApp(({ screen, sched, stdin, keys, timers }) => { … })`.
     - Layout with `Page.full(screen).margin(2).column(1)…` or manual layout helpers.
     - Route input through `FocusManager`; open overlays via `OverlayStack`.
     - Use `setTheme('legacy'|'dark'|'light')` or `cycleTheme()`.

8) Terminal Compatibility
   - Document how we handle: alt‑screen, cursor style (optional DECSCUSR), bracketed paste, mouse (when added), and resize.
   - Keep defaults conservative: on by default → bracketed paste; off by default → mouse.

9) Demo App → Example
   - Keep `examples/` as non‑published. Users can still view them on GitHub.
   - Provide copy‑paste snippets in README to bootstrap an app.

10) Maintenance
   - Add CHANGELOG for each release.
   - Tag releases; consider GitHub Actions to run tests on PRs and publish on tags.
   - Keep the public API stable; prefer adding sugar over breaking changes.

Optional (Nice To Have)
- Types: ship `types/index.d.ts` for the public API.
- ESM build: provide dual `exports` for `import` users.
- Subpath exports: `chikate/widgets`, `chikate/theme`, but only after usage stabilizes.

Checklist (Quick)
- [ ] Rename package to `chikate`.
- [ ] Add `src/index.js` (re‑exports) and `package.json.exports`.
- [ ] Prune publish files with `files` field.
- [ ] README quickstart + links to API docs.
- [ ] Smoke tests + a few headless snapshot tests.
- [ ] `npm pack` locally; confirm files and imports work.
- [ ] Publish `0.1.0`.

