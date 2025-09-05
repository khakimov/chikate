Title: API — Widgets

Overview
- Stateless helpers and small stateful widgets used by the demos.

Modules
- Box: `src/widgets/Box.js` — `Box(screen, { x, y, width, height, title?, style? })`
- Text: `src/widgets/Text.js` — `Text(screen, { x, y, text, style? })`
- Border: `src/widgets/border.js` — `drawBorder(screen, x, y, w, h, { title?, style? })`
- InputField: `src/widgets/InputField.js` — class `InputField(cfg)`
- PopupOverlay: `src/widgets/PopupOverlay.js` — class `PopupOverlay(opts)`
- ThinkingIndicator: `src/widgets/Thinking.js` — class `ThinkingIndicator(opts)`
- Logo: `src/widgets/Logo.js` — class `Logo(opts)`
- ProgressBar: `src/widgets/ProgressBar.js` — class `ProgressBar(cfg)`

Box
- Draws a bordered box with optional title.
- `style.borderFg`, `style.borderAttrs`, `style.titleFg`, `style.titleAttrs`.
- `style.style`: 'none' | 'single' (default) | 'double' | 'heavy' | 'rounded'
- `style.titleAlign`: 'left' (default) | 'center' | 'right'

Text
- Renders multi-line strings; respects `style.maxWidth`.

InputField
- Config highlights: `{ x,y,width,height,title,placeholder,hint,readOnly,allowNewlines,submitOnEnter,autoResize,minRows,maxRows,
  suggestionProvider, suggestionPrefix='/', suggestionLimit=5, suggestionBoxWidthRatio=0.6, suggestionInset=1,
  suggestionUseInputWidth=false, suggestionAlign='left', style }`.
- Methods: `setValue(v)`, `measureHeightForWidth(w)`, `desiredRowsForWidth(w)`, `getCursorScreenPos()`, `handleKey(key): boolean`, `paint(screen)`.

PopupOverlay
- `new PopupOverlay({ title='Help', body, footer, width=40, height=12, style?, border='box'|'none', backdrop=false })`
  - `backdrop`: if true, draws a dim full‑screen backdrop behind the popup. Defaults to false so background content remains visible.
- Methods: `handleKey(key): boolean`, `onRequestClose(fn)`, `paint(screen)`, `paintBackdrop(screen)`.

ThinkingIndicator
- `new ThinkingIndicator({ text='Thinking', frames=[…], interval=80, style? })`
- Methods: `start()`, `stop()`, `toggle()`, `setOpen(bool)`, `paint(screen, { x, y, width })`.

Logo
- `new Logo({ text='CHIKATE', style? })`
- Methods: `setVisible(bool)`, `paint(screen, { x, y, width })`.

ProgressBar
- `new ProgressBar({ x,y,width,value=0,max=100,label='',showCounts=true,charset='solid',style? })`
- Methods: `set(value, max?)`, `paint(screen)`.
