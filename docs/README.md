This docs folder explains the demo TUI composed in `scripts/logo_input_combo.js`, and how you could build a small, ergonomic TUI framework.

Documents
- logo_input_combo.md: A deep dive into the script: layout model, rendering, keyboard handling, animations, help popup, and thinking/chat history.
- status-history.md: The extensible status entry model (Thinking/Typing/Waiting) integrated as part of the chat history.
 
- tui-framework.md: How to design a tiny TUI framework with a layout/paint pipeline, screen buffer, and a widget composition model.
- keyboard-and-terminal.md: Practical terminal behavior notes (key sequences, alt-screen, bracketed paste, colors, mouse), and cross-terminal tips.
 - framework/api-screen.md, api-scheduler.md, api-layout.md, api-widgets.md, api-theme.md, api-input.md, api-history.md, api-withapp.md, api-keys.md, api-timer.md: concise API stubs for core modules and helpers.

If you are reading this first, start with `logo_input_combo.md`.
