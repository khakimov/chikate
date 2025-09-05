class TimerRegistry {
  constructor() {
    this._timeouts = new Set();
    this._intervals = new Set();
  }

  after(ms, fn) {
    const id = setTimeout(() => { this._timeouts.delete(id); try { fn(); } catch {} }, ms);
    this._timeouts.add(id);
    return id;
  }

  every(ms, fn) {
    const id = setInterval(() => { try { fn(); } catch {} }, ms);
    this._intervals.add(id);
    return id;
  }

  clear(id) {
    if (this._timeouts.has(id)) { clearTimeout(id); this._timeouts.delete(id); }
    if (this._intervals.has(id)) { clearInterval(id); this._intervals.delete(id); }
  }

  dispose() {
    for (const id of this._timeouts) clearTimeout(id);
    for (const id of this._intervals) clearInterval(id);
    this._timeouts.clear();
    this._intervals.clear();
  }
}

module.exports = { TimerRegistry };

