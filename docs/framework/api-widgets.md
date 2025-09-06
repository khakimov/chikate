Title: API — Widgets

Overview
- Stateless helpers and small stateful widgets used by the demos.
 - All widgets support the standard style options in `docs/style-system.md` (borders, embedded footer labels, theme colors).

Modules
- Box: `src/widgets/Box.js` — `Box(screen, { x, y, width, height, title?, style? })`
- Text: `src/widgets/Text.js` — `Text(screen, { x, y, text, style? })`
- Border: `src/widgets/border.js` — `drawBorder(screen, x, y, w, h, { title?, style? })`
- InputField: `src/widgets/InputField.js` — class `InputField(cfg)`
- HistoryView: `src/widgets/HistoryView.js` — class `HistoryView(opts)`
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
  suggestionProvider, suggestionPrefix='/', suggestionLimit=5, suggestionSubmitOnPick='auto'|'true'|'false',
  suggestionBoxWidthRatio=0.6, suggestionInset=1, suggestionUseInputWidth=false, suggestionAlign='left', style, borderStyle, borderFooter?, borderFooterAlign?, borderFooterPosition? }`.
 - `borderStyle`: 'rounded' | 'double' | 'heavy' | 'single' | 'none'.
  - `borderFooter`: string drawn inside the border as a label (e.g., `"Enter to send"`).
  - `borderFooterAlign`: 'left' | 'center' | 'right' (default 'center').
  - `borderFooterPosition`: 'bottom' | 'top' (default 'bottom').
- Methods: `setValue(v)`, `measureHeightForWidth(w)`, `desiredRowsForWidth(w)`, `getCursorScreenPos()`, `handleKey(key): boolean`, `paint(screen)`.
- Suggestions: items may be strings or `{ text, label? }`. `label` is shown; `text` is inserted on accept. If `suggestionSubmitOnPick` is 'auto' (default), a picked token that starts with the prefix (e.g., `/help — …`) submits immediately by calling `onSubmit('/help')`.

HistoryView
- Options: `{ items, showTimestamps=false, title='History', style, maxItems=1000, timestampMode='time', showSeconds=false, border='box'|'none', anchorBottom=false, itemGap=1, paddingX=2, showSender=false, senderFormat?, userBar=true, userBarChar='┃', userBarPad=1 }`.
- Layout: `border='none'` removes the frame (clean feed). `anchorBottom=true` paints from the bottom up. `itemGap` inserts blank lines between messages. `paddingX` adjusts horizontal padding.
- Sender label: `showSender` prints a sender label (You/Assistant/Status by default via `senderFormat(who)`), styled with `style.senderFg`.
- Role bars: Draw colorful full-height leading bars for selected roles.
  - `barFor`: 'all' | 'you' | 'assistant' | 'status' | string[] (default ['you']). Back-compat: `userBar: false` disables the 'you' bar.
  - `barChar` (alias `userBarChar`): bar glyph (default '┃').
  - `barPad` (alias `userBarPad`): spaces after the bar.
  - Colors: global `style.barFgByRole = { you, assistant, status, default }`, or legacy `style.userBarFg` for 'you'.
    - Per-item override: set `barFg` (or `userBarFg`) on a history item. Fallback: theme role color, then border color.

PopupOverlay
- `new PopupOverlay({ title='Help', body, footer, width=40, height=12, style?, border='box'|'none', backdrop=false })`
  - `backdrop`: if true, draws a dim full‑screen backdrop behind the popup. Defaults to false so background content remains visible.
- Methods: `handleKey(key): boolean`, `onRequestClose(fn)`, `paint(screen)`, `paintBackdrop(screen)`.

ThinkingIndicator
- `new ThinkingIndicator({ text='Thinking', frames=[…], interval=80, style?, animateColors=true, palette?, waveSpeed?, waveWidth? })`
- Methods: `start()`, `stop()`, `toggle()`, `setOpen(bool)`, `paint(screen, { x, y, width })`.
- Animated colors: requires color themes (`statusUseColors: true` e.g., Dark/Light). Legacy theme uses a dim single‑color line.
- With `StatusManager`, call both `statuses.open('thinking')` and `thinking.setOpen(true)`.

Logo
- `new Logo({ text='CHIKATE', style? })`
- Methods: `setVisible(bool)`, `paint(screen, { x, y, width })`.

ProgressBar
- `new ProgressBar({ x,y,width,value=0,max=100,label='',showCounts=true,charset='solid',style? })`
- Methods: `set(value, max?)`, `paint(screen)`.
