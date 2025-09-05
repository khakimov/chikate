#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Scheduler } = require('../src/scheduler/Scheduler');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { InputField } = require('../src/widgets/InputField');

function main() {
  const screen = new Screen();
  const sched = new Scheduler({ fps: 30 });
  const { width: W, height: H } = screen.size();

  const iw = Math.max(40, W - 4);
  const ih = 5;
  const ix = 2;
  const iy = H - ih - 2;

  const input = new InputField({
    x: ix, y: iy, width: iw, height: ih, title: 'Multiline Input',
    placeholder: 'Type here. Enter submits. Ctrl+J inserts newline. Up/Down move cursor across wrapped lines.',
    hint: 'Press q to quit',
    allowNewlines: true,
    submitOnEnter: true,
    onSubmit: (val) => { last = String(val); input.setValue(''); sched.requestFrame(); },
  });

  let last = '';

  const quitKeys = new Set(['q', '\u0003']);

  sched.on('paint', () => {
    screen.beginFrame();
    Box(screen, { x: 2, y: 2, width: iw, height: 6, title: 'Output' });
    Text(screen, { x: 4, y: 4, text: last ? `Submitted (${last.length} chars):\n${last}` : 'Nothing submitted yet', style: { fg: { r: 200, g: 200, b: 200 }, maxWidth: iw - 4 } });
    input.paint(screen);
  });

  sched.on('render', () => {
    const { x, y } = input.getCursorScreenPos();
    screen.endFrame({ cursor: { x, y }, showCursor: true });
  });

  const stdin = process.stdin;
  stdin.setRawMode && stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (key) => {
    if (quitKeys.has(key)) { cleanup(); process.exit(0); }
    const consumed = input.handleKey(key);
    if (consumed) sched.requestFrame();
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
  if (cleaned) return;
  cleaned = true;
  try { process.stdin.setRawMode && process.stdin.setRawMode(false); } catch {}
  process.stdout.write('\u001b[0m');
  process.stdout.write('\u001b[?25h');
  process.stdout.write('\u001b[?1049l');
}

main();

