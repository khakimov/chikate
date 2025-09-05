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

  // Footer label embedded in border (optional)
  if (style.borderFooter && w > 4) {
    const footer = String(style.borderFooter);
    const pos = style.borderFooterPosition === 'top' ? 'top' : 'bottom';
    const align = style.borderFooterAlign || 'center';
    const yy = pos === 'top' ? y : (y + h - 1);
    // Redraw the selected border line to ensure a continuous baseline
    const leftCh = (pos === 'top') ? chars.tl : chars.bl;
    const rightCh = (pos === 'top') ? chars.tr : chars.br;
    screen.setCell(x, yy, leftCh, fg, bg, attrs);
    for (let i = 1; i < w - 1; i++) screen.setCell(x + i, yy, chars.h, fg, bg, attrs);
    screen.setCell(x + w - 1, yy, rightCh, fg, bg, attrs);
    // Compose label flanked by dashes
    const label = `${chars.h} ${footer} ${chars.h}`;
    const innerLeft = x + 1, innerRight = x + w - 2;
    const interior = Math.max(0, innerRight - innerLeft + 1);
    const draw = label.slice(0, interior);
    let sx = innerLeft;
    if (align === 'center') sx = innerLeft + Math.max(0, Math.floor((interior - draw.length) / 2));
    else if (align === 'right') sx = innerRight - (draw.length - 1);
    for (let i = 0; i < draw.length; i++) {
      const ch = draw[i];
      const isDash = (ch === chars.h);
      const cellFg = isDash ? (style.borderFg || fg) : (style.hintFg || fg);
      const cellAttrs = isDash ? attrs : 0;
      screen.setCell(sx + i, yy, ch, cellFg, bg, cellAttrs);
    }
  }
}

module.exports = { drawBorder };
