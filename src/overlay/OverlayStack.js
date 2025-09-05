class OverlayStack {
  constructor() {
    this.stack = [];
  }

  push(overlay) {
    this.stack.push(overlay);
  }

  pop() {
    return this.stack.pop();
  }

  top() {
    return this.stack.length ? this.stack[this.stack.length - 1] : null;
  }

  clear() {
    this.stack.length = 0;
  }

  isOpen() {
    return this.stack.length > 0;
  }

  handleKey(key) {
    const top = this.top();
    if (!top) return false;
    if (typeof top.handleKey === 'function') return top.handleKey(key) === true;
    return false;
  }

  paint(screen) {
    // Optional global backdrop: if topmost overlay defines paintBackdrop, draw it once
    const top = this.top();
    if (top && typeof top.paintBackdrop === 'function') top.paintBackdrop(screen);
    for (const overlay of this.stack) {
      if (typeof overlay.paint === 'function') overlay.paint(screen);
    }
  }
}

module.exports = { OverlayStack };
