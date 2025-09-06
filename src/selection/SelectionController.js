class SelectionController {
  constructor() {
    this._base = null;   // global index
    this._extent = null; // global index
    this._dragging = false;
    this._listeners = new Set();
  }

  addListener(fn) { if (typeof fn === 'function') this._listeners.add(fn); }
  removeListener(fn) { this._listeners.delete(fn); }
  _notify() { for (const fn of this._listeners) { try { fn(); } catch {} } }

  clear() { this._base = this._extent = null; this._dragging = false; this._notify(); }
  hasSelection() {
    return Number.isInteger(this._base) && Number.isInteger(this._extent) && this._base !== this._extent;
  }
  getRange() {
    if (!Number.isInteger(this._base) || !Number.isInteger(this._extent)) return null;
    const a = Math.min(this._base, this._extent);
    const b = Math.max(this._base, this._extent);
    return { start: a, end: b };
  }
  press(at) { this._base = this._extent = Math.max(0, at | 0); this._dragging = true; this._notify(); }
  drag(at) { if (this._dragging) { this._extent = Math.max(0, at | 0); this._notify(); } }
  release(at) { if (this._dragging) { this._extent = Math.max(0, at | 0); this._dragging = false; this._notify(); } }
}

module.exports = { SelectionController };

