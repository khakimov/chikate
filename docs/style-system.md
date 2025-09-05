Title: Style System — Unified Options

Use these options across widgets for a consistent, “lego‑like” styling model. Widgets ignore unsupported keys gracefully.

Borders
- style.style: 'rounded' | 'single' | 'double' | 'heavy' | 'none'
- style.borderFg: theme color override for the border line
- style.titleFg, style.titleAttrs, titleAlign: title styling/alignment
- style.borderFooter: string drawn inside the border as a label (e.g., "Enter to send")
- style.borderFooterAlign: 'left' | 'center' | 'right' (default 'center')
- style.borderFooterPosition: 'bottom' | 'top' (default 'bottom')

Spacing & Flow
- itemGap: number of blank lines between items (list‑like widgets)
- anchorBottom: bool — when true, paint from bottom; new items auto‑scroll if at end

Alignment (content)
- alignX: 'left' | 'center' | 'right' — content alignment when applicable
- alignY: 'top' | 'center' | 'bottom'

Colors (theme‑derived)
- style.fg, style.bg, style.hintFg, style.titleFg, style.borderFg
- Prefer theme defaults; override sparingly.

Notes
- InputField: supports borderStyle via style.style, and borderFooter* label.
- PopupOverlay: supports the same border options; embeds labels in the frame.
- HistoryView: typically uses border='none', but accepts the border style if enabled.
