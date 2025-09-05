Title: Resize Handling — Patterns and Practicalities

Context
- Terminal resize events can leave “ghost” characters on screen and cause layout glitches if the renderer doesn’t treat them as a special case. A robust approach (and what we now follow) is to coalesce resize events, reset internal buffers, and force a clean repaint.

What a resize means
- Columns/rows changed under our feet. Any state derived from width/height is now invalid.
- The backing buffers (prev/curr) may no longer match the terminal. If we diff them as‑is, the renderer may produce no writes and stale content remains.
- Cursor positions, scroll offsets, and overlay sizes must be clamped to the new bounds.

Signals and sources
- Node emits `process.stdout.on('resize', () => { … })` (SIGWINCH on POSIX). Use this as the single source of truth.
- Don’t attach multiple listeners in different modules. Keep one place that translates “resize” into a render request.

Robust patterns (inferred and applied)
- Coalesce and defer: set a “needs resize” flag and request a frame. Let the normal frame phases (build → layout → paint → render) handle it. This avoids reentrancy and duplicate work if several events arrive quickly.
- Reset buffers: on resize, throw away the previous and current frame arrays and reinitialize for the new width*height. Treat the next frame as a clean slate.
- Clear the terminal: issue a hard clear and move cursor home right after changing internal size, before the next paint. This removes any leftover characters from the old grid.
- Clamp state:
  - Cursor: if outside the new bounds, move it to the closest valid cell.
  - Scroll offsets and selections: bring them into range.
  - Overlays: recompute size/position; prevent negative or zero interior.
- Idempotent paint: ensure every widget’s `paint` uses only current state + rect; no incremental mutations inside paint. After resize, a single paint pass reconstructs the scene.

Renderer checklist (we use this)
- Screen.resize(cols, rows):
  - Rebuild buffers, reset last‑cursor state.
  - Hide cursor, clear screen (`ESC[2J]`), move home.
  - Do not attempt a diff vs. the old prev — it’s meaningless now.
- Next `paint`:
  - Read `screen.size()`; recompute top‑level rects (Page/Column/Row).
  - Re‑measure text (wrapping depends on width).
  - Reposition overlays and suggestion dropdowns.
  - Clamp status/history scroll offsets.

App loop checklist
- Single resize listener at the shell (withApp): on resize → `screen.resize(...)` → `sched.requestFrame()`.
- No busy loops. Frames are event‑driven; a tiny animation ticker runs only while something animates.
- During a resize burst, relying on coalesced frames is usually enough; if needed, debounce the resize callback by ~16–50ms.

Widget expectations
- HistoryView: re‑wrap lines and clamp scroll top to `max(0, items.length - innerH)`.
- InputField: re‑wrap, update desired height, recompute cursor screen position, reposition suggestions.
- PopupOverlay: re‑center, recompute interior bounds, clamp scroll to `maxScroll`.
- Status/Logo: recompute anchor rows relative to the input/history rects.

Testing tips
- Shrink and expand the terminal repeatedly; verify no ghosts remain between frames.
- Add a “full repaint next frame” flag and assert it gets cleared after a frame.
- Snapshot headless output for known sizes: 80×24, 120×40, etc.

Alternatives and trade‑offs
- Instead of hard‑clearing on resize, one can force a full diff render on the next frame. In practice, issuing `ESC[2J` + home is simpler and more reliable across terminals (removes all old content instantly).
- You can debounce resize with a small timeout to avoid thrashing on terminals that generate many events; it adds latency but reduces work.

Summary
- Treat resize as a reset: clear screen, reset buffers, recompute everything, repaint once. Keep this logic centralized, simple, and deterministic. This is how robust renderers stay stable under rapid resizes.
