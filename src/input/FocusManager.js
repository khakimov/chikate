class FocusManager {
  constructor() {
    this._nodes = [];
    this._index = -1;
  }

  add(node) {
    // node: { handleKey(key): boolean, onFocus?(), onBlur?(), isEnabled?():boolean }
    this._nodes.push(node);
    if (this._index === -1) this._index = 0;
    return node;
  }

  remove(node) {
    const i = this._nodes.indexOf(node);
    if (i >= 0) {
      if (this._index === i && node.onBlur) try { node.onBlur(); } catch {}
      this._nodes.splice(i, 1);
      if (this._index >= this._nodes.length) this._index = this._nodes.length - 1;
    }
  }

  setFocus(node) {
    const i = this._nodes.indexOf(node);
    if (i === -1) return false;
    const prev = this.current();
    if (prev && prev.onBlur) try { prev.onBlur(); } catch {}
    this._index = i;
    const cur = this.current();
    if (cur && cur.onFocus) try { cur.onFocus(); } catch {}
    return true;
  }

  current() {
    if (this._index < 0 || this._index >= this._nodes.length) return null;
    return this._nodes[this._index] || null;
  }

  next() {
    if (!this._nodes.length) return null;
    let n = this._index;
    for (let k = 0; k < this._nodes.length; k++) {
      n = (n + 1) % this._nodes.length;
      const cand = this._nodes[n];
      if (!cand || (typeof cand.isEnabled === 'function' && !cand.isEnabled())) continue;
      return this.setFocus(cand), cand;
    }
    return null;
  }

  prev() {
    if (!this._nodes.length) return null;
    let n = this._index;
    for (let k = 0; k < this._nodes.length; k++) {
      n = (n - 1 + this._nodes.length) % this._nodes.length;
      const cand = this._nodes[n];
      if (!cand || (typeof cand.isEnabled === 'function' && !cand.isEnabled())) continue;
      return this.setFocus(cand), cand;
    }
    return null;
  }

  handleKey(key) {
    if (key === '\t') { this.next(); return true; }
    if (key === '\u001b[Z') { this.prev(); return true; } // Shift+Tab
    const cur = this.current();
    if (!cur || typeof cur.handleKey !== 'function') return false;
    return cur.handleKey(key) === true;
  }
}

module.exports = { FocusManager };

