const { Rect } = require('./Constraints');

// Stack places children on top of each other with optional alignment.
// children: [{ align: 'top-left'|'center'|'bottom', dx, dy, width, height }]
function layoutStack({ x, y, width, height, children = [] }) {
  const rects = [];
  for (const c of children) {
    let cx = x + (c.dx || 0);
    let cy = y + (c.dy || 0);
    let w = c.width != null ? c.width : width;
    let h = c.height != null ? c.height : height;
    const align = c.align || 'top-left';
    if (align === 'center') {
      cx = x + Math.floor((width - w) / 2) + (c.dx || 0);
      cy = y + Math.floor((height - h) / 2) + (c.dy || 0);
    } else if (align === 'bottom') {
      cy = y + height - h + (c.dy || 0);
    }
    rects.push(Rect(cx, cy, w, h));
  }
  return rects;
}

module.exports = { layoutStack };

