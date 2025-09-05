Title: LLM Integration — Reasoning-Friendly Guidelines

Purpose
- Help code assistants (and humans) make correct changes without memorizing edge cases. Capture the logic and invariants of interaction.

Input Ownership (event flow)
- Pipeline: KeyParser → Overlays (if open) → FocusManager (current widget) → Global bindings.
- Rule: printable characters belong to the focused widget (usually the input).
- Rule: global bindings should be non‑printable (F‑keys, Ctrl/Alt combos) or slash commands handled on submit.

Key Binding Guidelines (Do/Don’t)
- Do: bind Help to F1; also support “/help” in onSubmit.
- Don’t: bind “?” (or any printable) as a global shortcut.
- Do: use `Keys.map` for non‑printable shortcuts; pass everything else to `focus.handleKey(key)`.
- Why: preserves text entry and avoids conflicts across keyboard layouts.

Slash Commands Pattern
- Handle commands in the input’s `onSubmit`:
  - `if (trimmed === '/help') openHelp(); else append to history`.
- Keep commands discoverable (hint text) and composable (LLMs can inject `/cmd ...`).

Overlays (Popups)
- Input‑modal, visual‑non‑destructive.
- Default `backdrop=false`: draw popup over existing content; set `backdrop: true` to dim the screen.
- Always repaint while an overlay is open (scroll, page, home/end change state every key).

Event Routing Invariants
- Overlays first; if consumed → repaint.
- Focused widget handles printable keys and editing.
- Global keys are idempotent and reversible (e.g., F1 opens/closes Help).

Checklist for Assistants
- Don’t bind printable keys globally (e.g., “?”). Help = F1 and “/help”.
- Keep “/” unbound globally so suggestions work.
- Repaint on any overlay key while open.
- Keep cursor management to `screen.endFrame({ cursor, showCursor })`.

Examples
- Good (Help):
  - `keys.on('key', ev => { if (overlays.isOpen()) return; if (ev.name === 'F1') openHelp(); })`
  - `onSubmit: if (trimmed === '/help') openHelp(); else history.push(...)`
- Bad (Help):
  - `keys.on('key', ev => { if (ev.name === '?') openHelp(); }) // binds a printable`

Why this helps
- These invariants are easier for LLMs to follow than long lists of special cases. The result is more predictable, durable code edits.

