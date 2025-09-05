const { Box } = require('./Box');
const { Text } = require('./Text');
const { wrapToWidth } = require('../util/wrap');
const { getTheme } = require('../theme/theme');

// Read-only-first input field. Later we will add interactive behaviors.
class InputField {
  constructor(cfg = {}) {
    const t = getTheme();
    this.cfg = {
      x: 0, y: 0, width: 20, height: 3,
      title: 'Input',
      value: '',
      placeholder: '',
      hint: '',
      readOnly: false,
      allowNewlines: false,
      submitOnEnter: true,
      autoResize: false,
      minRows: 1,
      maxRows: 5,
      onChange: null,
      onSubmit: null,
      onCancel: null,
      suggestionProvider: null, // (prefix, value, cursor) => items[]
      suggestionPrefix: '/',
      suggestionLimit: 5,
      // Submit immediately after picking a suggestion that looks like a command.
      // 'auto' (default): submit if the picked token starts with suggestionPrefix.
      // true: always submit on pick; false: never submit on pick.
      suggestionSubmitOnPick: 'auto',
      // Suggestion dropdown sizing/placement (match scripts/logo_input_combo.js by default)
      suggestionBoxWidthRatio: 0.6, // portion of terminal width (when not using input width)
      suggestionInset: 1,           // margin from screen edge when align='left' or 'right'
      suggestionUseInputWidth: false, // if true, size/align relative to input box
      suggestionAlign: 'left',      // 'left' | 'center' | 'right'
      style: {
        fg: t.fg,
        placeholderFg: t.placeholder,
        borderFg: t.border,
        hintFg: t.hint,
        suggestFg: t.suggest,
        suggestSelFg: t.suggestSelFg,
        suggestSelBg: t.suggestSelBg,
      },
      borderStyle: undefined, // 'rounded' | 'double' | 'heavy' | 'single' | 'none'
      borderFooter: null,      // string shown embedded in border (e.g., 'Enter to send')
      borderFooterAlign: 'center', // 'left' | 'center' | 'right'
      borderFooterPosition: 'bottom', // 'bottom' | 'top'
      ...cfg,
    };
    this.value = String(this.cfg.value || '');
    this.cursor = this.value.length;
    this.scrollY = 0; // first visible line index
    this.suggestions = [];
    this.suggestOpen = false;
    this.suggestIndex = 0;
    this._colPref = null; // preferred column for vertical navigation
    // Selection
    this.selActive = false;
    this.selAnchor = null; // char index
    this.selCursor = null; // char index
  }

  setValue(v) {
    this.value = String(v || '');
    this.cursor = Math.min(this.cursor, this.value.length);
    this._notifyChange();
  }

  _notifyChange() {
    if (typeof this.cfg.onChange === 'function') this.cfg.onChange(this.value);
  }

  _computeWrap(innerW) {
    const lines = wrapToWidth(this.value || '', innerW);
    if (lines.length === 0) lines.push('');
    // map char index -> {row, col}
    const map = [];
    let idx = 0;
    for (let r = 0; r < lines.length; r++) {
      const line = lines[r];
      for (let c = 0; c < line.length; c++) map[idx++] = { row: r, col: c };
      // virtual newline position maps to end of line
      map[idx++] = { row: r, col: line.length };
    }
    // ensure last position exists
    if (map.length === 0) map[0] = { row: 0, col: 0 };
    return { lines, map };
  }

  _computeWrapForText(innerW, text) {
    const lines = wrapToWidth(text || '', innerW);
    if (lines.length === 0) lines.push('');
    return lines;
  }

  desiredRowsForWidth(totalWidth) {
    const innerW = Math.max(1, (totalWidth | 0) - 4);
    const haveText = this.value && this.value.length > 0;
    const text = haveText ? this.value : (this.cfg.placeholder || '');
    const lines = this._computeWrapForText(innerW, text);
    const rows = Math.max(this.cfg.minRows | 0, Math.min(this.cfg.maxRows | 0, lines.length));
    return rows;
  }

  measureHeightForWidth(totalWidth) {
    const rows = this.desiredRowsForWidth(totalWidth);
    return Math.max(1, rows + 2); // include borders
  }

