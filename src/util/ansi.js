// ANSI helpers for cursor movement and SGR styling

const CSI = '\u001b[';

function moveTo(row, col) {
  return `${CSI}${row};${col}H`;
}

function hideCursor() {
  return `${CSI}?25l`;
}

function showCursor() {
  return `${CSI}?25h`;
}

function sgr(fg = null, bg = null, attrs = 0) {
  const parts = ['0'];
  if (attrs & 1) parts.push('1'); // bold
  if (attrs & 2) parts.push('2'); // dim
  if (attrs & 8) parts.push('3'); // italic
  if (attrs & 4) parts.push('7'); // invert
  if (fg && typeof fg === 'object' && fg.r != null) parts.push(`38;2;${fg.r};${fg.g};${fg.b}`);
  if (bg && typeof bg === 'object' && bg.r != null) parts.push(`48;2;${bg.r};${bg.g};${bg.b}`);
  return `${CSI}${parts.join(';')}m`;
}

const ansi = { moveTo, hideCursor, showCursor, sgr };
module.exports = { ansi };
