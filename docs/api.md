API Reference

This page lists the small set of APIs you’ll actually use. Names match the source so search stays intuitive.

withApp
- Module: `src/facade/withApp.js`
- `withApp(run, opts?)` — bootstraps alt‑screen, input, scheduler, and cleanup.
- `opts`: `{ enableBracketedPaste=true, enableMouse=true, loop=false, cursorStyle=null, resizeDebounceMs=32 }`.
- `run(ctx)` gets `{ screen, sched, keys, timers, stdin }`.

Screen
- Module: `src/screen/Screen.js`
- `size() => { width, height }`
- `beginFrame()`, `setCell(x,y,ch, fg?, bg?, attrs?)`, `endFrame()`

Scheduler
- Module: `src/scheduler/Scheduler.js`
- `onFrame(fn)`, `requestFrame()`

Keys
- Parser: `src/input/KeyParser.js` — `class KeyParser`
- `new KeyParser({ enableBracketedPaste=true, enableMouse=true })`
- Events: `on('key', fn)`, `on('paste', fn)`, `on('mouse', fn)`
- Mouse: press/drag/release as `mouse` events; wheel as `key` events. `keys.setMouseEnabled(on)` toggles at runtime.
- Mapper: `src/input/Keys.js` — `Keys.map({ 'F2|Ctrl+T': fn }) => handler(key)`

Layout
- Row: `src/layout/Row.js` — `layoutRow({ x,y,width,height,gap,children })`
- Column: `src/layout/Column.js` — `layoutColumn({ ... })`
- Stack: `src/layout/Stack.js` — `layoutStack({ ... })`
- Constraints: `src/layout/Constraints.js`

Widgets
- Text: `src/widgets/Text.js` — `Text(screen, { x,y,text,style? })`
- Box: `src/widgets/Box.js` — `Box(screen, { x,y,width,height,title?,style? })`
- ProgressBar: `src/widgets/ProgressBar.js`
- PopupOverlay: `src/widgets/PopupOverlay.js`
- Logo: `src/widgets/Logo.js`
- ThinkingIndicator: `src/widgets/Thinking.js`
- HistoryView: `src/widgets/HistoryView.js` — scrollable history with selection.
  - Selection: `hasSelection()`, `getSelectedText()`, `clearSelection()`, `onSelectionChanged`, `handleMouse(evt)`
  - Keys: `handleKey(key)` supports scroll (arrows, PgUp/PgDn, Home/End, j/k, g/G)
  - Folds (disclosure blocks):
    - Item shape: `{ who: 'status', kind: 'fold', key, title, body, open?, streaming? }`
    - Click the header to toggle; body wraps and scrolls with history.
    - Spinner: set `streaming: true` to show an animated spinner in the header.
    - Global expand-all: `foldAllExpanded` flag; `setFoldAllExpanded(v)`, `toggleFoldAll()`.
    - Hooks: `onItemToggled(item)`, `onFoldAllChanged(v)`.
  - Styling overrides:
    - `style.fgByRole = { you, assistant, status }` to tint text per role.
    - `style.attrsByRole = { you, assistant, status }` to apply attrs (e.g., italic 8) per role.

Example — add a foldable Thinking block
```js
history.push({
  who: 'status', kind: 'fold', key: 'thinking-1', title: 'Thinking',
  body: analysisText, open: false, streaming: true
});
// Toggle all folds programmatically
historyView.toggleFoldAll();
```

InputField
- Module: `src/widgets/InputField.js`
- Single‑line input with placeholder, cursor navigation, and basic editing.
- APIs: `handleKey(key)`, `handleMouse(evt)`, `getText()`, `setText(s)`, `onSubmit(fn)`

Theme
- Module: `src/theme/theme.js`
- `getTheme()`, `setTheme(name)`
- Text attrs: bold(1), dim(2), invert(4), italic(8)

SelectionController
- Module: `src/selection/SelectionController.js`
- Global range model used by `HistoryView` to manage press/drag/release.
- APIs: `press(idx)`, `drag(idx)`, `release()`, `getRange()`, `clear()`, `addListener(fn)`

StatusManager
- Module: `src/status/StatusManager.js`
- Stack of small status widgets (e.g., Thinking/Typing/Debug) with open/close semantics.
- APIs: `add(id, widget, meta?)`, `open(id)`, `close(id)`, `paint(...)`

Timer
- Module: `src/time/Timer.js`
- Simple time utilities for one‑shots or repeated callbacks.

Utilities
- ANSI: `src/util/ansi.js` — cursor moves and SGR.
- Wrap: `src/util/wrap.js` — Unicode‑aware wrapping and measuring.
- Progress: `src/util/progress.js` — helpers for progress bars.

Notes
- Clipboard: examples copy via OSC‑52; many terminals support it out of the box.
- Exit: double‑Ctrl+C is common; demos clear selection on first Ctrl+C so the next press exits.
