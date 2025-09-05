Title: API — Input & Focus

Overview
- Centralized focus and key routing across focusable widgets.

Module
- Path: `src/input/FocusManager.js`
- Export: `class FocusManager`

API
- `add(node): node` — register a node `{ handleKey(key):boolean, onFocus?(), onBlur?(), isEnabled?():boolean }`.
- `remove(node): void` — unregister a node.
- `setFocus(node): boolean` — move focus to the node; fires `onBlur`/`onFocus`.
- `current(): node|null` — return the current focused node.
- `next(): node|null`, `prev(): node|null` — cycle through enabled nodes.
- `handleKey(key): boolean` — Tab/Shift+Tab switch focus; otherwise forwards to focused node.

Notes
- The app demo registers the `InputField` with `isEnabled` that returns false when a popup overlay is open.
- Integrates cleanly with `OverlayStack` (top overlay intercepts keys before focus routing).