  _ensureCursorVisible(innerH, cursorRow) {
    // Keep cursor on screen: scroll to show last lines if overflow
    if (cursorRow < this.scrollY) this.scrollY = cursorRow;
    const bottom = this.scrollY + (innerH - 1);
    if (cursorRow > bottom) this.scrollY = cursorRow - (innerH - 1);
  }

  getCursorScreenPos() {
    const { x, y, width: w, height: h } = this.cfg;
    const innerX = x + 2;
    const innerY = y + 1;
    const innerW = w - 4;
    const innerH = h - 2;
    const { map } = this._computeWrap(innerW);
    const pos = map[Math.min(this.cursor, map.length - 1)] || { row: 0, col: 0 };
    this._ensureCursorVisible(innerH, pos.row);
    const rowOnScreen = pos.row - this.scrollY;
    return { x: innerX + pos.col, y: innerY + rowOnScreen };
  }

  _updateSuggestions() {
    const { suggestionProvider, suggestionPrefix, suggestionLimit } = this.cfg;
    if (!suggestionProvider) { this.suggestions = []; this.suggestOpen = false; return; }
    // Extract token starting at last space before cursor
    const before = this.value.slice(0, this.cursor);
    const m = before.match(/(^|\s)(\S*)$/);
    const token = m ? m[2] : '';
    if (!token.startsWith(suggestionPrefix)) { this.suggestions = []; this.suggestOpen = false; return; }
    const items = suggestionProvider(token, this.value, this.cursor) || [];
    this.suggestions = items.slice(0, suggestionLimit);
    this.suggestOpen = this.suggestions.length > 0;
    this.suggestIndex = Math.min(this.suggestIndex, Math.max(0, this.suggestions.length - 1));
  }

  handleKey(key) {
    if (this.cfg.readOnly) return false;
    // Navigation and control keys
    if (key === '\u0003') return false; // Ctrl-C handled by app
    if (key === '\n') { // Ctrl+J -> insert newline
      if (this.cfg.allowNewlines) {
        this.value = this.value.slice(0, this.cursor) + '\n' + this.value.slice(this.cursor);
        this.cursor++;
        this._notifyChange();
        this._updateSuggestions();
      }
      return true;
    }
    if (key === '\r') { // Enter
      if (this.cfg.allowNewlines && !this.cfg.submitOnEnter) {
        this.value = this.value.slice(0, this.cursor) + '\n' + this.value.slice(this.cursor);
        this.cursor++;
        this._notifyChange();
        this._updateSuggestions();
        return true;
      }
      if (this.suggestOpen && this.suggestions[this.suggestIndex]) {
        const submitted = this._applySuggestion(this.suggestions[this.suggestIndex]);
        if (submitted) return true;
      } else if (typeof this.cfg.onSubmit === 'function') {
        this.cfg.onSubmit(this.value);
      }
      return true;
    }
    if (key === '\u001b') { // Esc
      if (this.suggestOpen) { this.suggestOpen = false; return true; }
      if (typeof this.cfg.onCancel === 'function') this.cfg.onCancel();
      return true;
    }
    if (key === '\u0001') { this.cursor = 0; this._updateSuggestions(); return true; } // Ctrl-A
    if (key === '\u0005') { this.cursor = this.value.length; this._updateSuggestions(); return true; } // Ctrl-E
    if (key === '\u0017') { // Ctrl-W delete word back
      const before = this.value.slice(0, this.cursor);
      const after = this.value.slice(this.cursor);
      const nb = before.replace(/\s*\S+\s*$/, '');
      this.value = nb + after;
      this.cursor = nb.length;
      this._notifyChange();
      this._updateSuggestions();
      return true;
    }
    if (key === '\u000b') { // Ctrl-K kill to end
      this.value = this.value.slice(0, this.cursor);
      this._notifyChange();
      this._updateSuggestions();
      return true;
    }
    if (key === '\u0015') { // Ctrl-U kill to start
      this.value = this.value.slice(this.cursor);
      this.cursor = 0;
      this._notifyChange();
      this._updateSuggestions();
      return true;
    }
    if (key === '\u001b[D') { // Left
      this.cursor = Math.max(0, this.cursor - 1); this._updateSuggestions(); return true;
    }
    if (key === '\u001b[C') { // Right
      this.cursor = Math.min(this.value.length, this.cursor + 1); this._updateSuggestions(); return true;
    }
    if (key === '\u001b[H') { this.cursor = 0; this._updateSuggestions(); return true; } // Home
    if (key === '\u001b[F') { this.cursor = this.value.length; this._updateSuggestions(); return true; } // End
    if (key === '\x7f' || key === '\b') { // Backspace
      if (this.cursor > 0) {
        this.value = this.value.slice(0, this.cursor - 1) + this.value.slice(this.cursor);
        this.cursor--;
        this._notifyChange();
        this._updateSuggestions();
      }
      return true;
    }
    if (key === '\u001b[3~') { // Delete
      if (this.cursor < this.value.length) {
        this.value = this.value.slice(0, this.cursor) + this.value.slice(this.cursor + 1);
        this._notifyChange();
        this._updateSuggestions();
      }
      return true;
    }
    if (this.suggestOpen && (key === '\u001b[A' || key === 'k')) { // Up in suggestions
      this.suggestIndex = (this.suggestIndex + this.suggestions.length - 1) % this.suggestions.length;
      return true;
    }
    if (this.suggestOpen && (key === '\u001b[B' || key === 'j')) { // Down in suggestions
      this.suggestIndex = (this.suggestIndex + 1) % this.suggestions.length;
      return true;
    }
    // Vertical navigation across wrapped lines (when suggestions closed)
    if (!this.suggestOpen && (key === '\u001b[A')) { this._moveCursorVertical(-1); this._updateSuggestions(); return true; }
    if (!this.suggestOpen && (key === '\u001b[B')) { this._moveCursorVertical(1); this._updateSuggestions(); return true; }
    if (this.suggestOpen && (key === '\t')) { // Tab pick
      if (this.suggestions[this.suggestIndex]) this._applySuggestion(this.suggestions[this.suggestIndex]);
      return true;
    }
    // Printable characters
    if (typeof key === 'string' && key.length && !/^\u001b/.test(key)) {
      // Filter control characters
      if (/^[\x00-\x1F]$/.test(key)) return true;
      this.value = this.value.slice(0, this.cursor) + key + this.value.slice(this.cursor);
      this.cursor += key.length;
      this._notifyChange();
      this._updateSuggestions();
      return true;
    }
    return false;
  }

