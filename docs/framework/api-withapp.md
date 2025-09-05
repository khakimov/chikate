Title: API — withApp

Overview
- Tiny bootstrap helper to set up a Screen + Scheduler + terminal modes with safe teardown.

Module
- Path: `src/facade/withApp.js`
- Export: `withApp(run, opts?)`

Signature
- `withApp(({ screen, sched, stdin, keys, timers, cleanup }) => stopFn?, { enableBracketedPaste=true, loop=false, cursorStyle=null, resizeDebounceMs=32 }={})`
  - Sets alt-screen, clears, enters raw mode, installs SIGINT/exit cleanup, and resize handling.
  - Attaches a KeyParser (normalized keys + bracketed paste) to `stdin`.
  - Calls your `run` function with core handles.
  - Requests one initial frame; if `loop=true`, runs a continuous loop (off by default).
  - Resize: clears screen, resizes buffers, forces an immediate frame and a short debounced follow-up.
  - If `run` returns a function, it is treated as a stop/cleanup hook (optional).

Options
- `cursorStyle`: set terminal cursor style on start (DECSCUSR). Values: `blink-block`, `block`, `blink-underline`, `underline`, `blink-bar`, `bar`. Restored on exit.
- `resizeDebounceMs`: schedule a follow-up frame after a resize burst (default 32ms).

Usage
- Basic
  - `withApp(({ screen, sched, stdin }) => { sched.on('paint', draw); stdin.on('data', onKey); });`
- Cleanup
  - `return () => { /* stop timers, close files */ }` from your `run`.

Notes
- Resize: listens to `process.stdout.on('resize')` and resizes the screen buffer with current `columns/rows`.
- Plays well with `Page`, `FocusManager`, `OverlayStack`, and the fluent layer.
