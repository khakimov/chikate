class StatusManager {
  constructor() {
    this._map = new Map(); // key -> entry
    this._order = []; // keys in insertion order
  }

  add(key, widget, { label, commitText, onClose } = {}) {
    if (this._map.has(key)) return this._map.get(key);
    const entry = { key, widget, open: false, label: label || key, commitText: commitText || null, onClose: onClose || null };
    this._map.set(key, entry);
    this._order.push(key);
    return entry;
  }

  remove(key) {
    if (!this._map.has(key)) return;
    this._map.delete(key);
    this._order = this._order.filter(k => k !== key);
  }

  open(key) {
    const e = this._map.get(key); if (!e) return;
    e.open = true;
  }

  close(key) {
    const e = this._map.get(key); if (!e) return;
    if (!e.open) return;
    e.open = false;
    if (typeof e.onClose === 'function') e.onClose(e);
  }

  toggle(key) { const e = this._map.get(key); if (!e) return; e.open ? this.close(key) : this.open(key); }
  isOpen(key) { const e = this._map.get(key); return !!(e && e.open); }

  getActive() {
    // return open entries in insertion order
    const result = [];
    for (const k of this._order) { const e = this._map.get(k); if (e && e.open) result.push(e); }
    return result;
  }
}

module.exports = { StatusManager };

