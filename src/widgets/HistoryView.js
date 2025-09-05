const { Text } = require('./Text');
const { Box } = require('./Box');
const { getTheme } = require('../theme/theme');
const { wrapToWidth, measureWidth } = require('../util/wrap');

// HistoryView: scrollable message list with optional timestamps and role styling.
// Items: { who: 'you'|'assistant'|'status'|string, text: string, ts?: number }
class HistoryView {
  constructor({ items = [], showTimestamps = false, title = 'History', style = {}, maxItems = 1000, timestampMode = 'time', showSeconds = false, border = 'box', anchorBottom = false, itemGap = 1, paddingX = 2, showSender = false, senderFormat = null, userBar = true, userBarChar = '┃', userBarPad = 1, barFor = undefined, barChar = undefined, barPad = undefined, selectionEnabled = true } = {}) {
    this.items = Array.isArray(items) ? items : [];
    this.showTimestamps = !!showTimestamps;
    this.title = title;
    this.scroll = 0; // topmost visible line index (after wrap)
    this.style = style || {};
    this._rect = { x: 0, y: 0, width: 0, height: 0 };
    this.maxItems = maxItems | 0;
    this.timestampMode = timestampMode; // 'time' | 'datetime' | 'relative'
    this.showSeconds = !!showSeconds;
    this.border = border || 'box'; // 'box' | 'none'
    this.anchorBottom = !!anchorBottom; // if true, render content anchored to bottom of rect
    this.itemGap = Math.max(0, itemGap | 0); // blank lines between messages for readability
    this._anchor = !!anchorBottom; // when true, keep pinned to end on new content
    this.paddingX = Math.max(0, paddingX | 0);
    this.showSender = !!showSender;
    this.senderFormat = typeof senderFormat === 'function' ? senderFormat : (who) => {
      if (who === 'you') return 'You';
      if (who === 'assistant') return 'Assistant';
      if (who === 'status') return 'Status';
      return String(who || '').trim() || 'User';
    };
    this._lastItemCount = this.items.length;
    this._newCount = 0;
    // Bar configuration
    // Roles to draw bars for: default ['you']; allow 'all' or array or string role names
    let roles = new Set(['you']);
    if (barFor) {
      if (barFor === 'all') roles = new Set(['you','assistant','status']);
      else if (Array.isArray(barFor)) roles = new Set(barFor);
      else if (typeof barFor === 'string') roles = new Set([barFor]);
    }
    // Back-compat: userBar toggles 'you'
    if (userBar === false) roles.delete('you');
    this.barRoles = roles;
    this.userBarChar = String((barChar != null ? barChar : userBarChar) || '┃');
    this.userBarPad = Math.max(0, (barPad != null ? barPad : userBarPad) | 0);
    // Selection state
    this.selectionEnabled = !!selectionEnabled;
    this.selectionActive = false;
    this.selAnchor = null; // { line, col }
    this.selCursor = null; // { line, col }
    this._colPref = 0;
  }

  setItems(items) {
    // Detect whether we were already viewing the bottom before updating items
    const innerH = Math.max(0, (this._rect.height | 0) - 2);
    const prevTotal = Math.max(0, this._flattenLines(Math.max(1, (this._rect.width | 0) - (this.border === 'none' ? 0 : 4))).length);
    const prevMaxTop = Math.max(0, prevTotal - innerH);
    const wasAtBottom = this.scroll >= prevMaxTop;

    this.items = Array.isArray(items) ? items : [];
    this._capItems();
    // Track new messages if not at bottom
    const itemDelta = Math.max(0, this.items.length - this._lastItemCount);
    if (!this._anchor && !wasAtBottom && itemDelta > 0) this._newCount += itemDelta;
    this._lastItemCount = this.items.length;

    // If we are anchored or were previously at bottom, pin to end after update
    if (this.anchorBottom && (this._anchor || wasAtBottom)) { this.scrollToEnd(); this._newCount = 0; }
  }
  push(item) { this.items.push(item); this._capItems(); this.scrollToEnd(); }
  clear() { this.items.length = 0; this.scroll = 0; }

  scrollToEnd() {
    const innerH = Math.max(0, (this._rect.height | 0) - 2);
    const lines = this._flattenLines(this._rect.width);
    const maxTop = Math.max(0, lines.length - innerH);
    this.scroll = maxTop;
    this._anchor = !!this.anchorBottom;
  }

