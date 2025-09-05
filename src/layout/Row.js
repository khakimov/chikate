const { Rect } = require('./Constraints');

// Lay out children horizontally.
// children: [{ minWidth=0, flex=0, marginLeft=0, marginRight=0 }]
function layoutRow({ x, y, width, height, gap = 0, children = [] }) {
  const fixed = children.filter(c => !c.flex || c.flex <= 0);
  const flex = children.filter(c => c.flex && c.flex > 0);
  let used = Math.max(0, (children.length - 1) * gap);
  for (const c of children) used += (c.minWidth || 0) + (c.marginLeft || 0) + (c.marginRight || 0);
  const remaining = Math.max(0, width - used);
  const totalFlex = flex.reduce((s, c) => s + (c.flex || 0), 0) || 1;

  const rects = [];
  let cx = x;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    const base = (c.minWidth || 0);
    const add = (c.flex && c.flex > 0) ? Math.floor(remaining * (c.flex / totalFlex)) : 0;
    const w = Math.max(0, base + add);
    cx += (c.marginLeft || 0);
    rects.push(Rect(cx, y, w, height));
    cx += w + (c.marginRight || 0);
    if (i < children.length - 1) cx += gap;
  }
  return rects;
}

module.exports = { layoutRow };