  _moveCursorVertical(delta) {
    const { width: w, height: h, x, y } = this.cfg;
    const innerW = w - 4;
    const { lines, map } = this._computeWrap(innerW);
    if (lines.length === 0) return;
    const cur = map[Math.min(this.cursor, map.length - 1)] || { row: 0, col: 0 };
    if (this._colPref == null) this._colPref = cur.col;
    let targetRow = Math.max(0, Math.min(lines.length - 1, cur.row + delta));
    const targetCol = Math.max(0, Math.min(this._colPref, (lines[targetRow] || '').length));
    // find index in map for target row/col
    let bestIdx = 0;
    let best = { row: 0, col: 0 };
    for (let i = 0; i < map.length; i++) {
      const p = map[i];
      if (p.row === targetRow) {
        if (p.col >= targetCol) { bestIdx = i; best = p; break; }
        bestIdx = i; best = p; // keep last seen in row
      }
    }
    this.cursor = bestIdx;
  }

  setHeight(lines) { this.cfg.height = Math.max(1, lines | 0); }

  _applySuggestion(item) {
    // Replace token before cursor with the selected suggestion, optionally auto-submit.
    const before = this.value.slice(0, this.cursor);
    const after = this.value.slice(this.cursor);
    const m = before.match(/(^|\s)(\S*)$/);
    const head = m ? before.slice(0, before.length - (m[2]?.length || 0)) : before;
    const raw = (typeof item === 'string') ? item : (item && (item.insert || item.text)) || '';
    // Extract leading token (command) before any description or whitespace
    let token = String(raw).trim();
    const emDash = ' — ';
    const emIdx = token.indexOf(emDash);
    if (emIdx >= 0) token = token.slice(0, emIdx);
    else { const sp = token.search(/\s/); if (sp >= 0) token = token.slice(0, sp); }

    const insertText = token + ' ';
    const nextValue = head + insertText + after;
    const nextCursor = (head + insertText).length;

    // Close suggestions now
    this.suggestOpen = false;

    const auto = this.cfg.suggestionSubmitOnPick;
    const isCommand = !!this.cfg.suggestionPrefix && token.startsWith(this.cfg.suggestionPrefix);
    // Do not auto-submit if suggestion appears to require arguments (e.g., '/selection on')
    const rawTail = raw.slice(token.length).trim();
    const requiresArgs = isCommand && rawTail.length > 0;
    const shouldSubmit = !requiresArgs && ((auto === true) || (auto === 'auto' && isCommand));
    if (shouldSubmit && typeof this.cfg.onSubmit === 'function') {
      // Submit without leaving the command text in the input
      this.value = '';
      this.cursor = 0;
      this._notifyChange();
      try { this.cfg.onSubmit(token); } catch {}
      return true;
    }

    // Otherwise insert and keep editing
    this.value = nextValue;
    this.cursor = nextCursor;
    this._notifyChange();
    return false;
  }

