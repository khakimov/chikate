function renderProgressLine({ label = '', value = 0, max = 100, width = 20, charset = 'blocks' } = {}) {
  const clampedMax = Math.max(1, Math.floor(max));
  const clampedVal = Math.max(0, Math.min(clampedMax, Math.floor(value)));
  const interior = Math.max(1, width);
  const filled = Math.round((clampedVal / clampedMax) * interior);
  const block = charset === 'solid' ? '█' : '█';
  const empty = charset === 'solid' ? ' ' : ' ';
  const bar = '[' + block.repeat(filled).padEnd(interior, empty) + ']';
  const prefix = label ? `${label} ` : '';
  return `${prefix}${bar} ${clampedVal}/${clampedMax}`;
}

module.exports = { renderProgressLine };

