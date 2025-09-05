Title: Rendering Ideas — Lessons from a Legacy Implementation

Summary
- Notes on practical rendering patterns observed in a legacy bundle (artifacts/amp), plus improvements we applied. Focus: deterministic frames, small diffs, stable cursor policy, overlays/z‑order, and animation backpressure.

Frame Model
- Single owner of terminal IO: the renderer owns SGR and cursor writes; others request frames.
- Phases: build → layout → paint → render. Coalesce `requestFrame()`; throttle to target FPS.
- Double buffer: previous and current cell arrays; compute per‑line diffs; emit one batch.

Diffing & Batching
- Merge adjacent cells of same style into runs; avoid emitting SGR redundantly.
- Group writes per frame into a single payload; minimize `write()` calls (fewer syscalls, fewer flushes).
- Early‑out: if no diffs and cursor state unchanged, do not write anything this frame.
- Fallback: if line’s changes exceed a threshold, repaint the whole line rather than many small runs (heuristic improves throughput).

Cursor Strategy (Flicker Avoidance)
- Don’t hide/show every frame. Track last cursor position and visibility.
- Hide cursor only when emitting content or when turning visibility off.
- Show cursor only when visibility needs to become true. No‑op if already shown.
- Set cursor position after diff writes; skip if unchanged since last frame.
- Policy: when overlays are open, input cursors typically hidden; show only for active text input.

SGR State & Colors
- Maintain a local SGR state (fg,bg,attrs). Only emit changes when style actually differs.
- Use 24‑bit sequences when available (CSI 38;2;… / 48;2;…) with graceful fallback to 256/16 if needed.
- Prefer attribute toggles (bold/dim/invert) over changes to colors for simple emphasis (legacy look).

Overlays & Z‑Order
- Maintain an overlay stack. Topmost intercepts input. Render order: backdrop → base scene → overlays (from bottom to top).
- Backdrop paints full screen dim fill once per frame (not per overlay) to ensure masking and reduce overdraw.

Input Pipeline & Backpressure
- Raw stdin → key parser (normalize names; bracketed paste on) → focus router or overlay.
- Batch async updates via scheduler; don’t write from input handlers directly—always request a frame.
- Bracketed paste: emit one logical paste event; avoid per‑char frames while pasting.

Animations & Timing
- Use a lightweight ticker only when animations are present (e.g., status spinners). Stop ticker when idle.
- For smoothness under load, dynamically reduce FPS or skip frames (drop intermediate ticks, render latest state).
- Injected clock for tests to make animations deterministic.

Resize Handling
- Listen for `stdout.resize` (SIGWINCH). Resize buffers, recompute layout the next paint, and request a frame.
- During resize bursts, coalesce frames (debounce) to avoid cascading repaints.

Heuristics from Legacy Systems (inferred)
- Observable‑style scheduling: buffer notifications while handler runs; drain later (prevents reentrancy glitches).
- Single logical “app loop” owns flushing; sources schedule work by enqueuing events.
- Prefer idempotent paint: paint functions rely only on current state; no incremental mutations hidden in paint.

iTerm2 & Flicker Notes
- iTerm2 visibly blinks when cursor visibility toggles often. Solution: don’t toggle unless required; avoid spamming hide/show.
- Avoid emitting redundant cursor moves to the same position. Cursor movements are cheap but still trigger visual work.
- Reduce frame rate when no visual change; in the ideal steady state, do zero writes.

Implementation Checklist (applied in this repo)
- Screen
  - Track last cursor x/y and shown flag; elide redundant hide/show/move.
  - Early‑out if no diffs and cursor state unchanged.
- Scheduler
  - Coalesced `requestFrame()`; simple FPS throttle; phase sequence.
- App Demo
  - Removed busy loop; added on‑demand animation ticker (~80ms) when Thinking/Typing are active.
  - Resize handler updates screen and requests a frame.
- Input
  - KeyParser normalizes events and aggregates bracketed paste.
  - FocusManager routes keys; overlay stack intercepts before routing.

Potential Enhancements
- Dirty rectangles at widget layer: each widget marks affected rect; renderer only scans those lines.
- Line repaint heuristic: if number of changed runs per line > K, repaint full line.
- Output buffering strategy: buffer to string builder; defer write until end; optionally flush with `setBlocking` or `
  ";synchronized writes"` on terminals that support it.
- Terminal capability detection: negotiate truecolor, mouse tracking, bracketed paste; fallback paths.

References
- artifacts/amp/main.pretty.js shows observer buffering and coalesced tasks.
- keyboard-and-terminal.md documents bracketed paste and common key sequences.
