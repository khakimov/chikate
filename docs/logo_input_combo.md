Title: Combined Logo + Input Demo (scripts/logo_input_combo.js)

Overview
The script `scripts/logo_input_combo.js` is a self‑contained TUI demo that renders:
- A moving ASCII logo (noise + radial falloff + color gradients).
- A conversation history panel (right side), which includes a live “Thinking …” block as part of the chat stream.
- A help popup overlay with scrolling.
- A bottom‑anchored input box with a slash‑command suggestion menu.

Goals
- Demonstrate a miniature layout model that keeps the input anchored while rendering content above it.
- Show an animated render loop in the terminal without external dependencies.
- Provide practical keyboard handling for toggles and popups in raw mode.

High‑Level Layout
- Regions are computed top‑down, but the input is absolutely anchored:
  - Input box: bottom of the screen (fixed height = `lines + 2`).
  - Suggestion box: if open, it floats immediately above input (does not move input).
  - History area: everything above suggestions; we bottom‑align the last N lines of history there.
  - Logo: rendered on the left in the history area (vertically centered); history text renders to the right.
  - Thinking: flattened into the history list as the latest item; when expanded, it occupies multiple lines.

Anchoring math
- `boxHeight = lines + 2` where `lines` is based on wrapping the current input.
- `hintHeight = 1` (the “Enter to send” line).
- `inputTop = rows - (boxHeight + hintHeight) + 1` (independent of suggestions).
- `suggestHeight = (open ? min(items, 6) + 2 : 0)`.
- `suggestTop = inputTop - suggestHeight`.
- `topAreaHeight = max(0, suggestTop - 1)`.

History flattening
- We flatten `submitted` messages into lines.
- Append “Thinking” lines to the end of the flattened array:
  - Collapsed: `[+] ∴ Thinking ⠋`.
  - Expanded: `[-] ∴ Thinking ⠋` and the dimmed body lines.
- Bottom‑align this flattened list into the history region (so it feels like a chat window).

Keyboard
- Help popup: `?` to toggle, or `/help` and Enter.
- Thinking toggle: F2 (ESC O Q or ESC [ 12 ~), Ctrl+T (`\u0014`), Ctrl+Shift+T variants (where terminals send them), or `/think`.
- Suggestions: Up/Down to navigate, Enter/Tab to accept, Esc to close.
- Input navigation: Left/Right; Backspace deletes; Enter submits.

Help popup overlay
- Centered box (default up to 60×12), scrolling with Up/Down, PgUp/PgDn, Home/End (and `j/k`).
- Drawn after the frame, with cursor safely parked; all other input is intercepted while open.

Thinking implementation
- Modeled after a simplified `Be1(A)` pattern:
  - Cleans `<ENCRYPTED>…</ENCRYPTED><ID>…</ID>` using a regex.
  - Renders header as `∴ Thinking` with an animated spinner.
  - Optional expanded body lines are dimmed.
- Integrated into the history reducer so it “flows” like regular messages.

Animation loop
- A timer updates:
  - The logo’s time value (`__t += dt`), though the logo renderer recomputes per frame.
  - The spinner frame for the Thinking header.
- We re‑render on resize or key events.

Rendering details
- We rely on ANSI control sequences only:
  - Alt screen enter/leave (`CSI ?1049 h/l`).
  - Cursor show/hide (`CSI ?25 l/h`).
  - Move to (`CSI {row};{col} H`).
  - 24‑bit colors for the logo (`CSI 38;2;r;g;b m`).
- Box drawing uses Unicode line chars (─│┌┐└┘), so your font must support them.

Preserving borders in the input box
- We do not call `clearLine` when drawing content; instead we clear only the interior and write the text within, so left/right borders remain intact.

Known tradeoffs
- Mouse: Not wired in (kept simple). We can add SGR mouse reporting (1006) with X10 and parse Button Press to toggle items.
- Terminal variances: We matched several common sequences for F2 and Ctrl+Shift+T, but terminals differ; see `docs/keyboard-and-terminal.md`.

How to extend
- Style history by role: prefix user/system/thinking lines differently, add color accents.
- Virtualize history: keep all messages in memory but render only the last window worth of lines.
- Add a minimal widget abstraction (see `docs/tui-framework.md`) to structure layouts like rows/columns/pads and enable composability.

