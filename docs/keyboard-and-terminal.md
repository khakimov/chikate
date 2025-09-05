Title: Keyboard & Terminal Behavior Notes

Alt screen & cursor
- Enter: `CSI ?1049 h`; Exit: `CSI ?1049 l`.
- Hide cursor: `CSI ?25 l`; Show: `CSI ?25 h`.

Bracketed paste
- Enable: `CSI ?2004 h`; Disable: `CSI ?2004 l`.
- Useful when you want to distinguish pasted vs typed input.

Common key sequences
- Up/Down/Left/Right: `CSI A/B/C/D`.
- Home/End: Often `CSI H/F` but also `CSI 1~ / 4~` or `ESC OH / ESC OF`.
- PgUp/PgDn: `CSI 5~ / 6~`.
- F1…F4: `ESC OP/OQ/OR/OS`; F5…F12: `CSI 15~ 17~ 18~ 19~ 20~ 21~ 23~ 24~`.
- Ctrl+T: `\u0014` (ETB) in many terminals.
- Ctrl+Shift+T: some terminals send `CSI 1;6 T`, some do not transmit modifiers unless configured.
- Kitty “CSI u” mode: `CSI <codepoint>;<mods> u` (optional, requires app enabling it).

Colors
- 24‑bit foreground: `CSI 38;2;R;G;B m`; background: `CSI 48;2;R;G;B m`.
- Reset: `CSI 0 m`.

Mouse (optional)
- SGR extended mode: enable `CSI ?1006 h` and `CSI ?1000 h` for button press; events arrive as `CSI <btn>;<x>;<y> M` / `m`.
- You must parse button codes and convert to coordinates; disable on exit.

Cross‑terminal tips
- Avoid printing raw printable key chords for control actions; prefer control sequences (F‑keys, Ctrl combos) so input remains clean.
- Keep a mapping table and log unknown sequences to extend support.

