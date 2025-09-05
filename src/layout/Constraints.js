class Constraints {
  constructor({ minW = 0, maxW = Infinity, minH = 0, maxH = Infinity } = {}) {
    this.minW = minW; this.maxW = maxW; this.minH = minH; this.maxH = maxH;
  }
  constrainW(w) { return Math.max(this.minW, Math.min(this.maxW, w)); }
  constrainH(h) { return Math.max(this.minH, Math.min(this.maxH, h)); }
  constrainSize({ width, height }) { return { width: this.constrainW(width), height: this.constrainH(height) }; }
}

function Size(width, height) { return { width, height }; }
function Rect(x, y, width, height) { return { x, y, width, height }; }

module.exports = { Constraints, Size, Rect };

