Title: API — Keys (Parser & Mapper)

Overview
- Normalize raw stdin into friendly key events and support bracketed paste; simple mapper for declarative bindings.

Modules
- Parser: `src/input/KeyParser.js` — `class KeyParser`
- Mapper: `src/input/Keys.js` — `Keys.map({ ... })`

KeyParser
- `new KeyParser({ stdout=process.stdout, enableBracketedPaste=true, enableMouse=false })`
- `attach(stdin): () => void` — listen to `data`; enables bracketed paste (`CSI ? 2004 h`) and mouse (`CSI ? 1006 h`) if configured.
- `detach(): void` — removes listener; disables paste and mouse if enabled.
- `on('key', cb)`, `on('paste', cb)` — subscribe to events; returns `off` via `on` return.
- Event shapes:
  - Key: `{ type:'key', name:string, seq:string }` e.g., `Up`, `Ctrl+T`, `F2`, `/`.
  - Paste: `{ type:'paste', data:string }` (between `ESC[200~` and `ESC[201~`).

Keys Mapper
- `Keys.map({ 'F2|Ctrl+T': fn, 'Ctrl+C': fn }) => (keySeq) => boolean`
- Turns symbolic names into raw sequences and returns a handler to call with raw key data.

Notes
- Exit: examples use a double Ctrl+C window (1s) to prevent accidental exits.
- Recognizes: arrows, Home/End/Delete, PgUp/PgDn, F1–F3, Tab/Shift+Tab, Backspace, Enter, Ctrl+A..Z, and printable chars.
- Mouse (if enabled): emits keys `WheelUp` and `WheelDown`.
- Paste: while parsing a paste, all content until the end marker is emitted as one `paste` event.

Binding guidelines (reasoning‑first)
- Treat printable keys as input; avoid global bindings on printable characters (e.g., “?”).
- Prefer non‑printable shortcuts for global actions (F‑keys, Ctrl combos).
- Handle `/commands` in `onSubmit` — predictable and agent‑friendly.
 - Avoid “q to quit”; prefer Ctrl+C (optionally with a confirm window).
