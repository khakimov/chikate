#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Scheduler } = require('../src/scheduler/Scheduler');
const { Text } = require('../src/widgets/Text');
const { ProgressBar } = require('../src/widgets/ProgressBar');
const { setTheme } = require('../src/theme/theme');

function main() {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 30 });
  setTheme('legacy');

  let step = 0;
  const total = 5;
  const bar = new ProgressBar({ x: 2, y: 2, width: 40, value: step, max: total, label: 'Update plan', charset: 'solid', showCounts: true });

  sched.on('paint', () => {
    screen.beginFrame();
    bar.paint(screen);
    Text(screen, { x: 2, y: 4, text: 'Press q to quit; space to advance' });
  });

  sched.on('render', () => {
    screen.endFrame();
  });

  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => {
    if (key === 'q' || key === '\u0003') { cleanup(); process.exit(0); }
    if (key === ' ') {
      step = Math.min(total, step + 1);
      bar.set(step, total);
      sched.requestFrame();
    }
  });

  // Alt screen & clear
  process.stdout.write('\u001b[?1049h');
  process.stdout.write('\u001b[2J');
  process.stdout.write('\u001b[H');

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);

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

