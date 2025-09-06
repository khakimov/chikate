Guides

These short recipes cover the things you’ll likely wire first.

History + Selection + Copy
- Use `HistoryView` to render chat‑like history; enable selection by default.
- Mouse: click and drag to select; the widget exposes `hasSelection()`, `getSelectedText()`, and `clearSelection()`.
- Copy on Ctrl+C: send OSC‑52, clear the selection, and allow the next Ctrl+C to exit.
```js
// In your app loop
keys.on('key', (k) => {
  if (k.name === 'Ctrl+C' && historyView.hasSelection()) {
    copyOSC52(historyView.getSelectedText());
    historyView.clearSelection();
    return; // next Ctrl+C can handle exit
  }
  if (k.name === 'Ctrl+C') requestExit();
});
```

Input handling
- Parse once; keep routing simple.
- Use `FocusManager` or your own “active zone” check to decide where keys go.
- Prefer non‑printable shortcuts (F‑keys, Ctrl‑combos) for global actions.

Layout patterns
- Split vertical real estate with `layoutColumn` and a small gap; draw boxes into returned rects.
- Keep math obvious; avoid deep abstractions until you need them.

Theming
- Call `setTheme('dark')` or provide your own palette; widgets accept `style` to override.
- Keep contrast high; highlight selection with a background color that fits your theme.

Mouse modes
- `KeyParser` enables SGR mouse (1006) and drag (1002) by default; you can toggle with `keys.setMouseEnabled(on)`.
- Wheel events arrive on the key channel as `WheelUp`/`WheelDown`.

LLM integration
- Treat the TUI loop as an orchestrator: emit statuses while the model runs, then push messages.
- For cancellation, close the status and stop timers; keep all UI messages in one place.

Troubleshooting
- Clipboard: OSC‑52 works in most modern terminals; some need enabling “Allow clipboard write”.
- Selection: only history is selectable by design; avoid mixing native terminal selection when zoned selection is on.

Foldable “Thinking” (disclosure)
- Pattern: show status analysis as a foldable block inside history.
- Add an item:
```js
history.push({
  who: 'status', kind: 'fold', key: 'thinking', title: 'Thinking',
  body: longAnalysis, open: false, streaming: true
});
historyView.onItemToggled = () => sched.requestFrame();
```
- UX:
  - Click the header (▸/▾ Thinking) to expand/collapse.
  - While `streaming: true`, the header shows a spinner.
  - Toggle all folds: `historyView.toggleFoldAll()` (bind to a key, e.g., Ctrl+E).