  handleKey(key) {
    const innerH = Math.max(0, (this._rect.height | 0) - 2);
    const total = Math.max(0, this._flattenLines(this._rect.width).length);
    const maxTop = Math.max(0, total - innerH);
    const page = Math.max(1, innerH - 1);
    // Selection mode toggle and navigation
    if (this.selectionEnabled) {
      if (!this.selectionActive && (key === 'v' || key === 'V')) {
        // Start selection at last visible line end
        const startLine = Math.min(total - 1, Math.max(0, this.scroll + innerH - 1));
        const text = (this._flattenLines(this._rect.width)[startLine] || {}).text || '';
        const col = text.length;
        this.selectionActive = true;
        this.selAnchor = { line: startLine, col };
        this.selCursor = { line: startLine, col };
        this._colPref = col;
        return true;
      }
      if (this.selectionActive) {
        // Exit selection
        if (key === '\u001b') { this.selectionActive = false; this.selAnchor = this.selCursor = null; return true; }
        const moveCol = (line, col, dCol) => ({ line, col: Math.max(0, col + dCol) });
        const lines = this._flattenLines(this._rect.width);
        const lineLen = (ln) => ((lines[ln] && lines[ln].text) ? lines[ln].text.length : 0);
        const clampLine = (ln) => Math.max(0, Math.min(total - 1, ln));
        const setCursor = (ln, c) => { this.selCursor = { line: clampLine(ln), col: Math.max(0, Math.min(c, lineLen(clampLine(ln)))) }; this._colPref = this.selCursor.col; };
        if (key === '\u001b[D') { // Left
          if (this.selCursor.col > 0) setCursor(this.selCursor.line, this.selCursor.col - 1);
          else if (this.selCursor.line > 0) setCursor(this.selCursor.line - 1, lineLen(this.selCursor.line - 1));
          return true;
        }
        if (key === '\u001b[C') { // Right
          if (this.selCursor.col < lineLen(this.selCursor.line)) setCursor(this.selCursor.line, this.selCursor.col + 1);
          else if (this.selCursor.line < total - 1) setCursor(this.selCursor.line + 1, 0);
          return true;
        }
        if (key === '\u001b[A' || key === 'k') { // Up
          const ln = clampLine(this.selCursor.line - 1);
          const col = Math.min(this._colPref, lineLen(ln));
          setCursor(ln, col);
          return true;
        }
        if (key === '\u001b[B' || key === 'j') { // Down
          const ln = clampLine(this.selCursor.line + 1);
          const col = Math.min(this._colPref, lineLen(ln));
          setCursor(ln, col);
          return true;
        }
        if (key === '\u001b[H' || key === 'g') { setCursor(0, 0); return true; } // Home/top
        if (key === '\u001b[F' || key === 'G') { setCursor(total - 1, lineLen(total - 1)); return true; } // End/bottom
        if (key === '\u001b[5~') { // PageUp
          const ln = clampLine(this.selCursor.line - page);
          setCursor(ln, Math.min(this._colPref, lineLen(ln))); return true;
        }
        if (key === '\u001b[6~') { // PageDown
          const ln = clampLine(this.selCursor.line + page);
          setCursor(ln, Math.min(this._colPref, lineLen(ln))); return true;
        }
        // Keep cursor visible by scrolling if needed
        const top = this.scroll, bottom = this.scroll + innerH - 1;
        if (this.selCursor.line < top) this.scroll = this.selCursor.line;
        else if (this.selCursor.line > bottom) this.scroll = Math.min(maxTop, this.selCursor.line - (innerH - 1));
        return true;
      }
    }
    if (key === 'WheelUp') { this.scroll = Math.max(0, this.scroll - 1); this._anchor = false; return true; }
    if (key === 'WheelDown') { this.scroll = Math.min(maxTop, this.scroll + 1); this._anchor = false; return true; }
    if (key === '\u001b[A' || key === 'k') { this.scroll = Math.max(0, this.scroll - 1); this._anchor = false; return true; }
    if (key === '\u001b[B' || key === 'j') { this.scroll = Math.min(maxTop, this.scroll + 1); this._anchor = false; return true; }
    if (key === '\u001b[5~') { this.scroll = Math.max(0, this.scroll - page); this._anchor = false; return true; }
    if (key === '\u001b[6~') { this.scroll = Math.min(maxTop, this.scroll + page); this._anchor = false; return true; }
    if (key === '\u001b[H' || key === 'g') { this.scroll = 0; this._anchor = false; return true; }
    if (key === '\u001b[F' || key === 'G') { this.scroll = maxTop; this._anchor = !!this.anchorBottom; this._newCount = 0; return true; }
    return false;
  }

