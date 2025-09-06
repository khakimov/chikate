Concepts

Chikate favors a few simple pieces you can compose. Each piece does one job well and stays predictable.

Screen
- Paints to the terminal with a buffered frame model to avoid flicker.
- APIs: `size()`, `beginFrame()`, `setCell(x,y,ch, fg?, bg?, attrs?)`, `endFrame()`.

Scheduler
- Drives your render loop efficiently; coalesces requests into frames.
- APIs: `onFrame(fn)`, `requestFrame()`.

Layout
- Small helpers, not a full engine. Compose via functions and simple math.
- Row/Column/Stack: return positioned boxes; you draw into those.
- Constraints: clamp width/height; apply gaps and padding.

Widgets
- Pure functions or tiny classes that paint into a box.
- Box, Text, ProgressBar, PopupOverlay, Logo, ThinkingIndicator, HistoryView, InputField.
- Opinionated about readability; all accept a `style` to override colors/attrs.

Input (Keys & Mouse)
- `KeyParser` turns raw stdin into `key`, `mouse`, and `paste` events.
- Mouse uses SGR mode and supports press/drag/release plus wheel as keys.
- Bracketed paste groups pasted text into one event.

Selection
- History-only, controller-backed selection for copy ergonomics.
- Click and drag inside `HistoryView` to select; Ctrl+C copies via OSC-52 and clears selection; pressing Ctrl+C again exits.
- Bottom-anchored hit‑testing matches paint, including role bars and padding.

Theme
- A small palette for consistent colors; changeable at runtime.
- Get with `getTheme()`, change with `setTheme(name)`.
- Text attributes: bold(1), dim(2), invert(4), italic(8). Combine as needed.
- HistoryView styling: per‑role overrides via `style.fgByRole` and `style.attrsByRole`.
- Fold bodies (e.g., Thinking) default to dim+italic for unobtrusive detail.

Status
- `StatusManager` stacks small status widgets (e.g., Thinking/Typing/Debug) and paints them in a reserved area.
- Foldable status in history: represent analysis as a `kind: 'fold'` item; headers toggle open/closed, and a global expand‑all flag can reveal all.

Overlays
- `OverlayStack` manages popups and transient UI over your scene.

Timers
- `Timer` runs delayed or repeating callbacks; coexists with the scheduler without blocking paint.

Philosophy
- Developer comfort first: predictable defaults, minimal magic, escape hatches everywhere.
- Do the obvious thing by default; be explicit when it matters.
