const { Box } = require('./Box');
const { Text } = require('./Text');
const { getTheme } = require('../theme/theme');

class PopupOverlay {
  constructor({ title = 'Help', body = '', footer = 'Arrows/PgUp/PgDn/Home/End, j/k; Esc or q to close', width = 40, height = 12, style = {}, border = 'box', backdrop = false } = {}) {
    this.title = title;
    this.footer = footer;
    this.width = width;
    this.height = height;
    this.border = border; // 'box' | 'none'
    const t = getTheme();
    this.style = Object.assign({
      borderFg: t.border,
      titleFg: t.title,
      titleAttrs: t.titleAttrs,
      fg: t.fg,
      hintFg: t.hint,
    }, style);
    this.scroll = 0;
    this.backdrop = !!backdrop; // default: no full-screen backdrop; keep background visible
    this._rawBody = String(body || '');
    this._lines = [];
    this._wrapBody();
  }

  _wrapBody() {
    // simple greedy wrap by spaces to width-4 (inside border padding 2)
    const innerW = Math.max(1, this.width - 4);
    const lines = [];
    const rawLines = this._rawBody.split('\n');
    for (const rl of rawLines) {
      const words = rl.split(/(\s+)/); // keep spaces groups
      let line = '';
      for (const w of words) {
        if (line.length + w.length > innerW) {
          if (line.length) { lines.push(line); line = ''; }
          if (w.trim() === '') continue;
          // If single word longer than innerW, hard split
          for (let i = 0; i < w.length; i += innerW) lines.push(w.slice(i, i + innerW));
        } else {
          line += w;
        }
      }
      if (line.length) lines.push(line);
      if (rl.length === 0) lines.push('');
    }
    this._lines = lines;
  }

  handleKey(key) {
    const page = Math.max(1, this.height - 5); // title + footer + padding
    if (key === '\u001b' || key === 'q') { // Esc or q
      this._requestClose && this._requestClose();
      return true;
    }
    if (key === '\u001b[A' || key === 'k') { // Up
      this.scroll = Math.max(0, this.scroll - 1); return true;
    }
    if (key === '\u001b[B' || key === 'j') { // Down
      this.scroll = Math.min(this._maxScroll(), this.scroll + 1); return true;
    }
    if (key === '\u001b[5~') { // PgUp
      this.scroll = Math.max(0, this.scroll - page); return true;
    }
    if (key === '\u001b[6~') { // PgDn
      this.scroll = Math.min(this._maxScroll(), this.scroll + page); return true;
    }
    if (key === '\u001b[H') { // Home
      this.scroll = 0; return true;
    }
    if (key === '\u001b[F') { // End
      this.scroll = this._maxScroll(); return true;
    }
    return true; // consume all keys while open
  }

  _maxScroll() {
    const innerH = Math.max(0, this.height - 4); // minus top/bottom borders
    return Math.max(0, this._lines.length - innerH);
  }

  onRequestClose(fn) { this._requestClose = fn; }

  paint(screen) {
    const { width: W, height: H } = screen.size();
    const w = Math.min(this.width, W - 2);
    const h = Math.min(this.height, H - 2);
    const x = Math.max(0, Math.floor((W - w) / 2));
    const y = Math.max(0, Math.floor((H - h) / 2));
    const t = getTheme();
    const showBorder = this.border !== 'none';
    if (showBorder) {
      Box(screen, { x, y, width: w, height: h, title: this.title, style: { borderFg: this.style.borderFg, borderAttrs: t.borderAttrs, titleFg: this.style.titleFg, titleAttrs: this.style.titleAttrs } });
    }

    // Fill interior to fully cover underlying content (dim shading)
    const innerLeft = showBorder ? (x + 1) : x;
    const innerRight = showBorder ? (x + w - 2) : (x + w - 1);
    const topInner = showBorder ? (y + 1) : y;
    const bottomInner = showBorder ? (y + h - 2) : (y + h - 1);
    for (let yy = topInner; yy <= bottomInner; yy++) {
      for (let xx = innerLeft; xx <= innerRight; xx++) {
        screen.setCell(xx, yy, ' ', null, null, 2); // dim spaces
      }
    }

    // body
    const padX = showBorder ? 2 : 1;
    const padTop = showBorder ? 1 : 0;
    const padBottom = showBorder ? 1 : 0;
    const innerX = x + padX;
    const bodyTop = y + padTop; // first row inside
    const innerW = w - padX * 2;
    const footerY = y + h - 1 - padBottom; // last row inside
    const bodyHeight = Math.max(0, footerY - bodyTop); // rows available for body

    // clamp scroll
    const maxScroll = Math.max(0, this._lines.length - bodyHeight);
    this.scroll = Math.max(0, Math.min(this.scroll, maxScroll));
    for (let i = 0; i < bodyHeight; i++) {
      const src = this._lines[this.scroll + i] || '';
      Text(screen, { x: innerX, y: bodyTop + i, text: src, style: { fg: this.style.fg, maxWidth: innerW } });
    }

    // footer
    const hint = this.footer;
    const hintTrim = hint.length > innerW ? hint.slice(0, innerW) : hint;
    const startX = x + Math.floor((w - hintTrim.length) / 2);
    Text(screen, { x: startX, y: footerY, text: hintTrim, style: { fg: this.style.hintFg, maxWidth: innerW } });

    // If borderless, draw a title on the first line inside
    if (!showBorder && this.title) {
      const title = ` ${this.title} `;
      const max = Math.min(title.length, innerW);
      for (let i = 0; i < max; i++) {
        screen.setCell(innerX + i, bodyTop, title[i], this.style.titleFg, null, this.style.titleAttrs);
      }
    }
  }

  paintBackdrop(screen) {
    if (!this.backdrop) return;
    const { width: W, height: H } = screen.size();
    // Fill entire screen with dim spaces so underlying content is visually masked
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) screen.setCell(x, y, ' ', null, null, 2);
    }
  }
}

module.exports = { PopupOverlay };
