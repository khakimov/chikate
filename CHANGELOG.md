# Changelog

All notable changes to this project will be documented here.

## 0.1.0 — Initial public preview
- Add deterministic diff renderer with stable cursor handling and clean resize.
- Introduce `withApp` facade, `Page` layout helper, and `Scheduler.forceFrame`.
- Normalize input with `KeyParser` (bracketed paste) and `Keys` mapper; add `FocusManager`.
- Provide `TimerRegistry` for timeouts/intervals with clean disposal.
- Ship widgets: `Box`, `Text`, `InputField` (wrapping + suggestions), `HistoryView` (timestamps, line scroll), `PopupOverlay`, `ThinkingIndicator`, `Logo`, `ProgressBar`.
- Unicode‑aware wrapping and measurement utilities.
- Themes with presets (`dark`, `light`, `legacy`) and helpers to switch/override.
- Examples and guided demo; docs and packaging plan.
## 0.1.1 — Fixes and behavior tweaks
- Popup backdrop is now opt-in (default false) so content stays visible behind popups.
- Repaint overlays on every key while open (scroll updates immediately).
- Help trigger simplified to `/help` (removed `?` binding); slash now goes to input for suggestions.
- Exit confirmation: press Ctrl+C twice within 1s to exit (removed `q` to quit in examples).
- Status banners: when using `StatusManager` with `ThinkingIndicator`, set both the status entry open and the widget’s `setOpen(true)` for it to render.
- HistoryView: added `border='none'`, `anchorBottom`, and `itemGap` options for a clean, bottom‑anchored feed with spacing.
- InputField: added `borderStyle` config to pick rounded/double/etc. borders.
- ThinkingIndicator: optional animated color wave (`animateColors`, `palette`, `waveSpeed`, `waveWidth`).
 - InputField: added `borderFooter` with `borderFooterAlign` and `borderFooterPosition` to draw a label inside the border (e.g., "─ Enter to send ─").
