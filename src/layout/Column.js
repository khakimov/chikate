const { Rect } = require('./Constraints');

// Lay out children vertically.
// children: [{ minHeight=0, flex=0, marginTop=0, marginBottom=0 }]
function layoutColumn({ x, y, width, height, gap = 0, children = [] }) {
  const fixed = children.filter(c => !c.flex || c.flex <= 0);
  const flex = children.filter(c => c.flex && c.flex > 0);
  let used = Math.max(0, (children.length - 1) * gap);
  for (const c of children) used += (c.minHeight || 0) + (c.marginTop || 0) + (c.marginBottom || 0);
  const remaining = Math.max(0, height - used);
  const totalFlex = flex.reduce((s, c) => s + (c.flex || 0), 0) || 1;

  const rects = [];
  let cy = y;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    const base = (c.minHeight || 0);
    const add = (c.flex && c.flex > 0) ? Math.floor(remaining * (c.flex / totalFlex)) : 0;
    const h = Math.max(0, base + add);
    cy += (c.marginTop || 0);
    rects.push(Rect(x, cy, width, h));
    cy += h + (c.marginBottom || 0);
    if (i < children.length - 1) cy += gap;
  }
  return rects;
}

module.exports = { layoutColumn };

