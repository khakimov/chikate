const { Text } = require('./Text');
const { getTheme } = require('../theme/theme');

// Simple horizontal progress bar: [████░░░░] 3/5 or with solid fill block
// Config:
// - x, y, width: total width including brackets and interior
// - value, max: numeric progress; value clamped [0, max]
// - label: optional text shown before the bar (e.g., "Update plan ")
// - showCounts: if true, prints "v/max" after the bar
// - charset: 'blocks' | 'solid' — blocks uses U+2588; solid paints spaces with bg color
// - style: { fg, bg, barFg, barBg, bracketFg, labelFg, countFg }
class ProgressBar {
  constructor(cfg = {}) {
    const t = getTheme();
    this.cfg = Object.assign({
      x: 0,
      y: 0,
      width: 30,
      value: 0,
      max: 100,
      label: '',
      showCounts: true,
      charset: 'solid',
      style: {
        fg: t.fg,
        bg: null,
        barFg: t.fg,
        barBg: { r: 180, g: 190, b: 100 }, // soft olive similar to screenshot
        bracketFg: t.fg,
        labelFg: t.fg,
        countFg: t.fg,
      },
    }, cfg);
  }

  set(value, max = this.cfg.max) {
    this.cfg.value = value;
    this.cfg.max = max;
  }

  paint(screen) {
    const { x, y, width, value, max, label, showCounts, charset, style } = this.cfg;
    let cursorX = x;

    // Optional label
    if (label) {
      const text = String(label);
      Text(screen, { x: cursorX, y, text, style: { fg: style.labelFg } });
      cursorX += text.length;
      if (cursorX < x + width) screen.setCell(cursorX++, y, ' ', style.fg, null, 0);
    }

    const remaining = Math.max(0, x + width - cursorX);
    if (remaining < 4) return; // need at least [] and 1 interior

    // Bar geometry: [ <interior> ]
    const barLeftX = cursorX;
    const barRightX = x + width - 1; // inclusive index of last cell we can touch
    const open = '[';
    const close = ']';
    screen.setCell(barLeftX, y, open, style.bracketFg, null, 0);
    screen.setCell(barRightX, y, close, style.bracketFg, null, 0);

    const interiorStart = barLeftX + 1;
    const interiorEnd = barRightX - 1;
    const interiorW = Math.max(1, interiorEnd - interiorStart + 1);

    const clampedMax = Math.max(1, Math.floor(max));
    const clampedVal = Math.max(0, Math.min(clampedMax, Math.floor(value)));
    const filled = Math.round((clampedVal / clampedMax) * interiorW);

    if (charset === 'blocks') {
      const fillCh = '█';
      const emptyCh = ' ';
      for (let i = 0; i < interiorW; i++) {
        const ch = i < filled ? fillCh : emptyCh;
        const bg = i < filled ? null : null;
        const fg = i < filled ? style.barFg : style.fg;
        screen.setCell(interiorStart + i, y, ch, fg, bg, 0);
      }
    } else {
      // solid background fill style: paint spaces with barBg behind
      for (let i = 0; i < interiorW; i++) {
        const bg = i < filled ? style.barBg : null;
        screen.setCell(interiorStart + i, y, ' ', null, bg, 0);
      }
    }

    // Counts after the bar
    if (showCounts) {
      const counts = ` ${clampedVal}/${clampedMax}`;
      Text(screen, { x: barRightX + 1, y, text: counts, style: { fg: style.countFg } });
    }
  }
}

module.exports = { ProgressBar };

