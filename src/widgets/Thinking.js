const { Text } = require('./Text');
const { getTheme } = require('../theme/theme');

class ThinkingIndicator {
  constructor({ text = 'Thinking', frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'], interval = 80, style = {} } = {}) {
    this.open = false;
    this.text = text;
    this.frames = frames;
    this.interval = interval;
    const t = getTheme();
    this.style = Object.assign({ fg: t.statusThinking }, style);
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
    const line = msg.length > width ? msg.slice(0, width) : msg;
    const t = getTheme();
    const useColors = !!t.statusUseColors && this.style.fg;
    const fg = useColors ? this.style.fg : t.fg;
    const attrs = useColors ? 0 : 2; // dim in legacy
    Text(screen, { x, y, text: line, style: { fg, attrs, maxWidth: width } });
  }
}

module.exports = { ThinkingIndicator };
