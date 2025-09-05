Title: Engineering Principles — Simple, Clear, Deep

Why
- We want code that is easy to read, easy to change, and hard to misuse. We use A Philosophy of Software Design as our north star.

Principles
- Small surface, big value: prefer deep modules (small APIs that do a lot). Hide details.
- Clear contracts: document what each function promises and what it needs. Validate inputs early.
- Eliminate temporal coupling: avoid “call A, then B, then C”. Prefer one call that does the right thing.
- Information hiding: don’t leak internal state. Keep modules independent.
- Straightforward names: prefer plain English. Pick names you don’t need to explain.
- Simple first: start with the simplest thing that works. Add options only when needed.
- Comments explain why: code shows “what”. Comments and docs say “why this way”.
- Fail helpful: on bad input, return clear messages. Make it easy to recover.
- No wasted work: only redraw when state changes; avoid redundant writes; keep things predictable.

Code Style
- Keep functions short and focused. If it does two things, split it.
- Make types obvious from the names: `items`, `rect`, `key`, `lines`.
- Prefer object configs to long arg lists. Use named fields.
- Keep conditionals flat. Early returns beat deep nesting.
- One responsibility per module. If a file grows too many reasons to change, split it.

APIs We Aim For
- Englishy: `Popup('Help').borderless().open(overlays)`.
- Minimal: `Page.full(screen).margin(2).column(1).add(left.flex(1), right.minHeight(3))`.
- Safe: `withApp` sets up and tears down the terminal. You don’t need to remember the order.

Testing & DX
- Headless snapshots for rendering. Deterministic clocks for animations.
- Demos for every new feature. Keep them tiny. Keep them runnable.

Checklists
- Before you add an option, ask: who needs this now? Can we infer it?
- Before you add a parameter, ask: can this be a config field with a default?
- Before you change a public API, ask: can we add a thin wrapper and deprecate gently?

