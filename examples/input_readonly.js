#!/usr/bin/env node
const { Screen } = require('../src/screen/Screen');
const { Box } = require('../src/widgets/Box');
const { Text } = require('../src/widgets/Text');
const { InputField } = require('../src/widgets/InputField');

function main() {
  const screen = new Screen();
  const { width: W, height: H } = screen.size();

  const pad = 2;
  const iw = Math.max(20, W - pad * 2);
  const ih = 3;
  const ix = Math.floor((W - iw) / 2);
  const iy = H - ih - 1; // 1 line margin from bottom

  screen.beginFrame();
  // Title box at top
  const tbw = Math.min(50, W - 4);
  const tbx = Math.floor((W - tbw) / 2);
  const { getTheme } = require('../src/theme/theme');
  const t = getTheme();
  Box(screen, { x: tbx, y: 2, width: tbw, height: 5, title: 'Input (read-only)', style: { borderFg: t.border, titleFg: t.title, titleAttrs: t.titleAttrs } });
  Text(screen, { x: tbx + 2, y: 4, text: 'This input renders borders + placeholder + hint.', style: { fg: t.fg, maxWidth: tbw - 4 } });

  // Input field (read-only)
  const input = new InputField({
    x: ix, y: iy, width: iw, height: ih,
    title: 'Message',
    value: '',
    placeholder: 'Type your message… (read-only demo)',
    hint: 'Press any key to exit',
    readOnly: true,
  });
  input.paint(screen);
  screen.endFrame();
}

// Alt screen enter and clear
process.stdout.write('\u001b[?1049h');
process.stdout.write('\u001b[2J');
process.stdout.write('\u001b[H');

// Wait for a key to exit
const stdin = process.stdin;
stdin.setRawMode && stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', () => { cleanup(); process.exit(0); });

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);

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