  paint(screen, { x, y, width, height }) {
    this._rect = { x, y, width, height };
    const t = getTheme();
    const showBorder = this.border !== 'none';
    if (showBorder) {
      Box(screen, { x, y, width, height, title: this.title, style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs, style: (this.style && this.style.style), borderFooter: this.style && this.style.borderFooter, borderFooterAlign: this.style && this.style.borderFooterAlign, borderFooterPosition: this.style && this.style.borderFooterPosition, hintFg: t.hint } });
    }
    const pad = showBorder ? 2 : 0;
    const innerX = x + pad + this.paddingX;
    const innerY = y + (showBorder ? 1 : 0);
    const innerW = Math.max(1, width - pad * 2 - this.paddingX * 2);
    const innerH = height - (showBorder ? 2 : 0);
    const lines = this._flattenLines(innerW);
    const total = lines.length;
    const maxTop = Math.max(0, total - innerH);
    const start = (this.anchorBottom && this._anchor) ? maxTop : Math.max(0, Math.min(this.scroll, maxTop));
    const end = Math.min(total, start + innerH);
    const visibleCount = Math.max(0, end - start);
    const row0 = this.anchorBottom ? (innerY + Math.max(0, innerH - visibleCount)) : innerY;
    // Selection range (flattened line/col)
    let selA = null, selB = null;
    if (this.selectionActive && this.selAnchor && this.selCursor) {
      const a = this.selAnchor, b = this.selCursor;
      if (a.line < b.line || (a.line === b.line && a.col <= b.col)) { selA = a; selB = b; }
      else { selA = b; selB = a; }
    }

    const renderRun = (runText, runStartCol, x0, y0, fg, innerW, selectedRange) => {
      if (!runText) return x0;
      const startX = x0;
      const endCol = runStartCol + runText.length;
      const selStart = selectedRange ? Math.max(runStartCol, selectedRange.start) : Infinity;
      const selEnd = selectedRange ? Math.min(endCol, selectedRange.end) : -Infinity;
      if (!(selStart < selEnd)) {
        Text(screen, { x: x0, y: y0, text: runText, style: { fg, maxWidth: innerW - (x0 - startX) } });
        return x0 + runText.length;
      }
      // pre
      const pre = runText.slice(0, selStart - runStartCol);
      if (pre) { Text(screen, { x: x0, y: y0, text: pre, style: { fg, maxWidth: innerW } }); x0 += pre.length; }
      // selected
      const mid = runText.slice(selStart - runStartCol, selEnd - runStartCol);
      if (mid) { Text(screen, { x: x0, y: y0, text: mid, style: { fg, attrs: 4, maxWidth: innerW } }); x0 += mid.length; }
      // post
      const post = runText.slice(selEnd - runStartCol);
      if (post) { Text(screen, { x: x0, y: y0, text: post, style: { fg, maxWidth: innerW } }); x0 += post.length; }
      return x0;
    };

    for (let row = row0, i = start; i < end; i++, row++) {
      const L = lines[i];
      // Optional timestamp segment in hint color
      let xCol = innerX;
      // Draw optional role bar (for all wrapped lines of the message)
      if (L.bar) {
        const barFg = L.barFg || (this.style && this.style.userBarFg) || getTheme().historyUser || getTheme().border;
        Text(screen, { x: xCol, y: row, text: this.userBarChar, style: { fg: barFg } });
        xCol += this.userBarChar.length + this.userBarPad;
      }
      // Selection range on this line (flattened col space)
      const lineSel = (selA && selB && (i >= selA.line && i <= selB.line)) ? {
        start: (i === selA.line ? selA.col : 0),
        end: (i === selB.line ? selB.col : (L.text || '').length)
      } : null;

      if (L.tsLen && L.tsLen > 0) {
        // Draw timestamp segment in hint color, then the rest
        const tsText = L.text.slice(0, L.tsLen);
        const rest = L.text.slice(L.tsLen);
        const t = getTheme();
        xCol = renderRun(tsText, 0, xCol, row, t.hint, innerW, lineSel && { start: lineSel.start, end: Math.min(lineSel.end, L.tsLen) });
        if (L.senderLen && L.senderLen > 0) {
          const sender = rest.slice(0, L.senderLen);
          const remaining = rest.slice(L.senderLen);
          const senderFg = (this.style && this.style.senderFg) || getTheme().hint;
          xCol = renderRun(sender, L.tsLen, xCol, row, senderFg, innerW, lineSel && { start: Math.max(lineSel.start, L.tsLen), end: Math.min(lineSel.end, L.tsLen + L.senderLen) });
          if (remaining) xCol = renderRun(remaining, L.tsLen + L.senderLen, xCol, row, L.fg, innerW, lineSel && { start: Math.max(lineSel.start, L.tsLen + L.senderLen), end: lineSel.end });
        } else {
          if (rest) xCol = renderRun(rest, L.tsLen, xCol, row, L.fg, innerW, lineSel && { start: Math.max(lineSel.start, L.tsLen), end: lineSel.end });
        }
      } else {
        if (L.senderLen && L.senderLen > 0) {
          const sender = L.text.slice(0, L.senderLen);
          const remaining = L.text.slice(L.senderLen);
          const senderFg = (this.style && this.style.senderFg) || getTheme().hint;
          xCol = renderRun(sender, 0, xCol, row, senderFg, innerW, lineSel && { start: lineSel.start, end: Math.min(lineSel.end, L.senderLen) });
          if (remaining) xCol = renderRun(remaining, L.senderLen, xCol, row, L.fg, innerW, lineSel && { start: Math.max(lineSel.start, L.senderLen), end: lineSel.end });
        } else {
          xCol = renderRun(L.text, 0, xCol, row, L.fg, innerW, lineSel);
        }
      }
    }

