const { ProgressBar } = require('../widgets/ProgressBar');

function Progress(label = '') {
  const bar = new ProgressBar({ label });
  return {
    value(v, max) { bar.set(v, max == null ? bar.cfg.max : max); return this; },
    solid() { bar.cfg.charset = 'solid'; return this; },
    blocks() { bar.cfg.charset = 'blocks'; return this; },
    width(w) { bar.cfg.width = w; return this; },
    counts(show = true) { bar.cfg.showCounts = !!show; return this; },
    style(s) { Object.assign(bar.cfg.style, s || {}); return this; },
    draw(screen, rect) { bar.cfg.x = rect.x; bar.cfg.y = rect.y; bar.cfg.width = rect.width || bar.cfg.width; bar.paint(screen); },
    instance() { return bar; },
  };
}

module.exports = { Progress };

