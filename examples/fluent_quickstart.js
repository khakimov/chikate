#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Scheduler } = require('../src/scheduler/Scheduler');
const { Page } = require('../src/facade/Page');
const { Box } = require('../src/fluent/Box');
const { Input } = require('../src/fluent/Input');
const { Popup } = require('../src/fluent/Popup');
const { Progress } = require('../src/fluent/Progress');
const { OverlayStack } = require('../src/overlay/OverlayStack');
const { Keys } = require('../src/input/Keys');
const { setTheme } = require('../src/theme/theme');

function main() {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 30 });
  const overlays = new OverlayStack();
  setTheme('legacy');

  const page = Page.full(screen).margin(2);
  const input = Input().placeholder('Type /help, press Enter').multiline().autoHeight().build();
  const progress = Progress('Update plan').solid().value(3, 5);

  const bindings = Keys.map({
    'Ctrl+C|q': () => { cleanup(); process.exit(0); },
    '?|/': () => Popup('Help').size(60, 12).borderless().body('Hello from fluent API').open(overlays),
  });

  sched.on('paint', () => {
    screen.beginFrame();
    const [histR, inputR] = page.column(1).add({ flex: 1, minHeight: 6 }, { minHeight: input.measureHeightForWidth(page.bounds().width) });
    // Draw areas
    Box().titled('History').rounded().draw(screen, histR);
    input.paint(screen, Object.assign(input.cfg, { x: inputR.x, y: inputR.y, width: inputR.width, height: inputR.height }));
    // Progress
    const pr = { x: page.bounds().x, y: histR.y + 1, width: Math.min(40, histR.width - 4) };
    progress.draw(screen, pr);
    overlays.paint(screen);
  });

  sched.on('render', () => screen.endFrame());

  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => { if (overlays.isOpen()) { overlays.handleKey(key); } else if (!bindings(key)) { input.handleKey(key); } sched.requestFrame(); });

  // Alt screen
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.stdout.on('resize', () => { screen.resize(process.stdout.columns, process.stdout.rows); sched.requestFrame(); });

  function loop() { sched.requestFrame(); setTimeout(loop, 0); }
  loop();
}

let cleaned = false;
function cleanup() {
  if (cleaned) return; cleaned = true;
  try { process.stdin.setRawMode && process.stdin.setRawMode(false); } catch {}
  process.stdout.write('\u001b[0m');
  process.stdout.write('\u001b[?25h');
  process.stdout.write('\u001b[?1049l');
}

main();

