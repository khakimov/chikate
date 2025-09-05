Title: API — HistoryView

Overview
- Scrollable message history with optional timestamps and theme-aware role styling.

Module
- Path: `src/widgets/HistoryView.js`
- Export: `class HistoryView`

Constructor
- `new HistoryView({ items=[], showTimestamps=false, title='History', style?, maxItems=1000, timestampMode='time', showSeconds=false }={})`

Data Model
- Item: `{ who: 'you'|'assistant'|'status'|string, text: string, ts?: number }`

Methods
- `setItems(items: Item[]): void` — replace items (by reference if you pass the same array); caps to `maxItems`.
- `push(item: Item): void` — append and scroll to end; caps to `maxItems`.
- `clear(): void` — remove all items and reset scroll.
- `scrollToEnd(): void` — jump to the last line (after wrapping).
- `handleKey(key): boolean` — lines-based scrolling: Up/Down, PgUp/PgDn, Home/End, `j/k`, `g/G`.
- `paint(screen, { x, y, width, height }): void` — draw bordered history area with wrapped lines and hanging indent.

Notes
- Role colors from theme: `historyUser`, `historyAssistant`, `historyStatus`.
- Lines are wrapped with a Unicode-aware width heuristic and a hanging indent (prefix on the first line only).
- Scrolling is by wrapped lines (not items), so long messages scroll smoothly.
- Integrates with `FocusManager`: register a focus node that calls `handleKey(key)` when focused.
- `timestampMode`: 'time' (HH:MM), 'datetime' (YYYY-MM-DD HH:MM[:SS]), or 'relative' (e.g., 3m, 2h, 1d). `showSeconds` adds seconds to 'time' and 'datetime'.

Example
- In `examples/app_demo.js`, `HistoryView` replaces manual history rendering and supports scrollback.
