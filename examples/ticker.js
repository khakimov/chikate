#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Scheduler } = require('../src/scheduler/Scheduler');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { OverlayStack } = require('../src/overlay/OverlayStack');
const { PopupOverlay } = require('../src/widgets/PopupOverlay');

function main() {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 10 });
  const overlays = new OverlayStack();
  const { width: W, height: H } = screen.size();
  const bw = 30, bh = 7;
  const bx = Math.floor((W - bw) / 2);
  const by = Math.floor((H - bh) / 2);

  let ticks = 0;

  sched.on('build', () => {
    ticks++;
  });

  const { getTheme, setTheme } = require('../src/theme/theme');
  setTheme('legacy');
  let t = getTheme();
  sched.on('paint', () => {
    screen.beginFrame();
    Box(screen, { x: bx, y: by, width: bw, height: bh, title: 'Scheduler', style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
    Text(screen, { x: bx + 2, y: by + 2, text: `Ticks: ${ticks}`, style: { fg: t.fg } });
    Text(screen, { x: bx + 2, y: by + 4, text: `F1 for help • Ctrl+C twice to exit`, style: { fg: t.hint } });
    overlays.paint(screen);
  });

  sched.on('render', () => {
    screen.endFrame();
  });

  // Input to quit
  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => {
    // Overlay intercepts input when open
    if (overlays.isOpen()) {
      const consumed = overlays.handleKey(key);
      if (consumed) {
        if (!overlays.isOpen()) sched.requestFrame();
        return;
      }
    }
    // Global shortcuts
    if (key === '\u001bOP' || key === '\u001b[11~' ) { // F1
      if (!overlays.isOpen()) {
        const helpBody = `This is the help popup.\n\n` +
          `Controls while open:\n` +
          `  Up/Down or j/k: scroll one line\n` +
          `  PgUp/PgDn: page scroll\n` +
          `  Home/End: jump to start/end\n` +
          `  Esc: close\n\n` +
          `Scroll test lines:\n` +
          Array.from({ length: 60 }, (_, i) => `  • Item ${i + 1}: lorem ipsum dolor sit amet`).join('\n');
        const popup = new PopupOverlay({ title: 'Help', body: helpBody, width: 50, height: 14 });
        popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
        overlays.push(popup);
        sched.requestFrame();
      }
      return;
    }
    if (key === 'T') { tToggle(); sched.requestFrame(); return; }
    if (key === '\u0003') { // Ctrl-C
      if (exitConfirm) { cleanup(); process.exit(0); }
      exitConfirm = true;
      const popup = new PopupOverlay({ title: 'Exit', body: 'Press Ctrl+C again to exit', width: 34, height: 6 });
      popup.onRequestClose(() => { overlays.pop(); sched.requestFrame(); });
      overlays.push(popup);
      sched.requestFrame();
      if (exitTimer) clearTimeout(exitTimer);
      exitTimer = setTimeout(() => { exitConfirm = false; if (overlays.isOpen()) overlays.pop(); sched.requestFrame(); }, 1200);
    }
  });

  // Alt screen & clear
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');

  // Let Ctrl+C be handled in the key handler for double-confirm UX
  process.on('exit', cleanup);

  function loop() { sched.requestFrame(); setTimeout(loop, 0); }
  loop();

  function tToggle() {
    // Cycle themes quickly
    const names = ['legacy', 'dark', 'light'];
    const cur = getTheme().name;
    const idx = names.indexOf(cur);
    const next = names[(idx + 1) % names.length];
    setTheme(next);
    t = getTheme();
  }
}

let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try { process.stdin.setRawMode && process.stdin.setRawMode(false); } catch {}
  process.stdout.write('\u001b[0m');
  process.stdout.write('\u001b[?25h');
  process.stdout.write('\u001b[?1049l');
}

let exitConfirm = false;
let exitTimer = null;

main();
