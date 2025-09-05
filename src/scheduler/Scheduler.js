// Simple frame scheduler with phases and coalesced requestFrame

class Scheduler {
  constructor({ fps = 60, now = () => Date.now() } = {}) {
    this.fps = fps;
    this.now = now;
    this.lastFrameTime = 0;
    this._queued = false;
    this._running = false;
    this._phases = {
      build: new Set(),
      layout: new Set(),
      paint: new Set(),
      render: new Set(),
    };
  }

  on(phase, cb) {
    if (!this._phases[phase]) throw new Error(`Unknown phase: ${phase}`);
    this._phases[phase].add(cb);
    return () => this.off(phase, cb);
  }

  off(phase, cb) {
    if (this._phases[phase]) this._phases[phase].delete(cb);
  }

  setFps(fps) {
    this.fps = fps;
  }

  requestFrame() {
    if (this._queued) return;
    this._queued = true;
    setImmediate(() => this._tick());
  }

  // Run a frame immediately, bypassing FPS throttle and queue.
  // Safe against reentrancy: if already running, queue a normal frame instead.
  forceFrame() {
    if (this._running) { this.requestFrame(); return; }
    this._queued = false;
    this._runAll();
  }

  _tick() {
    this._queued = false;
    const now = this.now();
    const minDelta = 1000 / (this.fps || 60);
    if (now - this.lastFrameTime < minDelta) {
      const delay = Math.max(0, Math.ceil(minDelta - (now - this.lastFrameTime)));
      setTimeout(() => this._tick(), delay);
      return;
    }
    this._runAll();
  }

  _run(phase) {
    for (const cb of this._phases[phase]) {
      try { cb(); } catch (e) { /* eslint-disable no-console */ console.error(`[scheduler:${phase}]`, e); }
    }
  }

  _runAll() {
    this._running = true;
    this.lastFrameTime = this.now();
    this._run('build');
    this._run('layout');
    this._run('paint');
    this._run('render');
    this._running = false;
  }
}

module.exports = { Scheduler };