  paint(screen) {
    // Optionally auto-resize height based on content
    if (this.cfg.autoResize) {
      this.cfg.height = this.measureHeightForWidth(this.cfg.width);
    }

    const { x, y, width: w, height: h, title, placeholder, hint, style } = this.cfg;
    const innerX = x + 2;
    const innerY = y + 1;
    const innerW = w - 4;
    const innerH = h - 2;

    // Suggestions area (drawn above box)
    this._updateSuggestions();
    if (this.suggestOpen) {
      // Draw a bordered suggestion box above the input
      const theme = getTheme();
      const maxLines = Math.min(this.cfg.suggestionLimit, this.suggestions.length, Math.max(0, y - 1));
      const boxH = Math.max(0, maxLines + 2);
      if (boxH >= 2) {
        const { width: W } = screen.size();
        const useInput = !!this.cfg.suggestionUseInputWidth;
        const ratio = Math.max(0.2, Math.min(1, this.cfg.suggestionBoxWidthRatio || 0.6));
        const desiredW = Math.max(20, Math.floor(W * ratio));
        const boxW = Math.max(4, Math.min(W - 2, useInput ? Math.min(w, W - 2) : desiredW));
        const align = this.cfg.suggestionAlign || 'left';
        const inset = this.cfg.suggestionInset | 0;
        let boxX;
        if (useInput) {
          if (align === 'center') boxX = x + Math.max(0, Math.floor((w - boxW) / 2));
          else if (align === 'right') boxX = x + Math.max(0, w - boxW);
          else boxX = x; // left
        } else {
          if (align === 'center') boxX = Math.floor((W - boxW) / 2);
          else if (align === 'right') boxX = Math.max(0, Math.min(W - boxW, W - boxW - inset));
          else boxX = Math.max(0, Math.min(W - boxW, x)); // align left with input's left border
        }
        const boxY = Math.max(0, y - boxH);
        // Border
        const { Box } = require('./Box');
        // Suggestion borders are often brighter than input borders; avoid dim attrs here
        Box(screen, { x: boxX, y: boxY, width: boxW, height: boxH, title: null, style: { borderFg: style.borderFg, borderAttrs: 0 } });
        const listStartY = boxY + 1;
        const interiorW = boxW - 2;
        const showN = Math.min(this.suggestions.length, maxLines);
        for (let i = 0; i < showN; i++) {
          const item = this.suggestions[i];
          const display = (typeof item === 'string') ? item : (item && (item.label || item.text)) || '';
          const trimmed = display.length > interiorW ? display.slice(0, interiorW) : display;
          const yy = listStartY + i;
          const selected = i === this.suggestIndex;
          const useInvert = !!theme.useInvertSelection;
          const fg = selected ? style.suggestSelFg : style.suggestFg;
          const bg = selected ? style.suggestSelBg : null;
          const attrs = selected && useInvert ? 4 : 0; // invert
          // Clear interior line
          for (let j = 0; j < interiorW; j++) screen.setCell(boxX + 1 + j, yy, ' ', fg, bg, attrs);
          Text(screen, { x: boxX + 1, y: yy, text: trimmed, style: { fg, bg, attrs, maxWidth: interiorW } });
        }
      }
    }

    // Box and content
    // Draw border via Box; embed footer via shared border util (style.borderFooter*)
    Box(screen, { x, y, width: w, height: h, title, style: { borderFg: style.borderFg, borderAttrs: getTheme().borderAttrs, style: this.cfg.borderStyle, borderFooter: this.cfg.borderFooter, borderFooterAlign: this.cfg.borderFooterAlign, borderFooterPosition: this.cfg.borderFooterPosition, hintFg: style.hintFg } });

    const hasText = this.value.length > 0;
    const showPlaceholder = !hasText && placeholder;
    const drawText = hasText ? this.value : (showPlaceholder ? placeholder : '');
    const color = showPlaceholder ? style.placeholderFg : style.fg;
    const lines = wrapToWidth(drawText, innerW);
    if (lines.length === 0) lines.push('');

    // Ensure cursor visible and vertical scroll
    const { map } = this._computeWrap(innerW);
    const pos = map[Math.min(this.cursor, map.length - 1)] || { row: 0, col: 0 };
    this._ensureCursorVisible(innerH, pos.row);

    // Render only visible window with selection
    const start = this.scrollY;
    const end = Math.min(lines.length, start + innerH);
    const selA = this.selActive && this.selAnchor != null && this.selCursor != null ? Math.min(this.selAnchor, this.selCursor) : -1;
    const selB = this.selActive && this.selAnchor != null && this.selCursor != null ? Math.max(this.selAnchor, this.selCursor) : -1;
    const indexAt = (row, col) => {
      // Map row/col back to char index by scanning the wrap map
      const { map } = this._computeWrap(innerW);
      for (let i = 0; i < map.length; i++) if (map[i].row === row && map[i].col === col) return i;
      return -1;
    };
    for (let r = start; r < end; r++) {
      const yy = innerY + (r - start);
      const text = lines[r] || '';
      if (selA >= 0 && selB >= 0) {
        // Compute selection columns on this row by finding index ranges
        const rowStartIdx = indexAt(r, 0);
        const rowEndIdx = indexAt(r, text.length);
        const s = Math.max(selA, rowStartIdx);
        const e = Math.min(selB, rowEndIdx);
        if (s < e) {
          const pre = text.slice(0, s - rowStartIdx);
          const mid = text.slice(s - rowStartIdx, e - rowStartIdx);
          const post = text.slice(e - rowStartIdx);
          if (pre) Text(screen, { x: innerX, y: yy, text: pre, style: { fg: color, maxWidth: innerW } });
          if (mid) Text(screen, { x: innerX + pre.length, y: yy, text: mid, style: { fg: color, attrs: 4, maxWidth: innerW } });
          if (post) Text(screen, { x: innerX + pre.length + mid.length, y: yy, text: post, style: { fg: color, maxWidth: innerW } });
          continue;
        }
      }
      Text(screen, { x: innerX, y: yy, text, style: { fg: color, maxWidth: innerW } });
    }

    // Bottom bar below the box (controls/help)
    if (hint) {
      const { width: W, height: H } = screen.size();
      const hintY = y + h < H ? y + h : H - 1;
      const hintText = String(hint);
      const trim = hintText.length > W - 2 ? hintText.slice(0, W - 2) : hintText;
      const hx = Math.max(0, x + Math.floor((w - trim.length) / 2));
      Text(screen, { x: hx, y: hintY, text: trim, style: { fg: style.hintFg } });
    }
  }
}

// Mouse selection support
InputField.prototype.handleMouse = function(evt) {
  const { x, y, width: w, height: h } = this.cfg;
  const innerX = x + 2, innerY = y + 1, innerW = w - 4, innerH = h - 2;
  const rx = evt.x - innerX, ry = evt.y - innerY;
  if (rx < 0 || ry < 0 || rx >= innerW || ry >= innerH) return false;
  const { map } = this._computeWrap(innerW);
  // Find closest index matching row/col (clip to line length)
  const lineLen = (row) => { const { lines } = this._computeWrap(innerW); return (lines[row] || '').length; };
  const col = Math.max(0, Math.min(lineLen(ry), rx));
  let idx = 0;
  for (let i = 0; i < map.length; i++) { if (map[i].row === ry && map[i].col === col) { idx = i; break; } }
  if (evt.name === 'MouseDown') { this.selActive = true; this.selAnchor = idx; this.selCursor = idx; return true; }
  if (evt.name === 'MouseUp') { if (this.selActive) { this.selCursor = idx; return true; } }
  return false;
};

module.exports = { InputField };
