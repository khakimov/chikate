const { Text } = require('./Text');
const { getTheme } = require('../theme/theme');

class ThinkingIndicator {
  constructor({
    text = 'Thinking',
    frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'],
    interval = 80,
    style = {},
    animateColors = true,
    palette = null, // array of {r,g,b}
    waveSpeed = 0.004, // phase per ms
    waveWidth = 4 // chars per color step
  } = {}) {
    this.open = false;
    this.text = text;
    this.frames = frames;
    this.interval = interval;
    const t = getTheme();
    this.style = Object.assign({ fg: t.statusThinking }, style);
    this.animateColors = !!animateColors;
    // pleasant cool palette by default
    this.palette = Array.isArray(palette) && palette.length > 0 ? palette : [
      { r: 120, g: 200, b: 255 }, // sky
      { r: 170, g: 160, b: 255 }, // periwinkle
      { r: 210, g: 150, b: 255 }, // lilac
      { r: 160, g: 220, b: 200 }, // mint
      { r: 120, g: 200, b: 255 }  // loop
    ];
    this.waveSpeed = waveSpeed;
    this.waveWidth = Math.max(1, waveWidth | 0);
    this._startTime = Date.now();
    this._stopped = false;
  }

  setOpen(v) { this.open = !!v; }
  toggle() { this.open = !this.open; }
  stop() { this._stopped = true; }
  start() { this._stopped = false; this._startTime = Date.now(); }

  paint(screen, { x, y, width }) {
    if (!this.open) return;
    const now = Date.now();
    const idx = this._stopped ? 0 : Math.floor(((now - this._startTime) / this.interval)) % this.frames.length;
    const spinner = this.frames[idx];
    const msg = `[${this.text}${this._stopped ? '' : '…'}] ${spinner}`;
    const t = getTheme();
    const useColors = !!t.statusUseColors;
    const line = msg.slice(0, Math.max(0, Math.min(width | 0, msg.length)));

    if (!useColors) {
      // Legacy attribute-first style: dim single-color line
      Text(screen, { x, y, text: line, style: { fg: t.fg, attrs: 2, maxWidth: width } });
      return;
    }

    if (!this.animateColors) {
      const fg = this.style.fg || t.fg;
      Text(screen, { x, y, text: line, style: { fg, attrs: 0, maxWidth: width } });
      return;
    }

    // Animated wave across characters
    const phase = (now - this._startTime) * this.waveSpeed;
    const n = this.palette.length;
    for (let i = 0; i < line.length && i < width; i++) {
      const p = Math.floor((i + phase) / this.waveWidth) % n;
      const fg = this.palette[(p + n) % n];
      screen.setCell(x + i, y, line[i], fg, null, 0);
    }
  }
}

module.exports = { ThinkingIndicator };
