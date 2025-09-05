Title: API — Keys (Parser & Mapper)

Overview
- Normalize raw stdin into friendly key events and support bracketed paste; simple mapper for declarative bindings.

Modules
- Parser: `src/input/KeyParser.js` — `class KeyParser`
- Mapper: `src/input/Keys.js` — `Keys.map({ ... })`

KeyParser
- `new KeyParser({ stdout=process.stdout, enableBracketedPaste=true })`
- `attach(stdin): () => void` — listen to `data`; enables bracketed paste (`CSI ? 2004 h`).
- `detach(): void` — removes listener; disables bracketed paste.
- `on('key', cb)`, `on('paste', cb)` — subscribe to events; returns `off` via `on` return.
- Event shapes:
  - Key: `{ type:'key', name:string, seq:string }` e.g., `Up`, `Ctrl+T`, `F2`, `?`.
  - Paste: `{ type:'paste', data:string }` (between `ESC[200~` and `ESC[201~`).

Keys Mapper
- `Keys.map({ 'F2|Ctrl+T': fn, '?|/': fn, 'q|Ctrl+C': fn }) => (keySeq) => boolean`
- Turns symbolic names into raw sequences and returns a handler to call with raw key data.

Notes
- The parser recognizes common arrows, Home/End/Delete, PgUp/PgDn, F2/F3, Tab/Shift+Tab, Backspace, Enter, Ctrl+A..Z, and printable chars.
- While parsing a paste, all content until the end marker is emitted as one `paste` event.

