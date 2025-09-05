// Border drawing helpers

function drawBorder(screen, x, y, w, h, { title, style = {} } = {}) {
  if (w < 2 || h < 2) return;
  const fg = style.borderFg || null;
  const bg = style.bg || null;
  const attrs = (style.attrs != null ? style.attrs : (style.borderAttrs != null ? style.borderAttrs : 0));
  if (style.style === 'none') return; // no border
  const heavy = { h: '━', v: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' };
  const single = { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' };
  const double = { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' };
  const rounded = { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' };
  const styleName = style.style || 'single';
  const chars = styleName === 'double' ? double : styleName === 'heavy' ? heavy : styleName === 'rounded' ? rounded : single;

  // Corners
  screen.setCell(x, y, chars.tl, fg, bg, attrs);
  screen.setCell(x + w - 1, y, chars.tr, fg, bg, attrs);
  screen.setCell(x, y + h - 1, chars.bl, fg, bg, attrs);
  screen.setCell(x + w - 1, y + h - 1, chars.br, fg, bg, attrs);
  // Edges
  for (let i = 1; i < w - 1; i++) {
    screen.setCell(x + i, y, chars.h, fg, bg, attrs);
    screen.setCell(x + i, y + h - 1, chars.h, fg, bg, attrs);
  }
  for (let j = 1; j < h - 1; j++) {
    screen.setCell(x, y + j, chars.v, fg, bg, attrs);
    screen.setCell(x + w - 1, y + j, chars.v, fg, bg, attrs);
  }

  // Title (optional)
  if (title && w > 4) {
    const label = ` ${title} `;
    const max = Math.min(label.length, w - 4);
    const titleAttrs = (style.titleAttrs != null) ? style.titleAttrs : attrs;
    const align = style.titleAlign || 'left';
    let startX = x + 2;
    if (align === 'center') startX = x + Math.max(2, Math.floor((w - max) / 2));
    else if (align === 'right') startX = x + Math.max(2, w - 2 - max);
    for (let i = 0; i < max; i++) {
      screen.setCell(startX + i, y, label[i], style.titleFg || fg, bg, titleAttrs);
    }
  }
}

module.exports = { drawBorder };
