const { Text } = require('./Text');
const { Box } = require('./Box');
const { getTheme } = require('../theme/theme');
const { wrapToWidth, measureWidth } = require('../util/wrap');

// HistoryView: scrollable message list with optional timestamps and role styling.
// Items: { who: 'you'|'assistant'|'status'|string, text: string, ts?: number }
class HistoryView {
  constructor({ items = [], showTimestamps = false, title = 'History', style = {}, maxItems = 1000, timestampMode = 'time', showSeconds = false, border = 'box', anchorBottom = false, itemGap = 1 } = {}) {
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
  }

  setItems(items) {
    this.items = Array.isArray(items) ? items : [];
    this._capItems();
  }
  push(item) { this.items.push(item); this._capItems(); this.scrollToEnd(); }
  clear() { this.items.length = 0; this.scroll = 0; }

  scrollToEnd() {
    const innerH = Math.max(0, (this._rect.height | 0) - 2);
    const lines = this._flattenLines(this._rect.width);
    const maxTop = Math.max(0, lines.length - innerH);
    this.scroll = maxTop;
  }

  handleKey(key) {
    const innerH = Math.max(0, (this._rect.height | 0) - 2);
    const total = Math.max(0, this._flattenLines(this._rect.width).length);
    const maxTop = Math.max(0, total - innerH);
    const page = Math.max(1, innerH - 1);
    if (key === '\u001b[A' || key === 'k') { this.scroll = Math.max(0, this.scroll - 1); return true; }
    if (key === '\u001b[B' || key === 'j') { this.scroll = Math.min(maxTop, this.scroll + 1); return true; }
    if (key === '\u001b[5~') { this.scroll = Math.max(0, this.scroll - page); return true; }
    if (key === '\u001b[6~') { this.scroll = Math.min(maxTop, this.scroll + page); return true; }
    if (key === '\u001b[H' || key === 'g') { this.scroll = 0; return true; }
    if (key === '\u001b[F' || key === 'G') { this.scroll = maxTop; return true; }
    return false;
  }

  paint(screen, { x, y, width, height }) {
    this._rect = { x, y, width, height };
    const t = getTheme();
    const showBorder = this.border !== 'none';
    if (showBorder) {
      Box(screen, { x, y, width, height, title: this.title, style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
    }
    const pad = showBorder ? 2 : 0;
    const innerX = x + pad, innerY = y + (showBorder ? 1 : 0), innerW = width - pad * 2, innerH = height - (showBorder ? 2 : 0);
    const lines = this._flattenLines(innerW);
    const total = lines.length;
    const start = this.anchorBottom ? Math.max(0, total - innerH) : Math.max(0, Math.min(total, this.scroll));
    const end = Math.min(total, start + innerH);
    const visibleCount = Math.max(0, end - start);
    const row0 = this.anchorBottom ? (innerY + Math.max(0, innerH - visibleCount)) : innerY;
    for (let row = row0, i = start; i < end; i++, row++) {
      const L = lines[i];
      // Optional timestamp segment in hint color
      let xCol = innerX;
      if (L.tsLen && L.tsLen > 0) {
        // Draw timestamp segment in hint color, then the rest
        const tsText = L.text.slice(0, L.tsLen);
        const rest = L.text.slice(L.tsLen);
        const t = getTheme();
        Text(screen, { x: xCol, y: row, text: tsText, style: { fg: t.hint, maxWidth: innerW } });
        xCol += tsText.length;
        if (rest) Text(screen, { x: xCol, y: row, text: rest, style: { fg: L.fg, maxWidth: innerW - (xCol - innerX) } });
      } else {
        // Draw optional user bar on first wrapped line of user messages
        if (L.userBar) {
          Text(screen, { x: xCol, y: row, text: '|', style: { fg: t.historyUser } });
          xCol += 2; // bar + space
        }
        Text(screen, { x: xCol, y: row, text: L.text, style: { fg: L.fg, maxWidth: innerW - (xCol - innerX) } });
      }
    }
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
      const userBar = role === 'you';
      const full = ts + (m.text || '');
      const wrapped = wrapToWidth(full, innerW);
      for (let i = 0; i < wrapped.length; i++) {
        const line = wrapped[i];
        const tsLen = (i === 0) ? ts.length : 0;
        out.push({ text: line, fg, tsLen, userBar: userBar && i === 0 });
      }
      // insert visual gap between messages to improve readability
      for (let g = 0; g < this.itemGap; g++) out.push({ text: '', fg, tsLen: 0, userBar: false });
    }
    return out;
  }
}

module.exports = { HistoryView };
