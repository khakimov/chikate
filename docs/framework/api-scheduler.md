Title: API — Scheduler

Overview
- Coalesced frame scheduler with named phases.

Module
- Path: `src/scheduler/Scheduler.js`
- Export: `class Scheduler`

Constructor
- `new Scheduler({ fps=60, now=()=>Date.now() }={})`

Phases
- `build`, `layout`, `paint`, `render`

Methods
- `on(phase, cb): () => void` — subscribe to a phase; returns an unsubscribe.
- `off(phase, cb): void` — unsubscribe.
- `requestFrame(): void` — schedule a frame; coalesces multiple calls.
- `setFps(fps): void` — adjust throttle rate.

Notes
- `now` is injected for deterministic tests.
- Frames throttle to `1000/fps`; callbacks are try/catch wrapped to avoid crashing the loop.