    // New messages indicator when scrolled up
    if (!this._anchor && this._newCount > 0 && innerH > 0) {
      const t2 = getTheme();
      const label = `\u21E9 ${this._newCount} new`;
      const lx = innerX + Math.max(0, Math.floor((innerW - label.length) / 2));
      const ly = innerY + innerH - 1;
      Text(screen, { x: lx, y: ly, text: label, style: { fg: t2.hint, attrs: 1, maxWidth: innerW } });
    }
  }

  handleMouse(evt) {
    if (!this.selectionEnabled) return false;
    const { x, y } = this._rect;
    const showBorder = this.border !== 'none';
    const pad = showBorder ? 2 : 0;
    const innerX = x + pad + this.paddingX;
    const innerY = y + (showBorder ? 1 : 0);
    const innerW = Math.max(1, this._rect.width - pad * 2 - this.paddingX * 2);
    const innerH = this._rect.height - (showBorder ? 2 : 0);
    const lines = this._flattenLines(innerW);
    const total = lines.length;
    const lx = evt.x - innerX;
    const ly = evt.y - innerY;
    if (ly < 0 || ly >= innerH) return false;
    const lineIndex = Math.max(0, Math.min(total - 1, this.scroll + ly));
    const line = (lines[lineIndex] && lines[lineIndex].text) || '';
    const col = Math.max(0, Math.min(line.length, lx));
    if (evt.name === 'MouseDown') {
      this.selectionActive = true;
      this.selAnchor = { line: lineIndex, col };
      this.selCursor = { line: lineIndex, col };
      return true;
    }
    if (evt.name === 'MouseUp') {
      if (this.selectionActive) { this.selCursor = { line: lineIndex, col }; return true; }
      return false;
    }
    return false;
  }

  _formatTs(ts) {
    const d = ts ? new Date(ts) : new Date();
    if (this.timestampMode === 'relative') {
      const delta = Date.now() - d.getTime();
      const sec = Math.max(0, Math.floor(delta / 1000));
      if (sec < 60) return `${sec}s`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h`;
      const day = Math.floor(hr / 24);
      return `${day}d`;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    if (this.timestampMode === 'datetime') {
      const yyyy = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return this.showSeconds ? `${yyyy}-${mo}-${dd} ${hh}:${mm}:${ss}` : `${yyyy}-${mo}-${dd} ${hh}:${mm}`;
    }
    return this.showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  }

  _capItems() {
    if (this.maxItems > 0 && this.items.length > this.maxItems) {
      const drop = this.items.length - this.maxItems;
      this.items.splice(0, drop);
      this.scroll = Math.max(0, this.scroll - drop); // keep bottom aligned roughly
    }
  }

  _flattenLines(totalWidth) {
    const t = getTheme();
    const innerW = Math.max(1, (totalWidth | 0));
    const out = [];
    for (const m of this.items) {
      const role = (m && m.who) || 'you';
      const fg = role === 'assistant' ? t.historyAssistant : role === 'status' ? t.historyStatus : t.historyUser;
      const ts = this.showTimestamps ? this._formatTs(m.ts) + ' ' : '';
      const wantBar = (typeof m?.bar === 'boolean') ? !!m.bar : this.barRoles.has(role);
      const sender = this.showSender ? (this.senderFormat(role) + ': ') : '';
      const full = ts + sender + (m.text || '');
      const wrapped = wrapToWidth(full, innerW);
      for (let i = 0; i < wrapped.length; i++) {
        const line = wrapped[i];
        const tsLen = (i === 0) ? ts.length : 0;
        const senderLen = (i === 0) ? sender.length : 0;
        // Resolve bar color: per-item override, style per-role, theme fallback
        const styleBar = (this.style && (this.style.barFgByRole?.[role] || (role==='you'?this.style.userBarFg: this.style[role+'BarFg']))) || null;
        const fallback = role === 'assistant' ? t.historyAssistant : role === 'status' ? t.historyStatus : (t.historyUser || t.border);
        const barFg = (m && (m.barFg || m.userBarFg)) || styleBar || fallback;
        out.push({ text: line, fg, tsLen, senderLen, bar: wantBar, barFg });
      }
      // insert visual gap between messages to improve readability
      for (let g = 0; g < this.itemGap; g++) out.push({ text: '', fg, tsLen: 0, userBar: false });
    }
    return out;
  }
}

module.exports = { HistoryView };
