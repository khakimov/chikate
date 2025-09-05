Title: Extensible Status Entries in History (Thinking, Typing, Waiting)

Why
“Thinking” should appear as part of conversation history, not as a separate floating panel. Treating it as a first‑class history entry makes it easy to extend with future statuses such as “Typing…” or “Waiting for reply…”.

Model (pragmatic)
- messages: string[] — submitted chat lines (flattened at render)
- statuses: Map<string, StatusEntry>

StatusEntry
- key: unique id (e.g., 'thinking')
- kind: 'thinking' | 'typing' | 'waiting' | ...
- visible: boolean
- position: 'auto' | 'top' | 'bottom'
  - 'auto': bottom (latest) before first message, top (oldest) after first message
- collapsible?: { open: boolean }
- animate?: { frames: string[], index: number, enabled: boolean }
- stopAnimateOnFirstMessage?: boolean
- header?: string
- data?: string (body)
- builder(entry): () => string[] — returns the lines to render for this entry

Behavior in the demo
- thinking (auto):
  - Before first message: appears at bottom, with spinner.
  - After first message: moves to top; spinner stops (so it acts as a first “message”).
  - Collapsible body: toggled via keyboard.
- typing/waiting: Not fully implemented, but the same pattern can be used with different frames and no collapse.

Render pipeline
1) Build top status lines first (e.g., thinking after first message).
2) Append message lines.
3) Append bottom status lines (e.g., typing indicator).
4) Bottom‑align the final flattened list into the history region.

Control
- Toggle thinking: F2 / Ctrl+T / `/think`.
- Stop animation: happens automatically when the first real message is submitted.

Extension guide
- Add a new entry: `statuses.set('typing', { key:'typing', kind:'typing', visible:true, position:'bottom', animate:{ frames:['⠁','⠂','⠄','⠂'], index:0, enabled:true }, builder: e => [ 'Typing ' + e.animate.frames[e.animate.index] ] })`.
- To show/hide: `statuses.get('typing').visible = true/false`.
- To update frames: the same render timer increments `index` for all `animate.enabled` entries.

