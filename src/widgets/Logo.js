const { Text } = require('./Text');

// Simple animated color wave logo. Draws a label with a moving gradient.
class Logo {
  constructor({ text = 'CHIKATE', style = {} } = {}) {
    this.text = text;
    this.visible = true;
    this.style = style;
    this._t0 = Date.now();
  }

  setVisible(v) { this.visible = !!v; }

  paint(screen, { x, y, width }) {
    if (!this.visible) return;
    const now = Date.now();
    const t = (now - this._t0) / 1000;
    const label = ` ${this.text} `;
    const padding = Math.max(0, Math.floor((width - label.length) / 2));
    const line = ' '.repeat(padding) + label + ' '.repeat(Math.max(0, width - padding - label.length));
    // draw gradient by per-char fg color
    for (let i = 0; i < Math.min(line.length, width); i++) {
      const phase = (i / Math.max(1, width)) * Math.PI * 2 + t * 2.0;
      const r = Math.floor(120 + 80 * Math.sin(phase));
      const g = Math.floor(120 + 80 * Math.sin(phase + 2.0));
      const b = Math.floor(120 + 80 * Math.sin(phase + 4.0));
      screen.setCell(x + i, y, line[i], { r, g, b }, null, 0);
    }
  }
}

module.exports = { Logo };
