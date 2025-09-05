Title: Designing a Small TUI Framework

Objectives
- Make it easy to compose screens from reusable parts (widgets), including animation and async input.
- Keep a deterministic and efficient render path (diff batches where possible).

Core architecture
1) Screen buffer
   - Maintain a 2D buffer of cells `{char, fg, bg}` from the previous frame.
   - Accumulate a new buffer while painting; compute a minimal diff (ranges per line).
   - Emit a single batch: hide cursor, move home, write diffs, set cursor, show cursor.

2) Frame scheduler
   - Maintain callbacks for phases: `build`, `layout`, `paint`, `render` (common render loop pattern).
   - Coalesce multiple `requestFrame()` calls into the next tick.
   - Throttle animation to a target fps (or request animation frame per animation source).

3) Widget model
   - StatelessWidget / StatefulWidget base classes with `createState()` and `build(context)`.
   - Elements connect widgets to render objects.
   - Render objects:
     - Hold size, offset, and children.
     - Implement: `layout(constraints)`, `paint(screen, x, y)`.
     - Mark dirty on state/property changes.

4) Constraints and layout
   - `Constraints(minW, maxW, minH, maxH)` and helpers `tight/loose/constrain`.
   - Flex containers (Row/Column) compute child sizes:
     - Non‑flex items use intrinsic sizes.
     - Flex items divide remaining space proportionally.

5) Input/event routing
   - Raw stdin → key parser → focused element or popup.
   - Mouse (optional): enable SGR 1006, convert events to local coordinates, hit‑test via render tree.

6) Color and style
   - Foreground/background as 24‑bit (`CSI 38;2;…` / `48;2;…`).
   - Style flags: bold, dim, invert; avoid global state; write SGR codes inline with text runs.

7) Popups and overlays
   - Draw as the last pass; block input routing while open.
   - Use a simple stack (topmost intercepts input).

Minimal APIs to target
- `Screen`: begin/end frame, setCell, clear, moveTo, show/hide cursor.
- `Scheduler`: add/remove callbacks per phase, requestFrame().
- `RenderObject`: layout/paint; `markNeedsLayout()`, `markNeedsPaint()`.
- `TextRenderer`: wrap/clip/truncate, run styles.

Testing & ergonomics
- Provide a “headless” mode that dumps the painted buffer into a string snapshot for testing.
- Clock injection for deterministic animation.

Why this design
- Separates rendering concerns (screen, scheduler) and keeps loops predictable.
- The demo shows how to get 80% of the win with a few hundred LOC and no external deps.
