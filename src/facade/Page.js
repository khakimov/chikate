const { layoutColumn } = require('../layout/Column');
const { layoutRow } = require('../layout/Row');

class Page {
  constructor(screen) {
    this.screen = screen;
    const { width = 80, height = 24 } = screen ? screen.size() : {};
    this._rect = { x: 0, y: 0, width, height };
    this._margin = { top: 0, right: 0, bottom: 0, left: 0 };
  }

  static full(screen) { return new Page(screen).full(); }

  full() { return this.size('100%', '100%'); }

  at(x, y) { this._rect.x = x | 0; this._rect.y = y | 0; return this; }

  size(w, h) {
    const { width: W = 80, height: H = 24 } = this.screen ? this.screen.size() : {};
    this._rect.width = typeof w === 'string' && w.endsWith('%') ? Math.floor(W * parseInt(w, 10) / 100) : (w | 0);
    this._rect.height = typeof h === 'string' && h.endsWith('%') ? Math.floor(H * parseInt(h, 10) / 100) : (h | 0);
    return this;
  }

  margin(allOrObj) {
    if (typeof allOrObj === 'number') {
      this._margin = { top: allOrObj, right: allOrObj, bottom: allOrObj, left: allOrObj };
    } else {
      const m = allOrObj || {};
      this._margin = {
        top: m.top | 0, right: m.right | 0, bottom: m.bottom | 0, left: m.left | 0
      };
    }
    return this;
  }

  bounds() {
    const { x, y, width, height } = this._rect;
    const { top, right, bottom, left } = this._margin;
    return { x: x + left, y: y + top, width: Math.max(0, width - left - right), height: Math.max(0, height - top - bottom) };
  }

  column(gap = 0) {
    const self = this;
    return {
      add(...children) {
        const b = self.bounds();
        return layoutColumn({ x: b.x, y: b.y, width: b.width, height: b.height, gap, children });
      }
    };
  }

  row(gap = 0) {
    const self = this;
    return {
      add(...children) {
        const b = self.bounds();
        return layoutRow({ x: b.x, y: b.y, width: b.width, height: b.height, gap, children });
      }
    };
  }
}

module.exports = { Page };

