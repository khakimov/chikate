Title: API — Screen

Overview
- Buffer-based terminal renderer with per-line diffs and optional headless mode.

Module
- Path: `src/screen/Screen.js`
- Export: `class Screen`

Constructor
- `new Screen({ stream=process.stdout, headless=false, width?, height? }={})`

Methods
- `size(): { width, height }` — current terminal/buffer size.
- `resize(width, height): void` — resets buffers to the new size.
- `beginFrame(): void` — clears current buffer for drawing.
- `setCell(x, y, ch, fg?, bg?, attrs=0): void` — set a cell.
- `writeText(x, y, text, { fg?, bg?, attrs=0, maxWidth? }={}): void` — write a run.
- `endFrame({ cursor?, showCursor=false }={}): void` — diff render to stream; position cursor.
- `clear(): void` — clears current buffer.
- `toString(): string` — plain-text snapshot of current buffer.

Notes
- Colors: `fg`/`bg` are `{ r, g, b }` or `null`; `attrs` uses ANSI SGR flags (0=reset, 1=bold, 2=dim, 4=invert).
- Headless: when `headless` is true, no writes occur; use `toString()` for snapshots.

