const { Screen } = require('../screen/Screen');
const { Scheduler } = require('../scheduler/Scheduler');
const { TimerRegistry } = require('../time/Timer');
const { KeyParser } = require('../input/KeyParser');

function withApp(run, { enableBracketedPaste = true, loop = false, cursorStyle = null, resizeDebounceMs = 32 } = {}) {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 30 });
  const timers = new TimerRegistry();
  const keys = new KeyParser({ enableBracketedPaste });
  // Alt screen & clear
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');
  // Optional cursor style (DECSCUSR)
  if (cursorStyle) {
    const map = { 'blink-block': 1, 'block': 2, 'blink-underline': 3, 'underline': 4, 'blink-bar': 5, 'bar': 6 };
    const ps = map[cursorStyle] || null;
    if (ps != null) { try { process.stdout.write(`\u001b[${ps} q`); } catch {} }
  }

  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  function cleanup() {
    try { process.stdin.setRawMode && process.stdin.setRawMode(false); } catch {}
    process.stdout.write('\u001b[0m');
    process.stdout.write('\u001b[?25h');
    if (cursorStyle) { try { process.stdout.write('\u001b[0 q'); } catch {} }
    process.stdout.write('\u001b[?1049l');
  }

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);
  let _resizeTimer = null;
  process.stdout.on('resize', () => {
    try {
      screen.resize(process.stdout.columns || 80, process.stdout.rows || 24);
      // Render immediately after resize to avoid visible artifacts while shrinking
      sched.forceFrame();
      if (_resizeTimer) { clearTimeout(_resizeTimer); _resizeTimer = null; }
      if (resizeDebounceMs > 0) {
        _resizeTimer = setTimeout(() => { _resizeTimer = null; sched.forceFrame(); }, resizeDebounceMs);
      }
    } catch {}
  });

  const api = { screen, sched, stdin, timers, keys, cleanup };
  // Attach keys by default (caller can also attach manually)
  keys.attach(stdin);
  const stop = run(api) || (() => {});
  // Kick one initial frame so first paint runs
  sched.requestFrame();
  // Optional loop (off by default). Prefer event-driven frames.
  if (loop) {
    (function tick() { sched.requestFrame(); setTimeout(tick, 0); })();
  }
  return stop;
}

module.exports = { withApp };
