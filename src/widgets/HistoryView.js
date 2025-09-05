const { Text } = require('./Text');
const { Box } = require('./Box');
const { getTheme } = require('../theme/theme');
const { wrapToWidth, measureWidth } = require('../util/wrap');

// HistoryView: scrollable message list with optional timestamps and role styling.
// Items: { who: 'you'|'assistant'|'status'|string, text: string, ts?: number }
class HistoryView {
  constructor({ items = [], showTimestamps = false, title = 'History', style = {}, maxItems = 1000, timestampMode = 'time', showSeconds = false } = {}) {
    this.items = Array.isArray(items) ? items : [];
    this.showTimestamps = !!showTimestamps;
    this.title = title;
    this.scroll = 0; // topmost visible line index (after wrap)
    this.style = style || {};
    this._rect = { x: 0, y: 0, width: 0, height: 0 };
    this.maxItems = maxItems | 0;
    this.timestampMode = timestampMode; // 'time' | 'datetime' | 'relative'
    this.showSeconds = !!showSeconds;
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
    Box(screen, { x, y, width, height, title: this.title, style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
    const innerX = x + 2, innerY = y + 1, innerW = width - 4, innerH = height - 2;
    const lines = this._flattenLines(width);
    const start = Math.max(0, Math.min(lines.length, this.scroll));
    const end = Math.min(lines.length, start + innerH);
    for (let row = innerY, i = start; i < end; i++, row++) {
      const L = lines[i];
      if (L.tsLen && L.tsLen > 0) {
        // Draw timestamp segment in hint color, then the rest
        const tsText = L.text.slice(0, L.tsLen);
        const rest = L.text.slice(L.tsLen);
        const t = getTheme();
        Text(screen, { x: innerX, y: row, text: tsText, style: { fg: t.hint, maxWidth: innerW } });
        if (rest) Text(screen, { x: innerX + tsText.length, y: row, text: rest, style: { fg: L.fg, maxWidth: innerW - tsText.length } });
      } else {
        Text(screen, { x: innerX, y: row, text: L.text, style: { fg: L.fg, maxWidth: innerW } });
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
    const innerW = Math.max(1, (totalWidth | 0) - 4);
    const out = [];
    for (const m of this.items) {
      const role = (m && m.who) || 'you';
      const fg = role === 'assistant' ? t.historyAssistant : role === 'status' ? t.historyStatus : t.historyUser;
      const ts = this.showTimestamps ? this._formatTs(m.ts) + ' ' : '';
      const whoPrefix = (role === 'status') ? '' : (role + ': ');
      const prefix = ts + whoPrefix;
      const full = prefix + (m.text || '');
      const wrapped = wrapToWidth(full, innerW);
      const pad = ' '.repeat(prefix.length);
      for (let i = 0; i < wrapped.length; i++) {
        const line = (i === 0) ? wrapped[i] : (wrapped[i].length >= prefix.length ? pad + wrapped[i].slice(prefix.length) : wrapped[i]);
        const tsLen = (i === 0) ? ts.length : 0;
        out.push({ text: line, fg, tsLen });
      }
    }
    return out;
  }
}

module.exports = { HistoryView };
