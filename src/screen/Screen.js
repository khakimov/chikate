// Minimal screen buffer with per-line diff rendering and optional headless mode
const { ansi } = require('../util/ansi');

class Screen {
  constructor(opts = {}) {
    const { stream = process.stdout, headless = false, width, height } = opts;
    this.stream = stream;
    this.headless = headless;
    this._width = width || (stream && stream.columns) || 80;
    this._height = height || (stream && stream.rows) || 24;
    this._default = { ch: ' ', fg: null, bg: null, attrs: 0 };
    const size = this._width * this._height;
    this.prev = new Array(size);
    this.curr = new Array(size);
    for (let i = 0; i < size; i++) this.prev[i] = this._default;
    this.clear();
    this._hiddenCursor = false;
    this._cursorShown = false;
    this._lastCursor = null;
    this._headlessFrame = '';
  }

  size() {
    return { width: this._width, height: this._height };
  }

  resize(width, height) {
    if (width === this._width && height === this._height) return;
    this._width = width; this._height = height;
    const size = width * height;
    this.prev = new Array(size).fill(this._default);
    this.curr = new Array(size).fill(this._default);
    this._lastCursor = null;
    // Clear the terminal to avoid stale artifacts when the size changes
    if (!this.headless) {
      this._write(ansi.hideCursor());
      this._write('\u001b[2J'); // clear screen
      this._write(ansi.moveTo(1, 1));
    }
  }

  index(x, y) {
    if (x < 0 || y < 0 || x >= this._width || y >= this._height) return -1;
    return y * this._width + x;
  }

  clear() {
    const size = this._width * this._height;
    for (let i = 0; i < size; i++) this.curr[i] = this._default;
  }

  beginFrame() {
    // prepare a new frame buffer
    this.clear();
    this._headlessFrame = '';
  }

  setCell(x, y, ch, fg = null, bg = null, attrs = 0) {
    const idx = this.index(x, y);
    if (idx < 0) return;
    // Normalize char to single cell
    const c = (ch && typeof ch === 'string') ? ch[0] : ' ';
    this.curr[idx] = { ch: c, fg, bg, attrs };
  }

  writeText(x, y, text, style = {}) {
    if (!text) return;
    const { fg = null, bg = null, attrs = 0, maxWidth = this._width - x } = style;
    const n = Math.min(maxWidth, text.length, this._width - x);
    for (let i = 0; i < n; i++) this.setCell(x + i, y, text[i], fg, bg, attrs);
  }

  endFrame({ cursor, showCursor = false } = {}) {
    // Emit diffs per line, minimizing cursor hide/show toggles to avoid flicker.
    const out = [];
    const w = this._width, h = this._height;
    let sgrState = { fg: null, bg: null, attrs: 0 };

    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        const idx = y * w + x;
        const a = this.prev[idx];
        const b = this.curr[idx];
        if (a === b || (a.ch === b.ch && a.fg === b.fg && a.bg === b.bg && a.attrs === b.attrs)) {
          x++;
          continue;
        }
        // start of a run
        let run = '';
        // move cursor to (x,y)
        run += ansi.moveTo(y + 1, x + 1);
        // compute style change
        if (b.fg !== sgrState.fg || b.bg !== sgrState.bg || b.attrs !== sgrState.attrs) {
          run += ansi.sgr(b.fg, b.bg, b.attrs);
          sgrState = { ...b };
        }
        // collect characters for this run until either style changes or equals prev again
        let xx = x;
        while (xx < w) {
          const i2 = y * w + xx;
          const p = this.prev[i2];
          const c = this.curr[i2];
          if (!(p === c || (p.ch === c.ch && p.fg === c.fg && p.bg === c.bg && p.attrs === c.attrs))) {
            if (c.fg !== sgrState.fg || c.bg !== sgrState.bg || c.attrs !== sgrState.attrs) {
              break; // style boundary -> end run here
            }
            run += c.ch;
            this.prev[i2] = c; // advance prev mirror
            xx++;
            continue;
          }
          break; // matches prev -> stop run
        }
        // write run
        out.push(run);
        x = xx;
      }
    }

    // cursor placement
    const wantCursor = cursor && Number.isInteger(cursor.x) && Number.isInteger(cursor.y) ? { x: cursor.x, y: cursor.y } : null;
    if (wantCursor) out.push(ansi.moveTo(wantCursor.y + 1, wantCursor.x + 1));

    const willWrite = out.length > 0;

    // Early-out if absolutely nothing to change: no diffs, cursor unchanged, visibility unchanged
    if (!this.headless && !willWrite) {
      const sameCursor = (!wantCursor && !this._lastCursor) || (wantCursor && this._lastCursor && wantCursor.x === this._lastCursor.x && wantCursor.y === this._lastCursor.y);
      if (sameCursor && this._cursorShown === !!showCursor) return;
    }

    const payload = out.join('');
    if (this.headless) {
      this._headlessFrame = payload;
      this._lastCursor = wantCursor;
      this._cursorShown = !!showCursor;
      return;
    }

    // Only hide cursor if we will write content or visibility is turning off
    if (willWrite || (this._cursorShown && !showCursor)) this._write(ansi.hideCursor());
    if (payload) this._write(payload);
    if (showCursor) this._write(ansi.showCursor());
    this._lastCursor = wantCursor;
    this._cursorShown = !!showCursor;
  }

  toString() {
    // String snapshot of current buffer as plain text (no colors)
    const { _width: w, _height: h } = this;
    let s = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) s += this.curr[y * w + x].ch;
      if (y < h - 1) s += '\n';
    }
    return s;
  }

  _write(s) {
    if (!s) return;
    this.stream.write(s);
  }
}

module.exports = { Screen };
